import api from './api';
import { User, StorageAnalytics, ActivityLogEntry, ApiResponse, StorageQuota } from '@/types';

export const userService = {
  async getProfile(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/users/profile');
    return res.data.data!;
  },

  async updateProfile(data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar' | 'timezone'>>): Promise<User> {
    const res = await api.put<ApiResponse<User>>('/users/profile', data);
    return res.data.data!;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put('/users/password', data);
  },

  async getStorageAnalytics(): Promise<StorageAnalytics> {
    const res = await api.get<ApiResponse<StorageAnalytics>>('/users/storage');
    return res.data.data!;
  },

  async getStorageQuota(): Promise<StorageQuota> {
    const res = await api.get<ApiResponse<StorageQuota>>('/users/storage/quota');
    return res.data.data!;
  },

  async upgradePlan(planId: 'pro' | 'enterprise' = 'pro'): Promise<{ plan: string; newQuota: number; storageUsed: number }> {
    const res = await api.post<ApiResponse<{ plan: string; newQuota: number; storageUsed: number }>>('/users/upgrade-plan', { planId });
    return res.data.data!;
  },

  async getActivityLog(page?: number): Promise<{
    activities: ActivityLogEntry[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await api.get('/users/activity', { params: { page } });
    return { activities: res.data.activities || [], meta: res.data.meta };
  },

  async completeOnboarding(completed: boolean = true): Promise<User | null> {
    try {
      const res = await api.post<ApiResponse<User>>('/users/onboarding', { completed });
      return res.data?.data || null;
    } catch (err) {
      console.warn('Failed to persist onboarding status to server:', err);
      return null;
    }
  },
};
