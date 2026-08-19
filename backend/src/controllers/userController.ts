import { Response, NextFunction } from 'express';
import userService from '../services/userService';
import { AuthenticatedRequest } from '../types';

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getProfile(req.userId!);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, avatar, timezone } = req.body;
    const profile = await userService.updateProfile(req.userId!, {
      firstName,
      lastName,
      avatar,
      timezone,
    });
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.userId!, currentPassword, newPassword);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getStorageAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const analytics = await userService.getStorageAnalytics(req.userId!);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

export const getActivityLog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const result = await userService.getActivityLog(
      req.userId!,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q || req.query.query || '') as string;
    const users = await userService.searchUsers(query, req.userId!);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const completeOnboarding = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { completed = true } = req.body;
    const user = await userService.completeOnboarding(req.userId!, completed);
    res.json({
      success: true,
      message: 'Onboarding status updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getStorageQuota = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const quota = await userService.getStorageQuota(req.userId!);
    res.json({
      success: true,
      data: quota,
    });
  } catch (error) {
    next(error);
  }
};

export const upgradePlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId = 'pro' } = req.body;
    const result = await userService.upgradePlan(req.userId!, planId);
    res.json({
      success: true,
      message: `Successfully upgraded to ${planId} plan`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
