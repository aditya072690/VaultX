import api, { API_URL } from './api';
import {
  FileItem,
  Folder,
  PublicLink,
  ApiResponse,
  SharedFileItem,
  SearchUserResult,
  FileSharesResponse,
} from '@/types';

export const fileService = {
  async listFiles(params?: Record<string, string | number | boolean | undefined>): Promise<{
    files: FileItem[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await api.get('/files', { params });
    return { files: res.data.files || res.data.data || [], meta: res.data.meta };
  },

  async getFile(id: string): Promise<FileItem> {
    const res = await api.get<ApiResponse<FileItem>>(`/files/${id}`);
    return res.data.data!;
  },

  async uploadFile(file: File, folderId?: string, onProgress?: (pct: number) => void): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    const res = await api.post<ApiResponse<FileItem>>('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return res.data.data!;
  },

  async uploadMultiple(files: File[], folderId?: string): Promise<FileItem[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (folderId) formData.append('folderId', folderId);

    const res = await api.post<ApiResponse<FileItem[]>>('/files/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data!;
  },

  async renameFile(id: string, name: string): Promise<FileItem> {
    const res = await api.put<ApiResponse<FileItem>>(`/files/${id}`, { name });
    return res.data.data!;
  },

  async deleteFile(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  async restoreFile(id: string): Promise<FileItem> {
    const res = await api.post<ApiResponse<FileItem>>(`/files/${id}/restore`);
    return res.data.data!;
  },

  async permanentDelete(id: string): Promise<void> {
    await api.delete(`/files/${id}/permanent`);
  },

  async toggleVisibility(id: string): Promise<FileItem> {
    const res = await api.put<ApiResponse<FileItem>>(`/files/${id}/visibility`);
    return res.data.data!;
  },

  async moveFile(id: string, folderId: string | null): Promise<FileItem> {
    const res = await api.put<ApiResponse<FileItem>>(`/files/${id}/move`, { folderId });
    return res.data.data!;
  },

  getDownloadUrl(id: string): string {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaultx_token') : null;
    const baseUrl = `${API_URL}/files/${id}/download`;
    return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
  },

  getPreviewUrl(id: string): string {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaultx_token') : null;
    const baseUrl = `${API_URL}/files/${id}/preview`;
    return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
  },

  async downloadFile(id: string): Promise<Blob> {
    const res = await api.get(`/files/${id}/download`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Folders
  async listFolders(parentFolderId?: string, includeDeleted?: boolean): Promise<Folder[]> {
    const params: Record<string, string> = {};
    if (parentFolderId) params.parentFolderId = parentFolderId;
    if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
    
    const res = await api.get<ApiResponse<Folder[]>>('/folders', { params });
    return res.data.data || [];
  },

  async createFolder(name: string, parentFolderId?: string): Promise<Folder> {
    const res = await api.post<ApiResponse<Folder>>('/folders', { name, parentFolderId });
    return res.data.data!;
  },

  async getFolder(id: string): Promise<Folder> {
    const res = await api.get<ApiResponse<Folder>>(`/folders/${id}`);
    return res.data.data!;
  },

  async renameFolder(id: string, name: string): Promise<Folder> {
    const res = await api.put<ApiResponse<Folder>>(`/folders/${id}`, { name });
    return res.data.data!;
  },

  async deleteFolder(id: string): Promise<void> {
    await api.delete(`/folders/${id}`);
  },

  async restoreFolder(id: string): Promise<Folder> {
    const res = await api.post<ApiResponse<Folder>>(`/folders/${id}/restore`);
    return res.data.data!;
  },

  async permanentDeleteFolder(id: string): Promise<void> {
    await api.delete(`/folders/${id}/permanent`);
  },

  async getBreadcrumb(id: string): Promise<{ id: string; name: string }[]> {
    const res = await api.get<ApiResponse<{ id: string; name: string }[]>>(`/folders/${id}/breadcrumb`);
    return res.data.data || [];
  },

  // Public Links
  async createPublicLink(fileId: string, options?: { expiresAt?: string; password?: string }): Promise<PublicLink> {
    const res = await api.post<ApiResponse<PublicLink>>(`/files/${fileId}/share`, options || {});
    return res.data.data!;
  },

  async getFileShares(fileId: string): Promise<FileSharesResponse> {
    const res = await api.get<ApiResponse<FileSharesResponse>>(`/files/${fileId}/shares`);
    return res.data.data || { publicLinks: [], userShares: [] };
  },

  async revokePublicLink(token: string): Promise<void> {
    await api.delete(`/shares/${token}`);
  },

  async getPublicFile(token: string, password?: string): Promise<{
    requiresPassword: boolean;
    file: FileItem | null;
  }> {
    const params = password ? { password } : {};
    const res = await api.get(`/public/${token}`, { params });
    return res.data.data;
  },

  // User-to-User Sharing
  async getSharedWithMe(params?: Record<string, string | number | boolean | undefined>): Promise<{
    data: SharedFileItem[];
    total: number;
    pendingCount: number;
    page: number;
    totalPages: number;
  }> {
    const res = await api.get('/files/shared-with-me', { params });
    return {
      data: res.data.data || [],
      total: res.data.total || 0,
      pendingCount: res.data.pendingCount || 0,
      page: res.data.page || 1,
      totalPages: res.data.totalPages || 1,
    };
  },

  async getSharedByMe(params?: Record<string, string | number | boolean | undefined>): Promise<{
    data: SharedFileItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const res = await api.get('/files/shared-by-me', { params });
    return {
      data: res.data.data || [],
      total: res.data.total || 0,
      page: res.data.page || 1,
      totalPages: res.data.totalPages || 1,
    };
  },

  async shareWithUser(
    fileId: string,
    data: {
      recipientEmail: string;
      permission?: 'view' | 'download' | 'upload';
      expiresAt?: string;
      status?: string;
    }
  ): Promise<any> {
    const res = await api.post(`/files/${fileId}/share-user`, data);
    return res.data;
  },

  async acceptShare(shareId: string): Promise<{ status: string; message: string }> {
    const res = await api.patch(`/files/shares/${shareId}/accept`);
    return res.data;
  },

  async rejectShare(shareId: string): Promise<{ status: string; message: string }> {
    const res = await api.patch(`/files/shares/${shareId}/reject`);
    return res.data;
  },

  async deleteShare(shareId: string): Promise<{ deleted: boolean; message: string }> {
    const res = await api.delete(`/files/shares/${shareId}`);
    return res.data;
  },

  async moveToPrivate(fileId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`/files/${fileId}/move-to-private`);
    return res.data;
  },

  async searchUsers(query: string): Promise<SearchUserResult[]> {
    if (!query.trim()) return [];
    const res = await api.get<ApiResponse<SearchUserResult[]>>('/users/search', {
      params: { q: query },
    });
    return res.data.data || [];
  },

  async listPrivateFiles(params?: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    mimeType?: string;
  }): Promise<{ files: FileItem[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const res = await api.get('/files/private', { params });
    return {
      files: res.data.files || [],
      meta: res.data.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async uploadPrivateFile(
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void
  ): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    const res = await api.post<ApiResponse<FileItem>>('/files/private', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data.data!;
  },

  async togglePrivateVault(fileId: string, isPrivate?: boolean): Promise<FileItem> {
    const res = await api.post<ApiResponse<FileItem>>(`/files/${fileId}/toggle-vault`, { isPrivate });
    return res.data.data!;
  },
};
