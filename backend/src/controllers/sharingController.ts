import { Request, Response, NextFunction } from 'express';
import sharingService from '../services/sharingService';
import fileService from '../services/fileService';
import { AuthenticatedRequest } from '../types';

export const createPublicLink = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { expiresAt, password } = req.body;
    const result = await sharingService.createPublicLink(
      req.params.id as string,
      req.userId!,
      {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        password,
      }
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getFileShares = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shares = await sharingService.getFileShares(req.params.id as string, req.userId!);
    res.json({ success: true, data: shares });
  } catch (error) {
    next(error);
  }
};

export const revokePublicLink = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await sharingService.revokePublicLink(req.params.token as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getPublicFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.query;
    const result = await sharingService.getPublicFile(
      req.params.token as string,
      password as string | undefined
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const downloadPublicFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First verify the link
    const { password } = req.query;
    const linkResult = await sharingService.getPublicFile(
      req.params.token as string,
      password as string | undefined
    );

    if (linkResult.requiresPassword) {
      res.status(401).json({ success: false, error: 'Password required' });
      return;
    }

    if (!linkResult.file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Download the file
    const downloadResult = await fileService.downloadFile(linkResult.file.id);

    res.set({
      'Content-Type': downloadResult.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadResult.fileName)}"`,
      'Content-Length': downloadResult.size.toString(),
    });

    res.send(downloadResult.buffer);
  } catch (error) {
    next(error);
  }
};

// ─── User-to-User Sharing Handlers ─────────────────────────────────

export const getSharedWithMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, permission, search, sort, sortOrder, page, limit } = req.query;
    const result = await sharingService.getFilesSharedWithMe(req.userId!, {
      status: status as string | undefined,
      permission: permission as string | undefined,
      search: search as string | undefined,
      sort: sort as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getSharedByMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, permission, search, sort, sortOrder, page, limit } = req.query;
    const result = await sharingService.getFilesSharedByMe(req.userId!, {
      status: status as string | undefined,
      permission: permission as string | undefined,
      search: search as string | undefined,
      sort: sort as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const shareFileWithUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { recipientEmail, recipientEmailOrId, permission, expiresAt, status } = req.body;
    const recipient = recipientEmail || recipientEmailOrId;
    if (!recipient) {
      res.status(400).json({ success: false, error: 'Recipient email or user ID is required' });
      return;
    }

    const share = await sharingService.shareFileWithUser(req.params.id as string, req.userId!, {
      recipientEmailOrId: recipient,
      permission,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      status,
    });
    res.status(201).json({ success: true, data: share, message: 'File shared successfully' });
  } catch (error) {
    next(error);
  }
};

export const acceptShare = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await sharingService.acceptShare(req.params.shareId as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const rejectShare = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await sharingService.rejectShare(req.params.shareId as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const deleteShare = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await sharingService.deleteShare(req.params.shareId as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const moveToPrivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = (req.params.fileId || req.params.id) as string;
    const result = await sharingService.moveToPrivate(fileId, req.userId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
