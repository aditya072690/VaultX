'use client';
import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  uploadModalOpen: boolean;
  createFolderModalOpen: boolean;
  shareModalFileId: string | null;
  deleteModalItem: { id: string; type: 'file' | 'folder' } | null;
  renameModalItem: { id: string; type: 'file' | 'folder' } | null;
  previewFileId: string | null;
  moveModalFileId: string | null;
  welcomeTourOpen: boolean;
  storageLimitModalOpen: boolean;
  storageTrashSize: number;
  toasts: Toast[];

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openCreateFolderModal: () => void;
  closeCreateFolderModal: () => void;
  openShareModal: (fileId: string) => void;
  closeShareModal: () => void;
  openDeleteModal: (id: string, type: 'file' | 'folder') => void;
  closeDeleteModal: () => void;
  openRenameModal: (id: string, type: 'file' | 'folder') => void;
  closeRenameModal: () => void;
  openPreview: (fileId: string) => void;
  closePreview: () => void;
  openMoveModal: (fileId: string) => void;
  closeMoveModal: () => void;
  openWelcomeTour: () => void;
  closeWelcomeTour: () => void;
  openStorageLimitModal: (trashSize?: number) => void;
  closeStorageLimitModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  uploadModalOpen: false,
  createFolderModalOpen: false,
  shareModalFileId: null,
  deleteModalItem: null,
  renameModalItem: null,
  previewFileId: null,
  moveModalFileId: null,
  welcomeTourOpen: false,
  storageLimitModalOpen: false,
  storageTrashSize: 0,
  toasts: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openUploadModal: () => set({ uploadModalOpen: true }),
  closeUploadModal: () => set({ uploadModalOpen: false }),
  openCreateFolderModal: () => set({ createFolderModalOpen: true }),
  closeCreateFolderModal: () => set({ createFolderModalOpen: false }),
  openShareModal: (fileId) => set({ shareModalFileId: fileId }),
  closeShareModal: () => set({ shareModalFileId: null }),
  openDeleteModal: (id, type) => set({ deleteModalItem: { id, type } }),
  closeDeleteModal: () => set({ deleteModalItem: null }),
  openRenameModal: (id, type) => set({ renameModalItem: { id, type } }),
  closeRenameModal: () => set({ renameModalItem: null }),
  openPreview: (fileId) => set({ previewFileId: fileId }),
  closePreview: () => set({ previewFileId: null }),
  openMoveModal: (fileId) => set({ moveModalFileId: fileId }),
  closeMoveModal: () => set({ moveModalFileId: null }),
  openWelcomeTour: () => set({ welcomeTourOpen: true }),
  closeWelcomeTour: () => set({ welcomeTourOpen: false }),
  openStorageLimitModal: (trashSize = 0) => set({ storageLimitModalOpen: true, storageTrashSize: trashSize }),
  closeStorageLimitModal: () => set({ storageLimitModalOpen: false }),

  addToast: (toast) => {
    const id = String(++toastId);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));

    // Auto-remove after duration
    const duration = toast.duration || 4000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
