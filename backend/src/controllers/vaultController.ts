import { Response, NextFunction } from 'express';
import vaultService from '../services/vaultService';
import { AuthenticatedRequest } from '../types';

export const unlock = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { vaultPin, vaultPassword } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await vaultService.unlockVault(
      req.userId!,
      { vaultPin, vaultPassword },
      ip,
      userAgent
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const lock = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await vaultService.lockVault(req.userId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const extendSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vaultToken =
      (req.headers['x-vault-unlock-token'] as string) ||
      (req.headers['x-vault-token'] as string) ||
      (req.body.vaultToken as string);

    const result = await vaultService.extendSession(req.userId!, vaultToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vaultToken =
      (req.headers['x-vault-unlock-token'] as string) ||
      (req.headers['x-vault-token'] as string);

    const result = await vaultService.getVaultStatus(req.userId!, vaultToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await vaultService.getVaultSettings(req.userId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await vaultService.updateVaultSettings(req.userId!, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
