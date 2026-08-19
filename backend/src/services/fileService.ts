import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import crypto from 'crypto';
import prisma from '../config/database';
import storageService from './storageService';
import { FileListQuery } from '../types';
import { NotFoundError, ForbiddenError, AppError, QuotaExceededError } from '../middleware/errorHandler';

class FileService {
  async uploadFile(
    file: Express.Multer.File,
    ownerId: string,
    folderId?: string,
    isPrivate: boolean = false
  ) {
    // Generate unique S3 key
    const ext = path.extname(file.originalname);
    const s3Key = `${ownerId}/${uuidv4()}${ext}`;

    // Calculate MD5 hash
    const md5Hash = crypto.createHash('md5').update(file.buffer).digest('hex');

    // Check storage quota
    const user = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) throw new NotFoundError('User');

    const newUsage = Number(user.storageUsed) + file.size;
    if (newUsage > Number(user.storageLimit)) {
      // Calculate trash size to suggest recovery
      const trash = await prisma.file.aggregate({
        where: { ownerId, deletedAt: { not: null } },
        _sum: { size: true },
      }).catch(() => ({ _sum: { size: BigInt(0) } }));

      throw new QuotaExceededError(
        'Storage limit exceeded. Please delete files or upgrade your plan.',
        Number(user.storageUsed),
        Number(user.storageLimit),
        Number(trash._sum.size || 0)
      );
    }

    // Upload to storage
    await storageService.uploadFile(s3Key, file.buffer, file.mimetype);

    // Save metadata to database
    const savedFile = await prisma.file.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        s3Key,
        md5Hash,
        ownerId,
        folderId: folderId || null,
        isPrivate,
        isPublic: false,
      },
    });

    // Update user storage usage
    await prisma.user.update({
      where: { id: ownerId },
      data: { storageUsed: BigInt(newUsage) },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: ownerId,
        action: isPrivate ? 'upload_private' : 'upload',
        resourceType: 'file',
        resourceId: savedFile.id,
        details: JSON.stringify({ fileName: file.originalname, size: file.size, isPrivate }),
      },
    });

    return this.serializeFile(savedFile);
  }

  async listFiles(ownerId: string, query: FileListQuery) {
    const {
      folderId,
      search,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      isPublic,
      isPrivate,
      mimeType,
      includeDeleted = false,
    } = query;

    const where: any = {
      ownerId,
      deletedAt: includeDeleted ? undefined : null,
    };

    if (folderId !== undefined) {
      where.folderId = folderId || null;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (isPrivate !== undefined) {
      where.isPrivate = isPrivate;
    }

    if (mimeType) {
      if (mimeType === 'media') {
        where.OR = [
          { mimeType: { startsWith: 'image/' } },
          { mimeType: { startsWith: 'video/' } },
        ];
      } else if (mimeType.includes(',')) {
        where.OR = mimeType.split(',').map((t: string) => ({
          mimeType: { startsWith: t.trim() },
        }));
      } else {
        where.mimeType = { startsWith: mimeType };
      }
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          folder: { select: { id: true, name: true } },
          _count: { select: { publicLinks: true, sharedWith: true } },
        },
      }),
      prisma.file.count({ where }),
    ]);

    return {
      files: files.map(this.serializeFile),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFile(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        folder: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { publicLinks: true, sharedWith: true, downloadLogs: true } },
      },
    });

    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId && !file.isPublic) {
      // Check if shared with user
      const now = new Date();
      const shared = await prisma.sharedFile.findFirst({
        where: {
          fileId,
          sharedWithId: userId,
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      });
      if (!shared) throw new ForbiddenError('You do not have access to this file');
    }

    return this.serializeFile(file);
  }

  async downloadFile(fileId: string, userId?: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) throw new NotFoundError('File');

    // Check access and enforce permissions
    if (!file.isPublic && userId) {
      if (file.ownerId !== userId) {
        const now = new Date();
        const shared = await prisma.sharedFile.findFirst({
          where: {
            fileId,
            sharedWithId: userId,
            status: 'active',
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        });
        if (!shared) throw new ForbiddenError('You do not have access to this file');
        if (shared.permission === 'view') {
          throw new ForbiddenError('View-only permissions do not allow downloading this file');
        }
      }
    } else if (!file.isPublic && !userId) {
      throw new ForbiddenError('Authentication required');
    }

    const buffer = await storageService.downloadFile(file.s3Key);

    // Log download
    await prisma.downloadLog.create({
      data: { fileId: file.id },
    });

    return {
      buffer,
      fileName: file.name,
      mimeType: file.mimeType,
      size: Number(file.size),
    };
  }

  async previewFile(fileId: string, userId?: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) throw new NotFoundError('File');

    // Check access for preview/stream
    if (!file.isPublic && userId) {
      if (file.ownerId !== userId) {
        const now = new Date();
        const shared = await prisma.sharedFile.findFirst({
          where: {
            fileId,
            sharedWithId: userId,
            status: 'active',
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        });
        if (!shared) throw new ForbiddenError('You do not have access to this file');
        // Note: View permission is allowed to preview
      }
    } else if (!file.isPublic && !userId) {
      throw new ForbiddenError('Authentication required');
    }

    const buffer = await storageService.downloadFile(file.s3Key);

    return {
      buffer,
      fileName: file.name,
      mimeType: file.mimeType,
      size: Number(file.size),
    };
  }

  async renameFile(fileId: string, newName: string, userId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError('You can only rename your own files');

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { name: newName },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'rename',
        resourceType: 'file',
        resourceId: fileId,
        details: JSON.stringify({ oldName: file.name, newName }),
      },
    });

    return this.serializeFile(updated);
  }

  async deleteFile(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError('You can only delete your own files');

    // Soft delete
    await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'delete',
        resourceType: 'file',
        resourceId: fileId,
        details: JSON.stringify({ fileName: file.name }),
      },
    });

    return { message: 'File moved to trash' };
  }

  async restoreFile(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError('You can only restore your own files');

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: null },
    });

    return this.serializeFile(updated);
  }

  async permanentDelete(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError();

    // Delete from storage
    await storageService.deleteFile(file.s3Key);

    // Delete from database
    await prisma.file.delete({ where: { id: fileId } });

    // Update user storage
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageUsed: {
          decrement: file.size,
        },
      },
    });

    return { message: 'File permanently deleted' };
  }

  async toggleVisibility(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError();

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { isPublic: !file.isPublic },
    });

    return this.serializeFile(updated);
  }

  async moveFile(fileId: string, folderId: string | null, userId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError();

    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder || folder.ownerId !== userId) throw new NotFoundError('Folder');
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { folderId },
    });

    return this.serializeFile(updated);
  }

  async listPrivateFiles(ownerId: string, query: FileListQuery) {
    return this.listFiles(ownerId, { ...query, isPrivate: true });
  }

  async togglePrivateVault(fileId: string, userId: string, makePrivate?: boolean) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File');
    if (file.ownerId !== userId) throw new ForbiddenError('You can only modify your own files');

    const targetPrivate = makePrivate !== undefined ? makePrivate : !file.isPrivate;

    if (targetPrivate) {
      // If moving into private vault, remove any public links or shares
      await prisma.publicLink.deleteMany({ where: { fileId } });
      await prisma.sharedFile.deleteMany({ where: { fileId } });
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        isPrivate: targetPrivate,
        isPublic: targetPrivate ? false : file.isPublic,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: targetPrivate ? 'move_to_vault' : 'remove_from_vault',
        resourceType: 'file',
        resourceId: fileId,
        details: JSON.stringify({ fileName: file.name }),
      },
    });

    return this.serializeFile(updated);
  }

  // Serialize BigInt to Number for JSON responses
  private serializeFile(file: any) {
    return {
      ...file,
      size: file.size ? Number(file.size) : 0,
    };
  }
}

export default new FileService();
