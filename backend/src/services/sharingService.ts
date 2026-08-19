import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { NotFoundError, ForbiddenError, AppError } from '../middleware/errorHandler';

export interface SharedFileQuery {
  status?: string;
  permission?: string;
  search?: string;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class SharingService {
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ─── Public Links ────────────────────────────────────────────────
  async createPublicLink(
    fileId: string,
    userId: string,
    options?: { expiresAt?: Date; password?: string }
  ) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError('You can only share your own files');

    const token = this.generateToken();
    let passwordHash: string | null = null;

    if (options?.password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(options.password, salt);
    }

    const link = await prisma.publicLink.create({
      data: {
        token,
        fileId,
        userId,
        expiresAt: options?.expiresAt || null,
        passwordHash,
      },
    });

    // Make file public
    await prisma.file.update({
      where: { id: fileId },
      data: { isPublic: true },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'share',
        resourceType: 'file',
        resourceId: fileId,
        details: JSON.stringify({ type: 'public_link', token }),
      },
    });

    return {
      id: link.id,
      token: link.token,
      url: `/public/${link.token}`,
      expiresAt: link.expiresAt,
      hasPassword: !!passwordHash,
      createdAt: link.createdAt,
    };
  }

  async getPublicFile(token: string, password?: string) {
    const link = await prisma.publicLink.findUnique({
      where: { token },
      include: {
        file: {
          include: {
            owner: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!link) throw new NotFoundError('Link');

    // Check expiration
    if (link.expiresAt && new Date() > link.expiresAt) {
      throw new AppError('This link has expired', 410);
    }

    // Check password
    if (link.passwordHash) {
      if (!password) {
        return { requiresPassword: true, file: null };
      }
      const isValid = await bcrypt.compare(password, link.passwordHash);
      if (!isValid) {
        throw new ForbiddenError('Invalid password');
      }
    }

    // Increment access count
    await prisma.publicLink.update({
      where: { id: link.id },
      data: { accessCount: { increment: 1 } },
    });

    return {
      requiresPassword: false,
      file: {
        id: link.file.id,
        name: link.file.name,
        mimeType: link.file.mimeType,
        size: Number(link.file.size),
        uploadedAt: link.file.uploadedAt,
        owner: link.file.owner,
      },
    };
  }

  async getFileShares(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError();

    const [publicLinks, userShares] = await Promise.all([
      prisma.publicLink.findMany({
        where: { fileId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sharedFile.findMany({
        where: { fileId },
        include: {
          sharedWith: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      publicLinks: publicLinks.map((link) => ({
        id: link.id,
        token: link.token,
        url: `/public/${link.token}`,
        accessCount: link.accessCount,
        expiresAt: link.expiresAt,
        hasPassword: !!link.passwordHash,
        createdAt: link.createdAt,
      })),
      userShares: userShares.map((share) => ({
        id: share.id,
        fileId: share.fileId,
        sharedWith: {
          id: share.sharedWith.id,
          name: `${share.sharedWith.firstName} ${share.sharedWith.lastName}`.trim(),
          email: share.sharedWith.email,
          avatar: share.sharedWith.avatar,
        },
        permission: share.permission,
        status: share.status,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt,
      })),
    };
  }

  async revokePublicLink(token: string, userId: string) {
    const link = await prisma.publicLink.findUnique({
      where: { token },
    });

    if (!link) throw new NotFoundError('Link');
    if (link.userId !== userId) throw new ForbiddenError();

    await prisma.publicLink.delete({ where: { id: link.id } });

    // Check if file has other public links
    const remainingLinks = await prisma.publicLink.count({
      where: { fileId: link.fileId },
    });

    if (remainingLinks === 0) {
      await prisma.file.update({
        where: { id: link.fileId },
        data: { isPublic: false },
      });
    }

    return { message: 'Link revoked successfully' };
  }

  // ─── User-to-User Sharing ────────────────────────────────────────

  async shareFileWithUser(
    fileId: string,
    sharedById: string,
    data: {
      recipientEmailOrId: string;
      permission?: 'view' | 'download' | 'upload';
      expiresAt?: Date | null;
      status?: string;
    }
  ) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== sharedById) throw new ForbiddenError('You can only share your own files');

    const identifier = data.recipientEmailOrId.trim();
    const recipient = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { id: identifier },
        ],
      },
    });

    if (!recipient) {
      throw new NotFoundError('Recipient user with that email does not exist');
    }

    if (recipient.id === sharedById) {
      throw new AppError('You cannot share a file with yourself', 400);
    }

    const permission = data.permission && ['view', 'download', 'upload'].includes(data.permission)
      ? data.permission
      : 'view';

    const status = data.status || 'active';

    const share = await prisma.sharedFile.upsert({
      where: {
        fileId_sharedWithId: {
          fileId,
          sharedWithId: recipient.id,
        },
      },
      update: {
        permission,
        status,
        expiresAt: data.expiresAt || null,
        sharedById,
      },
      create: {
        fileId,
        sharedById,
        sharedWithId: recipient.id,
        permission,
        status,
        expiresAt: data.expiresAt || null,
      },
      include: {
        file: true,
        sharedWith: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: sharedById,
        action: 'share',
        resourceType: 'file',
        resourceId: fileId,
        details: JSON.stringify({
          type: 'user_share',
          recipient: recipient.email,
          permission,
        }),
      },
    });

    return {
      id: share.id,
      fileId: share.fileId,
      fileName: share.file.name,
      sharedWith: {
        id: share.sharedWith.id,
        name: `${share.sharedWith.firstName} ${share.sharedWith.lastName}`.trim(),
        email: share.sharedWith.email,
        avatar: share.sharedWith.avatar,
      },
      permission: share.permission,
      status: share.status,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
    };
  }

  async getFilesSharedWithMe(userId: string, query: SharedFileQuery) {
    const {
      status = 'all',
      permission,
      search,
      sort = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const now = new Date();
    const where: any = {
      sharedWithId: userId,
      file: { deletedAt: null },
    };

    if (status === 'active') {
      where.status = 'active';
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
    } else if (status === 'expired') {
      where.expiresAt = { lte: now };
    } else if (status === 'pending' || status === 'rejected') {
      where.status = status;
    } else if (status !== 'all') {
      where.status = status;
    }

    if (permission && permission !== 'all' && ['view', 'download', 'upload'].includes(permission)) {
      where.permission = permission;
    }

    if (search) {
      where.OR = [
        { file: { name: { contains: search, mode: 'insensitive' } } },
        { sharedBy: { firstName: { contains: search, mode: 'insensitive' } } },
        { sharedBy: { lastName: { contains: search, mode: 'insensitive' } } },
        { sharedBy: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let orderBy: any = { createdAt: sortOrder };
    if (sort === 'name') {
      orderBy = { file: { name: sortOrder } };
    } else if (sort === 'sharedBy') {
      orderBy = { sharedBy: { firstName: sortOrder } };
    } else if (sort === 'size') {
      orderBy = { file: { size: sortOrder } };
    }

    const [shares, total, pendingCount] = await Promise.all([
      prisma.sharedFile.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          file: true,
          sharedBy: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
      }),
      prisma.sharedFile.count({ where }),
      prisma.sharedFile.count({
        where: {
          sharedWithId: userId,
          status: 'pending',
          file: { deletedAt: null },
        },
      }),
    ]);

    const data = shares.map((s) => {
      const isExpired = s.expiresAt ? new Date(s.expiresAt) <= now : false;
      const computedStatus = isExpired ? 'expired' : s.status;

      return {
        id: s.id,
        fileId: s.fileId,
        fileName: s.file.name,
        fileSize: Number(s.file.size),
        fileMimeType: s.file.mimeType,
        sharedBy: {
          id: s.sharedBy.id,
          name: `${s.sharedBy.firstName} ${s.sharedBy.lastName}`.trim(),
          email: s.sharedBy.email,
          avatar: s.sharedBy.avatar,
        },
        permission: s.permission as 'view' | 'download' | 'upload',
        sharedAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
        status: computedStatus,
        file: {
          id: s.file.id,
          name: s.file.name,
          mimeType: s.file.mimeType,
          size: Number(s.file.size),
          uploadedAt: s.file.uploadedAt.toISOString(),
          isPublic: s.file.isPublic,
        },
      };
    });

    return {
      data,
      total,
      pendingCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFilesSharedByMe(userId: string, query: SharedFileQuery) {
    const {
      status = 'all',
      permission,
      search,
      sort = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const now = new Date();
    const where: any = {
      sharedById: userId,
      file: { deletedAt: null },
    };

    if (status === 'active') {
      where.status = 'active';
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
    } else if (status === 'expired') {
      where.expiresAt = { lte: now };
    } else if (status === 'pending' || status === 'rejected') {
      where.status = status;
    } else if (status !== 'all') {
      where.status = status;
    }

    if (permission && permission !== 'all' && ['view', 'download', 'upload'].includes(permission)) {
      where.permission = permission;
    }

    if (search) {
      where.OR = [
        { file: { name: { contains: search, mode: 'insensitive' } } },
        { sharedWith: { firstName: { contains: search, mode: 'insensitive' } } },
        { sharedWith: { lastName: { contains: search, mode: 'insensitive' } } },
        { sharedWith: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let orderBy: any = { createdAt: sortOrder };
    if (sort === 'name') {
      orderBy = { file: { name: sortOrder } };
    } else if (sort === 'sharedWith') {
      orderBy = { sharedWith: { firstName: sortOrder } };
    } else if (sort === 'size') {
      orderBy = { file: { size: sortOrder } };
    }

    const [shares, total] = await Promise.all([
      prisma.sharedFile.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          file: true,
          sharedWith: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
      }),
      prisma.sharedFile.count({ where }),
    ]);

    const data = shares.map((s) => {
      const isExpired = s.expiresAt ? new Date(s.expiresAt) <= now : false;
      const computedStatus = isExpired ? 'expired' : s.status;

      return {
        id: s.id,
        fileId: s.fileId,
        fileName: s.file.name,
        fileSize: Number(s.file.size),
        fileMimeType: s.file.mimeType,
        sharedWith: {
          id: s.sharedWith.id,
          name: `${s.sharedWith.firstName} ${s.sharedWith.lastName}`.trim(),
          email: s.sharedWith.email,
          avatar: s.sharedWith.avatar,
        },
        permission: s.permission as 'view' | 'download' | 'upload',
        sharedAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
        status: computedStatus,
        file: {
          id: s.file.id,
          name: s.file.name,
          mimeType: s.file.mimeType,
          size: Number(s.file.size),
          uploadedAt: s.file.uploadedAt.toISOString(),
          isPublic: s.file.isPublic,
        },
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async acceptShare(shareId: string, userId: string) {
    const share = await prisma.sharedFile.findUnique({
      where: { id: shareId },
      include: { file: true },
    });

    if (!share) throw new NotFoundError('Share');
    if (share.sharedWithId !== userId) {
      throw new ForbiddenError('You are not the recipient of this share');
    }

    const updated = await prisma.sharedFile.update({
      where: { id: shareId },
      data: { status: 'active' },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'accept_share',
        resourceType: 'file',
        resourceId: share.fileId,
        details: JSON.stringify({ fileName: share.file.name }),
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      message: 'Share accepted',
    };
  }

  async rejectShare(shareId: string, userId: string) {
    const share = await prisma.sharedFile.findUnique({
      where: { id: shareId },
      include: { file: true },
    });

    if (!share) throw new NotFoundError('Share');
    if (share.sharedWithId !== userId) {
      throw new ForbiddenError('You are not the recipient of this share');
    }

    const updated = await prisma.sharedFile.update({
      where: { id: shareId },
      data: { status: 'rejected' },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'reject_share',
        resourceType: 'file',
        resourceId: share.fileId,
        details: JSON.stringify({ fileName: share.file.name }),
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      message: 'Share rejected',
    };
  }

  async deleteShare(shareId: string, userId: string) {
    const share = await prisma.sharedFile.findUnique({
      where: { id: shareId },
      include: { file: true },
    });

    if (!share) throw new NotFoundError('Share');
    if (share.sharedById !== userId && share.sharedWithId !== userId) {
      throw new ForbiddenError('You do not have permission to remove this share');
    }

    await prisma.sharedFile.delete({
      where: { id: shareId },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'remove_share',
        resourceType: 'file',
        resourceId: share.fileId,
        details: JSON.stringify({
          shareId,
          fileName: share.file.name,
          removedBy: userId === share.sharedById ? 'sharer' : 'recipient',
        }),
      },
    });

    return {
      deleted: true,
      message: 'Share removed',
    };
  }

  async moveToPrivate(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) {
      throw new ForbiddenError('You can only modify files you own');
    }

    // Remove all direct shares and public links for this file
    await Promise.all([
      prisma.sharedFile.deleteMany({ where: { fileId } }),
      prisma.publicLink.deleteMany({ where: { fileId } }),
      prisma.file.update({
        where: { id: fileId },
        data: { isPublic: false },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'move_to_private',
        resourceType: 'file',
        resourceId: fileId,
        details: JSON.stringify({ fileName: file.name }),
      },
    });

    return {
      success: true,
      message: 'File moved to private vault and all shares revoked',
    };
  }
}

export default new SharingService();
