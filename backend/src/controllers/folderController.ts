import { Response, NextFunction } from 'express';
import folderService from '../services/folderService';
import { AuthenticatedRequest } from '../types';

export const createFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, parentFolderId } = req.body;
    const folder = await folderService.createFolder(name, req.userId!, parentFolderId);
    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    next(error);
  }
};

export const listFolders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { parentFolderId, includeDeleted } = req.query;
    const folders = await folderService.listFolders(
      req.userId!,
      parentFolderId as string | undefined,
      includeDeleted === 'true'
    );
    res.json({ success: true, data: folders });
  } catch (error) {
    next(error);
  }
};

export const getFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const folder = await folderService.getFolder(req.params.id as string, req.userId!);
    res.json({ success: true, data: folder });
  } catch (error) {
    next(error);
  }
};

export const renameFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const folder = await folderService.renameFolder(req.params.id as string, name, req.userId!);
    res.json({ success: true, data: folder });
  } catch (error) {
    next(error);
  }
};

export const deleteFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await folderService.deleteFolder(req.params.id as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getBreadcrumb = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const breadcrumb = await folderService.getBreadcrumb(req.params.id as string, req.userId!);
    res.json({ success: true, data: breadcrumb });
  } catch (error) {
    next(error);
  }
};

export const restoreFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await folderService.restoreFolder(req.params.id as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await folderService.permanentDeleteFolder(req.params.id as string, req.userId!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
