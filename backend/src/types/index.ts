// Auth types
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
  refreshToken?: string;
}

// User types
export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  storageLimit: bigint;
  storageUsed: bigint;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: Date | null;
  isFirstLogin?: boolean;
  createdAt: Date;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone?: string;
}

// File types
export interface FileUploadMeta {
  name: string;
  mimeType: string;
  size: number;
  ownerId: string;
  folderId?: string;
}

export interface FileListQuery {
  folderId?: string;
  search?: string;
  sortBy?: 'name' | 'size' | 'uploadedAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  isPublic?: boolean;
  isPrivate?: boolean;
  mimeType?: string;
  includeDeleted?: boolean;
}

// Sharing types
export interface CreateShareInput {
  fileId: string;
  userId: string;
  expiresAt?: Date;
  password?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Express extension
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}
