export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  storageLimit: number;
  storageUsed: number;
  timezone?: string;
  twoFactorEnabled?: boolean;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string | null;
  isFirstLogin?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface TourStep {
  id: number;
  icon: string;
  badgeText?: string;
  title: string;
  description: string;
  details?: string[];
  graphicType: 'encryption' | 'sync' | 'organization';
}

export interface WelcomeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  user?: User | null;
}

export interface StorageQuota {
  storageUsed: number;
  storageLimit: number;
  storagePercentage: number;
  trashSize: number;
}

export interface StorageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageUsed?: number;
  storageLimit?: number;
  trashSize?: number;
}

export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  s3Key: string;
  isPublic: boolean;
  isPrivate?: boolean;
  uploadedAt: string;
  updatedAt: string;
  deletedAt: string | null;
  ownerId: string;
  folderId: string | null;
  folder?: { id: string; name: string } | null;
  owner?: { id: string; firstName: string; lastName: string };
  _count?: { publicLinks: number; sharedWith: number; downloadLogs: number };
}

export interface Folder {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  ownerId: string;
  parentFolderId: string | null;
  _count?: { children: number; files: number };
  children?: Folder[];
  files?: FileItem[];
  parent?: { id: string; name: string } | null;
}

export interface PublicLink {
  id: string;
  token: string;
  url: string;
  accessCount: number;
  expiresAt: string | null;
  hasPassword: boolean;
  createdAt: string;
}

export interface StorageAnalytics {
  storageLimit: number;
  storageUsed: number;
  storagePercentage: number;
  totalFiles: number;
  totalFolders: number;
  filesByType: { mimeType: string; totalSize: number; count: number }[];
  recentUploads: FileItem[];
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string | null;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: { field: string; message: string }[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ViewMode = 'table' | 'grid';
export type SortField = 'name' | 'size' | 'uploadedAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface SharedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface SharedFileItem {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  sharedBy?: SharedUser;
  sharedWith?: SharedUser;
  permission: 'view' | 'download' | 'upload';
  sharedAt: string;
  expiresAt: string | null;
  status: 'active' | 'pending' | 'expired' | 'rejected' | 'revoked';
  file?: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    isPublic: boolean;
  };
}

export interface SharePermissionUpdate {
  permission: 'view' | 'download' | 'upload';
  expiresAt?: string;
}

export interface SearchUserResult {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface FileSharesResponse {
  publicLinks: PublicLink[];
  userShares: {
    id: string;
    fileId: string;
    sharedWith: SharedUser;
    permission: 'view' | 'download' | 'upload';
    status: string;
    expiresAt: string | null;
    createdAt: string;
  }[];
}

// Vault types
export interface VaultSettings {
  hasPinSet: boolean;
  hasPasswordSet: boolean;
  autoLockTimeout: number; // in seconds
  lockOnAppClose: boolean;
  lockOnInactivity: boolean;
}

export interface VaultStatusResponse {
  isUnlocked: boolean;
  hasPinSet: boolean;
  remainingSeconds: number;
  expiresAt: string | null;
  autoLockTimeout: number;
}

export interface UnlockPayload {
  vaultPin?: string;
  vaultPassword?: string;
}

export interface UpdateVaultSettingsPayload {
  vaultPin?: string;
  vaultPassword?: string;
  currentPinOrPassword?: string;
  autoLockTimeout?: number;
  lockOnAppClose?: boolean;
  lockOnInactivity?: boolean;
}


