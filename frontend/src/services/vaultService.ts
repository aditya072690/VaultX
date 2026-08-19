import api from './api';
import {
  VaultSettings,
  VaultStatusResponse,
  UnlockPayload,
  UpdateVaultSettingsPayload,
} from '@/types';

export const vaultService = {
  async unlock(payload: UnlockPayload): Promise<{
    success: boolean;
    message: string;
    vaultToken: string;
    expiresAt: string;
    remainingSeconds: number;
  }> {
    const response = await api.post('/vault/unlock', payload);
    if (response.data.vaultToken && typeof window !== 'undefined') {
      localStorage.setItem('vaultx_vault_token', response.data.vaultToken);
    }
    return response.data;
  },

  async lock(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/vault/lock');
      return response.data;
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vaultx_vault_token');
      }
    }
  },

  async extendSession(): Promise<{
    success: boolean;
    vaultToken: string;
    expiresAt: string;
    remainingSeconds: number;
  }> {
    const response = await api.post('/vault/extend-session');
    if (response.data.vaultToken && typeof window !== 'undefined') {
      localStorage.setItem('vaultx_vault_token', response.data.vaultToken);
    }
    return response.data;
  },

  async getStatus(): Promise<VaultStatusResponse> {
    const response = await api.get('/vault/status');
    return response.data.data;
  },

  async getSettings(): Promise<VaultSettings> {
    const response = await api.get('/vault/settings');
    return response.data.data;
  },

  async updateSettings(
    payload: UpdateVaultSettingsPayload
  ): Promise<{ success: boolean; message: string } & VaultSettings> {
    const response = await api.patch('/vault/settings', payload);
    return response.data;
  },
};
