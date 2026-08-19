'use client';
import { create } from 'zustand';
import { FileItem, Folder, ViewMode, SortField, SortOrder } from '@/types';
import { fileService } from '@/services/fileService';

interface FileState {
  files: FileItem[];
  folders: Folder[];
  currentFolder: string | null;
  breadcrumb: { id: string; name: string }[];
  selectedFiles: Set<string>;
  viewMode: ViewMode;
  sortBy: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
  isLoading: boolean;
  totalFiles: number;
  currentPage: number;

  loadFiles: (folderId?: string | null) => Promise<void>;
  loadFolders: (parentId?: string | null) => Promise<void>;
  setCurrentFolder: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setSearchQuery: (q: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  refreshFiles: () => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  folders: [],
  currentFolder: null,
  breadcrumb: [],
  selectedFiles: new Set(),
  viewMode: 'table',
  sortBy: 'uploadedAt',
  sortOrder: 'desc',
  searchQuery: '',
  isLoading: false,
  totalFiles: 0,
  currentPage: 1,

  loadFiles: async (folderId) => {
    set({ isLoading: true });
    try {
      const { sortBy, sortOrder, searchQuery, currentPage, currentFolder } = get();
      
      const targetFolder = folderId !== undefined ? folderId : currentFolder;

      const params: Record<string, string> = {
        sortBy,
        sortOrder,
        page: String(currentPage),
        limit: '50',
      };
      
      if (targetFolder) {
        params.folderId = targetFolder;
      } else if (targetFolder === null && !searchQuery) {
        // If no search query and we're at the root, only fetch root files
        params.folderId = '';
      }

      if (searchQuery) params.search = searchQuery;

      const result = await fileService.listFiles(params);
      set({
        files: result.files,
        totalFiles: result.meta?.total || result.files.length,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  loadFolders: async (parentId) => {
    try {
      const folders = await fileService.listFolders(parentId || undefined);
      set({ folders });

      // Load breadcrumb
      if (parentId) {
        const breadcrumb = await fileService.getBreadcrumb(parentId);
        set({ breadcrumb });
      } else {
        set({ breadcrumb: [] });
      }
    } catch {
      // Silent fail
    }
  },

  setCurrentFolder: (id) => {
    set({ currentFolder: id, selectedFiles: new Set(), currentPage: 1 });
    get().loadFiles(id);
    get().loadFolders(id);
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (field) => {
    set({ sortBy: field });
    get().refreshFiles();
  },
  setSortOrder: (order) => {
    set({ sortOrder: order });
    get().refreshFiles();
  },
  setSearchQuery: (q) => {
    set({ searchQuery: q, currentPage: 1 });
    get().refreshFiles();
  },

  toggleSelect: (id) => {
    const selected = new Set(get().selectedFiles);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    set({ selectedFiles: selected });
  },

  selectAll: () => {
    const ids = get().files.map((f) => f.id);
    set({ selectedFiles: new Set(ids) });
  },

  clearSelection: () => set({ selectedFiles: new Set() }),

  refreshFiles: async () => {
    const { currentFolder } = get();
    await get().loadFiles(currentFolder);
    await get().loadFolders(currentFolder);
  },
}));
