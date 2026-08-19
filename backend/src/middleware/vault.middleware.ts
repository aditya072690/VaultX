import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types';

export const vaultProtected = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const vaultToken =
    (req.headers['x-vault-unlock-token'] as string) ||
    (req.headers['x-vault-token'] as string);

  if (!vaultToken) {
    res.status(403).json({
      success: false,
      error: 'Vault is locked. Enter your PIN or password to access private files.',
      isVaultLocked: true,
    });
    return;
  }

  try {
    const decoded = jwt.verify(vaultToken, env.JWT_SECRET) as {
      userId: string;
      type: string;
    };

    if (decoded.userId !== userId || decoded.type !== 'vault_unlock') {
      res.status(403).json({
        success: false,
        error: 'Invalid vault session. Please unlock again.',
        isVaultLocked: true,
      });
      return;
    }

    next();
  } catch (err: any) {
    res.status(403).json({
      success: false,
      error: 'Vault session has expired. Enter your PIN to unlock.',
      isVaultLocked: true,
    });
  }
};
