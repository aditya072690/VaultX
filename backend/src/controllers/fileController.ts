import { Response, NextFunction } from 'express';
import fileService from '../services/fileService';
import { AuthenticatedRequest } from '../types';

export const uploadFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file provided' });
      return;
    }

    const { folderId } = req.body;
    const result = await fileService.uploadFile(req.file, req.userId!, folderId);

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const uploadMultiple = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ success: false, error: 'No files provided' });
      return;
    }

    const { folderId } = req.body;
    const results = await Promise.all(
      req.files.map((file: Express.Multer.File) =>
        fileService.uploadFile(file, req.userId!, folderId)
      )
    );

    res.status(201).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const listFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { folderId, search, sortBy, sortOrder, page, limit, isPublic, mimeType, includeDeleted } = req.query;

    const result = await fileService.listFiles(req.userId!, {
      folderId: folderId as string | undefined,
      search: search as string | undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      mimeType: mimeType as string | undefined,
      includeDeleted: includeDeleted === 'true',
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const file = await fileService.getFile(req.params.id as string, req.userId!);
    res.json({ success: true, data: file });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await fileService.downloadFile(req.params.id as string, req.userId);

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(result.fileName)}"`,
      'Content-Length': result.size.toString(),
    });

    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
};

export const previewFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await fileService.previewFile(req.params.id as string, req.userId);

    res.set({
      'Content-Type': result.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(result.fileName)}"`,
      'Content-Length': result.size.toString(),
      'Cache-Control': 'public, max-age=86400',
    });

    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
};

export const renameFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const result = await fileService.renameFile(req.params.id as string, name, req.userId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await fileService.deleteFile(req.params.id as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const restoreFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await fileService.restoreFile(req.params.id as string, req.userId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const permanentDelete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await fileService.permanentDelete(req.params.id as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const toggleVisibility = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await fileService.toggleVisibility(req.params.id as string, req.userId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const moveFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { folderId } = req.body;
    const result = await fileService.moveFile(req.params.id as string, folderId, req.userId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPrivateFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { folderId, search, sortBy, sortOrder, page, limit, mimeType } = req.query;

    const result = await fileService.listPrivateFiles(req.userId!, {
      folderId: folderId as string | undefined,
      search: search as string | undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      mimeType: mimeType as string | undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const uploadPrivateFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file provided' });
      return;
    }

    const { folderId } = req.body;
    const result = await fileService.uploadFile(req.file, req.userId!, folderId, true);

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const togglePrivateVault = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { isPrivate } = req.body;
    const result = await fileService.togglePrivateVault(
      req.params.id as string,
      req.userId!,
      isPrivate
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

