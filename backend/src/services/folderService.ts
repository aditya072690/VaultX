import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';

class FolderService {
  async createFolder(name: string, ownerId: string, parentFolderId?: string) {
    if (parentFolderId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentFolderId } });
      if (!parent || parent.ownerId !== ownerId) {
        throw new NotFoundError('Parent folder');
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        ownerId,
        parentFolderId: parentFolderId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: ownerId,
        action: 'create',
        resourceType: 'folder',
        resourceId: folder.id,
        details: JSON.stringify({ folderName: name }),
      },
    });

    return folder;
  }

  async listFolders(ownerId: string, parentFolderId?: string | null, includeDeleted: boolean = false) {
    const where: any = {
      ownerId,
      deletedAt: includeDeleted ? { not: null } : null,
    };

    if (parentFolderId !== undefined && !includeDeleted) {
      where.parentFolderId = parentFolderId || null;
    }

    const folders = await prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { children: true, files: true },
        },
      },
    });

    return folders;
  }

  async getFolder(folderId: string, userId: string) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        files: {
          where: { deletedAt: null },
          orderBy: { uploadedAt: 'desc' },
        },
        parent: { select: { id: true, name: true } },
      },
    });

    if (!folder) throw new NotFoundError('Folder');
    if (folder.ownerId !== userId) throw new ForbiddenError();

    return {
      ...folder,
      files: folder.files.map((f) => ({
        ...f,
        size: Number(f.size),
      })),
    };
  }

  async renameFolder(folderId: string, newName: string, userId: string) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) throw new NotFoundError('Folder');
    if (folder.ownerId !== userId) throw new ForbiddenError();

    return prisma.folder.update({
      where: { id: folderId },
      data: { name: newName },
    });
  }

  async deleteFolder(folderId: string, userId: string) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) throw new NotFoundError('Folder');
    if (folder.ownerId !== userId) throw new ForbiddenError();

    // Soft delete folder and all its contents
    await prisma.folder.update({
      where: { id: folderId },
      data: { deletedAt: new Date() },
    });

    // Soft delete files in folder
    await prisma.file.updateMany({
      where: { folderId, ownerId: userId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Folder moved to trash' };
  }

  async getBreadcrumb(folderId: string, userId: string) {
    const breadcrumb: { id: string; name: string }[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder: { id: string; name: string; parentFolderId: string | null; ownerId: string } | null = await prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentFolderId: true, ownerId: true },
      });

      if (!folder || folder.ownerId !== userId) break;

      breadcrumb.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentFolderId;
    }

    return breadcrumb;
  }

  async restoreFolder(folderId: string, userId: string) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) throw new NotFoundError('Folder');
    if (folder.ownerId !== userId) throw new ForbiddenError();

    // Restore folder
    await prisma.folder.update({
      where: { id: folderId },
      data: { deletedAt: null },
    });

    // Restore all files inside that were soft-deleted
    // We assume all soft-deleted files inside should be restored.
    await prisma.file.updateMany({
      where: { folderId, ownerId: userId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    return { message: 'Folder restored' };
  }

  async permanentDeleteFolder(folderId: string, userId: string) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) throw new NotFoundError('Folder');
    if (folder.ownerId !== userId) throw new ForbiddenError();

    // Hard delete folder
    // Note: Due to cascading deletes configured in Prisma schema (if any), 
    // files might also be deleted automatically. If not, delete them first.
    await prisma.file.deleteMany({
      where: { folderId, ownerId: userId },
    });

    await prisma.folder.delete({
      where: { id: folderId },
    });

    return { message: 'Folder permanently deleted' };
  }
}

export default new FolderService();
