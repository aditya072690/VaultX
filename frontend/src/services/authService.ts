import api from './api';
import { User, ApiResponse } from '@/types';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: User; token: string }> {
    const res = await api.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>(
      '/auth/register',
      data
    );
    return res.data.data!;
  },

  async login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await api.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>(
      '/auth/login',
      data
    );
    return res.data.data!;
  },

  async getProfile(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/profile');
    return res.data.data!;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
