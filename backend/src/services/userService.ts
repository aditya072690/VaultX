import prisma from '../config/database';
import authService from './authService';
import { UpdateProfileInput } from '../types';
import { NotFoundError, UnauthorizedError } from '../middleware/errorHandler';

class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        timezone: true,
        twoFactorEnabled: true,
        storageLimit: true,
        storageUsed: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        isFirstLogin: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw new NotFoundError('User');

    return {
      ...user,
      storageLimit: Number(user.storageLimit),
      storageUsed: Number(user.storageUsed),
      onboardingCompleted: (user as any).onboardingCompleted ?? false,
      onboardingCompletedAt: (user as any).onboardingCompletedAt ?? null,
      isFirstLogin: (user as any).isFirstLogin ?? true,
    };
  }

  async completeOnboarding(userId: string, completed: boolean = true) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: completed,
        onboardingCompletedAt: completed ? new Date() : null,
        isFirstLogin: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        timezone: true,
        storageLimit: true,
        storageUsed: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        isFirstLogin: true,
        createdAt: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'onboarding_completed',
        resourceType: 'user',
        resourceId: userId,
        details: 'User completed the onboarding tour',
      },
    }).catch(() => {});

    return {
      ...updated,
      storageLimit: Number(updated.storageLimit),
      storageUsed: Number(updated.storageUsed),
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName ?? user.firstName,
        lastName: input.lastName ?? user.lastName,
        avatar: input.avatar ?? user.avatar,
        timezone: input.timezone ?? user.timezone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        timezone: true,
        storageLimit: true,
        storageUsed: true,
      },
    });

    return {
      ...updated,
      storageLimit: Number(updated.storageLimit),
      storageUsed: Number(updated.storageUsed),
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const isValid = await authService.comparePassword(currentPassword, user.password);
    if (!isValid) throw new UnauthorizedError('Current password is incorrect');

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    const hashedPassword = await authService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async getStorageAnalytics(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storageLimit: true, storageUsed: true },
    });

    if (!user) throw new NotFoundError('User');

    // Get file type breakdown
    const filesByType = await prisma.file.groupBy({
      by: ['mimeType'],
      where: { ownerId: userId, deletedAt: null },
      _sum: { size: true },
      _count: true,
    });

    // Get recent uploads
    const recentUploads = await prisma.file.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        uploadedAt: true,
      },
    });

    // Get total file count
    const totalFiles = await prisma.file.count({
      where: { ownerId: userId, deletedAt: null },
    });

    const totalFolders = await prisma.folder.count({
      where: { ownerId: userId, deletedAt: null },
    });

    return {
      storageLimit: Number(user.storageLimit),
      storageUsed: Number(user.storageUsed),
      storagePercentage: Number(user.storageUsed) / Number(user.storageLimit) * 100,
      totalFiles,
      totalFolders,
      filesByType: filesByType.map((ft) => ({
        mimeType: ft.mimeType,
        totalSize: Number(ft._sum.size || 0),
        count: ft._count,
      })),
      recentUploads: recentUploads.map((f) => ({
        ...f,
        size: Number(f.size),
      })),
    };
  }

  async getActivityLog(userId: string, page: number = 1, limit: number = 20) {
    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where: { userId } }),
    ]);

    return {
      activities,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async searchUsers(query: string, currentUserId: string) {
    const q = query.trim();
    if (!q) return [];

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        deletedAt: null,
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
      take: 10,
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`.trim(),
      avatar: u.avatar,
    }));
  }

  async getStorageQuota(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storageLimit: true, storageUsed: true },
    });

    if (!user) throw new NotFoundError('User');

    // Calculate trash size (files where deletedAt is not null)
    const trashResult = await prisma.file.aggregate({
      where: {
        ownerId: userId,
        deletedAt: { not: null },
      },
      _sum: {
        size: true,
      },
    });

    const storageUsed = Number(user.storageUsed);
    const storageLimit = Number(user.storageLimit);
    const storagePercentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;
    const trashSize = Number(trashResult._sum.size || 0);

    return {
      storageUsed,
      storageLimit,
      storagePercentage: Math.min(Math.round(storagePercentage * 100) / 100, 100),
      trashSize,
    };
  }

  async upgradePlan(userId: string, planId: 'pro' | 'enterprise') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    // Pro = 1TB (1099511627776 bytes), Enterprise = 5TB (5497558138880 bytes)
    const planLimits: Record<string, bigint> = {
      pro: BigInt(1099511627776),
      enterprise: BigInt(5497558138880),
    };

    const newLimit = planLimits[planId] || planLimits.pro;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { storageLimit: newLimit },
      select: { id: true, email: true, storageLimit: true, storageUsed: true },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'upgrade_plan',
        resourceType: 'user',
        resourceId: userId,
        details: JSON.stringify({ planId, newLimit: Number(newLimit) }),
      },
    }).catch(() => {});

    return {
      plan: planId,
      newQuota: Number(updated.storageLimit),
      storageUsed: Number(updated.storageUsed),
    };
  }
}

export default new UserService();
