'use client';

import { useEffect, useState, useMemo } from 'react';
import { fileService } from '@/services/fileService';
import { SharedFileItem, FileItem } from '@/types';
import {
  formatFileSize,
  formatDate,
  getFileIcon,
  getFileColor,
  getInitials,
  truncateFileName,
} from '@/utils/helpers';
import { useUIStore } from '@/store/uiStore';
import SharingDetailsModal from '@/components/files/SharingDetailsModal';
import FilePreviewModal from '@/components/files/FilePreviewModal';

type ActiveTab = 'shared-with-me' | 'shared-by-me' | 'public-links';

export default function SharedPage() {
  const { addToast, openShareModal } = useUIStore();

  // Tab & Data State
  const [activeTab, setActiveTab] = useState<ActiveTab>('shared-with-me');
  const [sharedWithMeFiles, setSharedWithMeFiles] = useState<SharedFileItem[]>([]);
  const [sharedByMeFiles, setSharedByMeFiles] = useState<SharedFileItem[]>([]);
  const [publicFiles, setPublicFiles] = useState<FileItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionFilter, setPermissionFilter] = useState<'all' | 'view' | 'download' | 'upload'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [sortField, setSortField] = useState<'date' | 'name' | 'user' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Active Modals & Context Menus
  const [selectedShare, setSelectedShare] = useState<SharedFileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; permission: 'view' | 'download' | 'upload' } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<{
    share: SharedFileItem;
    x: number;
    y: number;
  } | null>(null);

  const handleOpenShareDropdown = (e: React.MouseEvent, share: SharedFileItem) => {
    e.stopPropagation();
    if (activeDropdown?.share.id === share.id) {
      setActiveDropdown(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 192; // 12rem = 192px
    const menuHeight = 96;

    let x = rect.right - menuWidth;
    let y = rect.bottom + 6;

    // Viewport horizontal boundary protection
    if (x < 10) x = 10;
    if (x + menuWidth > window.innerWidth - 10) {
      x = window.innerWidth - menuWidth - 10;
    }

    // Viewport vertical boundary protection (flip up if close to bottom)
    if (y + menuHeight > window.innerHeight - 10) {
      y = Math.max(10, rect.top - menuHeight - 6);
    }

    setActiveDropdown({ share, x, y });
  };

  // Close floating action menu on window scroll/resize
  useEffect(() => {
    if (!activeDropdown) return;
    const handleClose = () => setActiveDropdown(null);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [activeDropdown]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'shared-with-me') {
        const res = await fileService.getSharedWithMe({
          permission: permissionFilter !== 'all' ? permissionFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
          sort: sortField === 'user' ? 'sharedBy' : sortField,
          sortOrder,
        });
        setSharedWithMeFiles(res.data);
        setPendingCount(res.pendingCount);
      } else if (activeTab === 'shared-by-me') {
        const res = await fileService.getSharedByMe({
          permission: permissionFilter !== 'all' ? permissionFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
          sort: sortField === 'user' ? 'sharedWith' : sortField,
          sortOrder,
        });
        setSharedByMeFiles(res.data);
      } else if (activeTab === 'public-links') {
        const res = await fileService.listFiles({ isPublic: 'true', search: searchQuery || undefined });
        setPublicFiles(res.files);
      }
    } catch (err: any) {
      addToast({ type: 'error', message: 'Failed to load shared files' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, permissionFilter, statusFilter, sortField, sortOrder]);

  // Handle client-side search debounce or manual trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Actions
  const handleDownload = async (fileId: string, fileName: string, permission: 'view' | 'download' | 'upload') => {
    if (permission === 'view') {
      addToast({ type: 'warning', message: 'View-only permissions do not allow downloading' });
      return;
    }
    try {
      const token = localStorage.getItem('vaultx_token');
      const url = fileService.getDownloadUrl(fileId);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Download failed');
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
      addToast({ type: 'success', message: 'Download started' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Download failed' });
    }
  };

  const handleAcceptShare = async (shareId: string) => {
    try {
      await fileService.acceptShare(shareId);
      addToast({ type: 'success', message: 'Share accepted' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to accept share' });
    }
  };

  const handleRejectShare = async (shareId: string) => {
    try {
      await fileService.rejectShare(shareId);
      addToast({ type: 'info', message: 'Share rejected' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to reject share' });
    }
  };

  const handleDeleteShare = async (shareId: string, isOwner: boolean) => {
    if (!confirm(isOwner ? 'Revoke access for this recipient?' : 'Remove this file from your shared list?')) {
      return;
    }
    try {
      await fileService.deleteShare(shareId);
      addToast({ type: 'success', message: isOwner ? 'Access revoked' : 'Removed from shared files' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to remove share' });
    }
  };

  const handleMoveToPrivate = async (fileId: string) => {
    if (!confirm('Make file private and revoke all shares?')) return;
    try {
      await fileService.moveToPrivate(fileId);
      addToast({ type: 'success', message: 'File moved to private vault' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to move file' });
    }
  };

  const handleCopyPublicLink = (token: string) => {
    const url = `${window.location.origin}/public/${token}`;
    navigator.clipboard.writeText(url);
    addToast({ type: 'info', message: 'Public link copied to clipboard' });
  };

  const handleRevokePublicLink = async (token: string) => {
    try {
      await fileService.revokePublicLink(token);
      addToast({ type: 'success', message: 'Public link revoked' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to revoke link' });
    }
  };

  return (
    <div className="space-y-6" onClick={() => setActiveDropdown(null)}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight" style={{ fontFamily: 'Hanken Grotesk' }}>
            Shared with Me
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Manage recipient permissions, direct user shares, and public links
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('shared-with-me')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'shared-with-me'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">folder_shared</span>
          Shared Files
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] rounded-full text-xs font-bold animate-pulse">
              {pendingCount} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('shared-by-me')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'shared-by-me'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">outbox</span>
          Shared By Me
        </button>

        <button
          onClick={() => setActiveTab('public-links')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'public-links'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">link</span>
          Public Links
          {publicFiles.length > 0 && (
            <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs">
              {publicFiles.length}
            </span>
          )}
        </button>
      </div>

      {/* Search, Filter and Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94A3B8] text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'shared-with-me'
                ? 'Search files or sharer...'
                : activeTab === 'shared-by-me'
                ? 'Search files or recipients...'
                : 'Search public files...'
            }
            className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <span className="material-symbols-outlined text-base">cancel</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab !== 'public-links' && (
            <>
              {/* Permission Filter */}
              <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1">
                <span className="material-symbols-outlined text-base text-[#64748B]">tune</span>
                <select
                  value={permissionFilter}
                  onChange={(e) => setPermissionFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-[#0F172A] cursor-pointer py-1 pr-1"
                >
                  <option value="all">All Permissions</option>
                  <option value="view">👁️ View Only</option>
                  <option value="download">⬇️ Can Download</option>
                  <option value="upload">⬆️ Upload & Edit</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1">
                <span className="material-symbols-outlined text-base text-[#64748B]">filter_list</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-[#0F172A] cursor-pointer py-1 pr-1"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1">
            <span className="material-symbols-outlined text-base text-[#64748B]">swap_vert</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-[#0F172A] cursor-pointer py-1 pr-1"
            >
              <option value="date">Date Shared</option>
              <option value="name">File Name</option>
              <option value="user">{activeTab === 'shared-with-me' ? 'Sharer' : 'Recipient'}</option>
              <option value="size">File Size</option>
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="p-0.5 text-[#64748B] hover:text-[#2563EB] transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <span className="material-symbols-outlined text-sm">
                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#E2E8F0]">
          <div className="w-9 h-9 border-3 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mb-3" />
          <p className="text-xs text-[#64748B]">Loading shared items...</p>
        </div>
      ) : activeTab === 'shared-with-me' ? (
        sharedWithMeFiles.length > 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            {/* Desktop & Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Shared By
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Permission
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Shared Date & Status
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {sharedWithMeFiles.map((share) => {
                    const isPending = share.status === 'pending';
                    const isExpired = share.status === 'expired';
                    const isViewOnly = share.permission === 'view';

                    return (
                      <tr
                        key={share.id}
                        className="group hover:bg-[#F8FAFC] transition-colors"
                      >
                        {/* File Icon & Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[#F1F5F9] shrink-0">
                              <span className={`material-symbols-outlined text-2xl ${getFileColor(share.fileMimeType)}`}>
                                {getFileIcon(share.fileMimeType)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() =>
                                  setPreviewFile({
                                    id: share.fileId,
                                    name: share.fileName,
                                    permission: share.permission,
                                  })
                                }
                                className="text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] text-left truncate block max-w-xs transition-colors"
                              >
                                {share.fileName}
                              </button>
                              <div className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                                <span>{formatFileSize(share.fileSize)}</span>
                                {isPending && (
                                  <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] rounded-md font-bold text-[10px]">
                                    PENDING APPROVAL
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Shared By User Chip */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            {share.sharedBy?.avatar ? (
                              <img
                                src={share.sharedBy.avatar}
                                alt={share.sharedBy.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {share.sharedBy ? getInitials(share.sharedBy.name.split(' ')[0] || '', share.sharedBy.name.split(' ')[1] || '') : 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#0F172A] truncate">
                                {share.sharedBy?.name || 'User'}
                              </div>
                              <div className="text-[11px] text-[#64748B] truncate">
                                {share.sharedBy?.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Permission Badge */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              share.permission === 'view'
                                ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]'
                                : share.permission === 'download'
                                ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                                : 'bg-[#F5F3FF] text-[#8B5CF6] border border-[#DDD6FE]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {share.permission === 'view' ? 'visibility' : share.permission === 'download' ? 'download' : 'drive_folder_upload'}
                            </span>
                            {share.permission === 'view' ? 'View Only' : share.permission === 'download' ? 'Download' : 'Upload & Edit'}
                          </span>
                        </td>

                        {/* Shared Date & Expiry */}
                        <td className="px-4 py-4">
                          <div className="text-xs text-[#0F172A] font-medium">
                            {formatDate(share.sharedAt)}
                          </div>
                          {share.expiresAt && (
                            <div
                              className={`text-[11px] mt-0.5 ${
                                isExpired ? 'text-[#DC2626] font-semibold' : 'text-[#64748B]'
                              }`}
                            >
                              {isExpired ? 'Expired' : `Expires ${formatDate(share.expiresAt)}`}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleAcceptShare(share.id)}
                                  className="px-2.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                  title="Accept Share"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectShare(share.id)}
                                  className="px-2.5 py-1 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold rounded-lg transition-all"
                                  title="Reject Share"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Preview */}
                                <button
                                  onClick={() =>
                                    setPreviewFile({
                                      id: share.fileId,
                                      name: share.fileName,
                                      permission: share.permission,
                                    })
                                  }
                                  className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#EEF2FF] rounded-lg transition-colors"
                                  title="Preview File"
                                >
                                  <span className="material-symbols-outlined text-lg">visibility</span>
                                </button>

                                {/* Download */}
                                <button
                                  onClick={() => handleDownload(share.fileId, share.fileName, share.permission)}
                                  disabled={isViewOnly || isExpired}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isViewOnly || isExpired
                                      ? 'text-[#CBD5E1] cursor-not-allowed'
                                      : 'text-[#64748B] hover:text-[#16A34A] hover:bg-[#F0FDF4]'
                                  }`}
                                  title={
                                    isViewOnly
                                      ? 'Download disabled (View-only permission)'
                                      : isExpired
                                      ? 'Share has expired'
                                      : 'Download File'
                                  }
                                >
                                  <span className="material-symbols-outlined text-lg">download</span>
                                </button>

                                {/* More Menu Button */}
                                <button
                                  onClick={(e) => handleOpenShareDropdown(e, share)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    activeDropdown?.share.id === share.id
                                      ? 'text-[#0F172A] bg-[#F1F5F9]'
                                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                                  }`}
                                  title="More Options"
                                >
                                  <span className="material-symbols-outlined text-lg">more_vert</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-[#E2E8F0]">
              {sharedWithMeFiles.map((share) => (
                <div key={share.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`material-symbols-outlined text-3xl ${getFileColor(share.fileMimeType)}`}>
                        {getFileIcon(share.fileMimeType)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#0F172A] truncate">{share.fileName}</div>
                        <div className="text-xs text-[#64748B]">{formatFileSize(share.fileSize)}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        share.permission === 'view'
                          ? 'bg-[#EEF2FF] text-[#4F46E5]'
                          : share.permission === 'download'
                          ? 'bg-[#DCFCE7] text-[#16A34A]'
                          : 'bg-[#F5F3FF] text-[#8B5CF6]'
                      }`}
                    >
                      {share.permission.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">person</span>
                      <span>Shared by {share.sharedBy?.name || 'User'}</span>
                    </div>
                    <span>{formatDate(share.sharedAt)}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                    <button
                      onClick={() =>
                        setPreviewFile({
                          id: share.fileId,
                          name: share.fileName,
                          permission: share.permission,
                        })
                      }
                      className="px-3 py-1.5 bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold rounded-lg"
                    >
                      Preview
                    </button>
                    {share.permission !== 'view' && (
                      <button
                        onClick={() => handleDownload(share.fileId, share.fileName, share.permission)}
                        className="px-3 py-1.5 bg-[#2563EB] text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedShare(share)}
                      className="p-1.5 text-[#64748B] hover:bg-[#F1F5F9] rounded-lg"
                    >
                      <span className="material-symbols-outlined text-base">more_horiz</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-3xl">folder_shared</span>
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>
              No files shared with you
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm">
              When other VaultX users share files directly with you, they will appear here with your assigned permissions.
            </p>
          </div>
        )
      ) : activeTab === 'shared-by-me' ? (
        sharedByMeFiles.length > 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Assigned Permission
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Status & Expiry
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {sharedByMeFiles.map((share) => (
                    <tr key={share.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-[#F1F5F9] shrink-0">
                            <span className={`material-symbols-outlined text-2xl ${getFileColor(share.fileMimeType)}`}>
                              {getFileIcon(share.fileMimeType)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0F172A] truncate max-w-xs">
                              {share.fileName}
                            </div>
                            <div className="text-xs text-[#64748B] mt-0.5">
                              {formatFileSize(share.fileSize)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          {share.sharedWith?.avatar ? (
                            <img
                              src={share.sharedWith.avatar}
                              alt={share.sharedWith.name}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {share.sharedWith ? getInitials(share.sharedWith.name.split(' ')[0] || '', share.sharedWith.name.split(' ')[1] || '') : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#0F172A] truncate">
                              {share.sharedWith?.name || 'Recipient'}
                            </div>
                            <div className="text-[11px] text-[#64748B] truncate">
                              {share.sharedWith?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            share.permission === 'view'
                              ? 'bg-[#EEF2FF] text-[#4F46E5]'
                              : share.permission === 'download'
                              ? 'bg-[#DCFCE7] text-[#16A34A]'
                              : 'bg-[#F5F3FF] text-[#8B5CF6]'
                          }`}
                        >
                          {share.permission === 'view' ? '👁️ View Only' : share.permission === 'download' ? '⬇️ Download' : '⬆️ Upload'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              share.status === 'active' ? 'bg-[#16A34A]' : share.status === 'pending' ? 'bg-[#D97706]' : 'bg-[#DC2626]'
                            }`}
                          />
                          {share.status.charAt(0).toUpperCase() + share.status.slice(1)}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          {share.expiresAt ? `Expires ${formatDate(share.expiresAt)}` : 'Permanent access'}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedShare(share)}
                            className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleDeleteShare(share.id, true)}
                            className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                            title="Revoke recipient access"
                          >
                            <span className="material-symbols-outlined text-lg">person_remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-3xl">outbox</span>
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>
              No files shared with other users
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm mb-4">
              Share your files directly with teammates or clients from the file menu to control who can view or download.
            </p>
          </div>
        )
      ) : (
        /* Public Links Tab */
        publicFiles.length > 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden sm:table-cell">
                    Size
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden md:table-cell">
                    Shared Date
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Public Access
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {publicFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#F1F5F9] shrink-0">
                          <span className={`material-symbols-outlined text-2xl ${getFileColor(file.mimeType)}`}>
                            {getFileIcon(file.mimeType)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0F172A] truncate max-w-xs">{file.name}</div>
                          <div className="text-xs text-[#64748B] sm:hidden">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#64748B] hidden sm:table-cell">
                      {formatFileSize(file.size)}
                    </td>

                    <td className="px-4 py-4 text-xs text-[#64748B] hidden md:table-cell">
                      {formatDate(file.uploadedAt)}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DCFCE7] text-[#16A34A] text-xs font-semibold rounded-full border border-[#BBF7D0]">
                        <span className="material-symbols-outlined text-sm">link</span>
                        {file._count?.publicLinks || 1} Active Link
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openShareModal(file.id)}
                          className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">manage_accounts</span>
                          Manage Link
                        </button>
                        <button
                          onClick={() => handleMoveToPrivate(file.id)}
                          className="px-3 py-1.5 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">lock</span>
                          Make Private
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-3xl">link_off</span>
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>
              No public links active
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm">
              Generate public links with password protection and expiration from the All Files screen.
            </p>
          </div>
        )
      )}

      {/* Sharing Details Modal */}
      {selectedShare && (
        <SharingDetailsModal
          share={selectedShare}
          isOwner={activeTab === 'shared-by-me'}
          onClose={() => setSelectedShare(null)}
          onRefresh={loadData}
          onPreview={(fileId) =>
            setPreviewFile({
              id: fileId,
              name: selectedShare.fileName,
              permission: selectedShare.permission,
            })
          }
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          fileId={previewFile.id}
          fileName={previewFile.name}
          permission={previewFile.permission}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Floating Action Dropdown Menu */}
      {activeDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActiveDropdown(null)}
          />
          <div
            className="fixed z-50 w-48 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-1.5 text-left animate-scale-in"
            style={{ left: activeDropdown.x, top: activeDropdown.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setSelectedShare(activeDropdown.share);
                setActiveDropdown(null);
              }}
              className="w-full px-3.5 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-base text-[#64748B]">info</span>
              Sharing Details
            </button>
            <button
              onClick={() => {
                handleDeleteShare(activeDropdown.share.id, false);
                setActiveDropdown(null);
              }}
              className="w-full px-3.5 py-2 text-xs text-[#DC2626] hover:bg-[#FEE2E2] flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Remove from My Drive
            </button>
          </div>
        </>
      )}
    </div>
  );
}
