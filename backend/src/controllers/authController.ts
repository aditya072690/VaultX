import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { AuthenticatedRequest } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const result = await authService.register({ email, password, firstName, lastName });

    // Serialize BigInt values
    const user = {
      ...result.user,
      storageLimit: Number(result.user.storageLimit),
      storageUsed: Number(result.user.storageUsed),
    };

    res.status(201).json({
      success: true,
      data: { user, token: result.token, refreshToken: result.refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    const user = {
      ...result.user,
      storageLimit: Number(result.user.storageLimit),
      storageUsed: Number(result.user.storageUsed),
    };

    res.json({
      success: true,
      data: { user, token: result.token, refreshToken: result.refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getProfile(req.userId!);
    const serialized = {
      ...user,
      storageLimit: Number(user.storageLimit),
      storageUsed: Number(user.storageUsed),
    };
    res.json({ success: true, data: serialized });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response) => {
  // JWT is stateless — client handles token removal
  res.json({ success: true, message: 'Logged out successfully' });
};
