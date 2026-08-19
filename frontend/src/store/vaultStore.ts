import { create } from 'zustand';
import { vaultService } from '@/services/vaultService';
import { UnlockPayload, UpdateVaultSettingsPayload } from '@/types';

interface VaultState {
  isUnlocked: boolean;
  hasPinSet: boolean;
  hasPasswordSet: boolean;
  expiresAt: string | null;
  remainingSeconds: number;
  autoLockTimeout: number;
  isLoading: boolean;
  unlockError: string | null;
  timerInterval: ReturnType<typeof setInterval> | null;

  // Actions
  checkVaultStatus: () => Promise<void>;
  unlockVault: (payload: UnlockPayload) => Promise<boolean>;
  lockVault: () => Promise<void>;
  extendSession: () => Promise<boolean>;
  updateSettings: (payload: UpdateVaultSettingsPayload) => Promise<boolean>;
  clearError: () => void;
  startTimer: () => void;
  stopTimer: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  hasPinSet: false,
  hasPasswordSet: false,
  expiresAt: null,
  remainingSeconds: 0,
  autoLockTimeout: 1800,
  isLoading: false,
  unlockError: null,
  timerInterval: null,

  clearError: () => set({ unlockError: null }),

  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },

  startTimer: () => {
    get().stopTimer();

    const interval = setInterval(() => {
      const { expiresAt, isUnlocked } = get();
      if (!isUnlocked || !expiresAt) {
        get().stopTimer();
        return;
      }

      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

      if (diff <= 0) {
        get().stopTimer();
        set({
          isUnlocked: false,
          remainingSeconds: 0,
          expiresAt: null,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vaultx_vault_token');
        }
      } else {
        set({ remainingSeconds: diff });
      }
    }, 1000);

    set({ timerInterval: interval });
  },

  checkVaultStatus: async () => {
    set({ isLoading: true, unlockError: null });
    try {
      const status = await vaultService.getStatus();
      set({
        isUnlocked: status.isUnlocked,
        hasPinSet: status.hasPinSet,
        remainingSeconds: status.remainingSeconds,
        expiresAt: status.expiresAt,
        autoLockTimeout: status.autoLockTimeout,
      });

      if (status.isUnlocked && status.expiresAt) {
        get().startTimer();
      } else {
        get().stopTimer();
      }
    } catch {
      set({ isUnlocked: false });
      get().stopTimer();
    } finally {
      set({ isLoading: false });
    }
  },

  unlockVault: async (payload: UnlockPayload) => {
    set({ isLoading: true, unlockError: null });
    try {
      const res = await vaultService.unlock(payload);
      set({
        isUnlocked: true,
        expiresAt: res.expiresAt,
        remainingSeconds: res.remainingSeconds,
        autoLockTimeout: res.remainingSeconds,
      });
      get().startTimer();
      return true;
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Failed to unlock private vault. Please try again.';
      set({ unlockError: msg, isUnlocked: false });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  lockVault: async () => {
    get().stopTimer();
    set({ isLoading: true });
    try {
      await vaultService.lock();
    } catch {
      // silent
    } finally {
      set({
        isUnlocked: false,
        expiresAt: null,
        remainingSeconds: 0,
        isLoading: false,
      });
    }
  },

  extendSession: async () => {
    try {
      const res = await vaultService.extendSession();
      set({
        expiresAt: res.expiresAt,
        remainingSeconds: res.remainingSeconds,
        autoLockTimeout: res.remainingSeconds,
      });
      get().startTimer();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to extend session';
      set({ unlockError: msg });
      return false;
    }
  },

  updateSettings: async (payload: UpdateVaultSettingsPayload) => {
    set({ isLoading: true, unlockError: null });
    try {
      const res = await vaultService.updateSettings(payload);
      set({
        hasPinSet: res.hasPinSet,
        hasPasswordSet: res.hasPasswordSet,
        autoLockTimeout: res.autoLockTimeout,
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update vault settings';
      set({ unlockError: msg });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
