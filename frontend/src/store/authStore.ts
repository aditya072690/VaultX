'use client';
import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('vaultx_token') : null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.login({ email, password });
      localStorage.setItem('vaultx_token', token);
      localStorage.setItem('vaultx_user', JSON.stringify(user));
      set({ user, token, isLoading: false, isAuthenticated: true });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.register({ email, password, firstName, lastName });
      localStorage.setItem('vaultx_token', token);
      localStorage.setItem('vaultx_user', JSON.stringify(user));
      set({ user, token, isLoading: false, isAuthenticated: true });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('vaultx_token');
    localStorage.removeItem('vaultx_user');
    localStorage.removeItem('vaultx_vault_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem('vaultx_token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      const user = await authService.getProfile();
      set({ user, token, isAuthenticated: true });
    } catch {
      localStorage.removeItem('vaultx_token');
      localStorage.removeItem('vaultx_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),
}));
