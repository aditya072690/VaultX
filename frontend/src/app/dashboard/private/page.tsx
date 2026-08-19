'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useVaultStore } from '@/store/vaultStore';
import { useUIStore } from '@/store/uiStore';
import { fileService } from '@/services/fileService';
import { FileItem } from '@/types';
import { formatFileSize, formatDate, getFileIcon, getFileColor } from '@/utils/helpers';
import VaultUnlockModal from '@/components/vault/VaultUnlockModal';

export default function PrivatePage() {
  const {
    isUnlocked,
    remainingSeconds,
    checkVaultStatus,
    lockVault,
    extendSession,
    isLoading: isVaultLoading,
  } = useVaultStore();

  const { addToast, openPreview } = useUIStore();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'uploadedAt' | 'name' | 'size'>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [extending, setExtending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [actionMenuFileId, setActionMenuFileId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize vault status on mount
  useEffect(() => {
    checkVaultStatus();
  }, []);

  // Fetch private files when vault is unlocked
  const fetchPrivateFiles = useCallback(async () => {
    if (!isUnlocked) return;
    setLoading(true);
    try {
      const mimeTypeFilter =
        typeFilter === 'all'
          ? undefined
          : typeFilter === 'documents'
          ? 'application/pdf'
          : typeFilter === 'images'
          ? 'image/'
          : typeFilter === 'videos'
          ? 'video/'
          : typeFilter === 'audio'
          ? 'audio/'
          : undefined;

      const result = await fileService.listPrivateFiles({
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
        mimeType: mimeTypeFilter,
      });
      setFiles(result.files);
    } catch (err: any) {
      if (err.response?.status === 403) {
        addToast({
          type: 'error',
          message: 'Vault is locked. Please enter your credentials to view files.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isUnlocked, search, typeFilter, sortBy, sortOrder, addToast]);

  useEffect(() => {
    if (isUnlocked) {
      fetchPrivateFiles();
    }
  }, [isUnlocked, fetchPrivateFiles]);

  // Handle Extend Session
  const handleExtend = async () => {
    setExtending(true);
    try {
      const ok = await extendSession();
      if (ok) {
        addToast({ type: 'success', message: 'Vault session extended by 30 minutes' });
      }
    } finally {
      setExtending(false);
    }
  };

  // Handle Manual Lock
  const handleLock = async () => {
    await lockVault();
    addToast({ type: 'info', message: 'Private Vault locked' });
  };

  // Handle Upload
  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        await fileService.uploadPrivateFile(file, undefined, (progress) => {
          setUploadProgress(progress);
        });
        successCount++;
      } catch (err: any) {
        addToast({
          type: 'error',
          message: `Failed to upload ${file.name}: ${err.response?.data?.error || err.message}`,
        });
      }
    }

    setUploading(false);
    setUploadProgress(0);

    if (successCount > 0) {
      addToast({
        type: 'success',
        message: `Successfully added ${successCount} file(s) to Private Vault`,
      });
      fetchPrivateFiles();
    }
  };

  // Handle Move Out of Private Vault
  const handleRemoveFromVault = async (file: FileItem) => {
    try {
      await fileService.togglePrivateVault(file.id, false);
      addToast({
        type: 'success',
        message: `"${file.name}" moved to General Storage`,
      });
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch {
      addToast({ type: 'error', message: 'Failed to remove file from Private Vault' });
    }
  };

  // Handle Delete
  const handleDeleteFile = async (file: FileItem) => {
    try {
      await fileService.deleteFile(file.id);
      addToast({ type: 'success', message: `"${file.name}" moved to Trash` });
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch {
      addToast({ type: 'error', message: 'Failed to delete file' });
    }
  };

  // Handle Download
  const handleDownload = async (file: FileItem) => {
    try {
      const blob = await fileService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      addToast({ type: 'error', message: 'Failed to download file' });
    }
  };

  // Format countdown string
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // ─── SCENARIO 1: VAULT IS LOCKED ─────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center relative p-4">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-radial-gradient opacity-30 pointer-events-none" />

        {isVaultLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin" />
            <p className="text-sm font-medium text-[#64748B]">Checking vault security status...</p>
          </div>
        ) : (
          <VaultUnlockModal onUnlocked={fetchPrivateFiles} />
        )}
      </div>
    );
  }

  // ─── SCENARIO 2: VAULT IS UNLOCKED ───────────────────────────────
  return (
    <div
      className="space-y-6 animate-fade-in relative pb-12"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files)}
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-blue-600/10 border-2 border-dashed border-[#2563EB] rounded-2xl flex flex-col items-center justify-center backdrop-blur-xs pointer-events-none animate-fade-in">
          <div className="w-16 h-16 bg-[#2563EB] text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
            <span className="material-symbols-outlined text-3xl">upload</span>
          </div>
          <p className="text-base font-bold text-[#0F172A]">Drop files to upload to Private Vault</p>
          <p className="text-xs text-[#64748B] mt-1">Files are stored encrypted and private</p>
        </div>
      )}

      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-[#4F46E5] to-[#2563EB] rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <span className="material-symbols-outlined text-2xl">enhanced_encryption</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl font-bold text-[#0F172A]"
                style={{ fontFamily: 'Hanken Grotesk' }}
              >
                Private Vault
              </h1>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="material-symbols-outlined text-sm">lock_open</span>
                <span>Unlocked ({formatCountdown(remainingSeconds)})</span>
              </div>
            </div>
            <p className="text-sm text-[#64748B] mt-0.5">
              Encrypted storage only accessible with your security credentials
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Upload to Vault</span>
          </button>

          <button
            onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#DC2626] hover:text-[#B91C1C] text-sm font-semibold rounded-xl transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">lock</span>
            <span>Lock Vault</span>
          </button>
        </div>
      </div>

      {/* Session Expiring Warning Banner (< 5 mins remaining) */}
      {remainingSeconds > 0 && remainingSeconds <= 300 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-fade-in shadow-xs">
          <div className="flex items-center gap-3 text-amber-800">
            <span className="material-symbols-outlined text-2xl text-amber-600">timer</span>
            <div>
              <p className="text-sm font-bold">
                Vault session auto-locks in {formatCountdown(remainingSeconds)}
              </p>
              <p className="text-xs text-amber-700">
                Extend your session now to avoid interruption.
              </p>
            </div>
          </div>

          <button
            onClick={handleExtend}
            disabled={extending}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            {extending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-base">battery_charging_full</span>
                <span>Extend Session (+30m)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between text-xs font-medium text-[#0F172A] mb-2">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#2563EB] animate-spin">
                sync
              </span>
              Encrypting & uploading to vault...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Search, Filter & Sort Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search private files..."
            className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* File Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] bg-white focus:ring-2 focus:ring-[#2563EB] transition-all"
          >
            <option value="all">All File Types</option>
            <option value="documents">Documents (PDF)</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
            <option value="audio">Audio</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] bg-white focus:ring-2 focus:ring-[#2563EB] transition-all"
          >
            <option value="uploadedAt">Date Added</option>
            <option value="name">File Name</option>
            <option value="size">File Size</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl text-[#64748B] transition-colors"
            title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          >
            <span className="material-symbols-outlined text-base">
              {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-[#E2E8F0] rounded-xl overflow-hidden p-0.5 bg-[#F8FAFC]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#64748B]'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-base">table_rows</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#64748B]'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="w-8 h-8 border-3 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium text-[#64748B]">Decryption in progress...</p>
        </div>
      ) : files.length > 0 ? (
        viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden sm:table-cell">
                      Size
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden md:table-cell">
                      Added Date
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Security
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                      onClick={() => openPreview(file.id)}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${getFileColor(
                              file.mimeType
                            )} bg-opacity-10`}
                          >
                            <span
                              className={`material-symbols-outlined text-xl ${getFileColor(
                                file.mimeType
                              )}`}
                            >
                              {getFileIcon(file.mimeType)}
                            </span>
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <p className="text-sm font-semibold text-[#0F172A] truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-[#94A3B8] truncate sm:hidden">
                              {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3.5 text-xs text-[#64748B] hidden sm:table-cell">
                        {formatFileSize(file.size)}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-[#64748B] hidden md:table-cell">
                        {formatDate(file.uploadedAt)}
                      </td>

                      {/* Security Badge */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                          <span className="material-symbols-outlined text-sm">shield</span>
                          <span>Encrypted</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-3.5 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openPreview(file.id)}
                            className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Preview File"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>

                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download File"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </button>

                          <button
                            onClick={() =>
                              setActionMenuFileId(actionMenuFileId === file.id ? null : file.id)
                            }
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">more_vert</span>
                          </button>
                        </div>

                        {/* Action Dropdown Menu */}
                        {actionMenuFileId === file.id && (
                          <div className="absolute right-5 top-12 z-30 w-52 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-1 text-left animate-scale-up">
                            <button
                              onClick={() => {
                                handleRemoveFromVault(file);
                                setActionMenuFileId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                            >
                              <span className="material-symbols-outlined text-base text-[#64748B]">
                                lock_open
                              </span>
                              <span>Move to General Storage</span>
                            </button>

                            <button
                              onClick={() => {
                                handleDeleteFile(file);
                                setActionMenuFileId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#DC2626] hover:bg-red-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                              <span>Move to Trash</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => openPreview(file.id)}
                className="bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {file.mimeType.startsWith('image/') ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100 relative">
                      <img
                        src={fileService.getPreviewUrl(file.id)}
                        alt={file.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-semibold rounded-full">
                        <span className="material-symbols-outlined text-[10px]">shield</span>
                        Private
                      </span>
                    </div>
                  ) : file.mimeType.startsWith('video/') ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 mb-3 relative flex items-center justify-center">
                      <video
                        src={`${fileService.getPreviewUrl(file.id)}#t=0.5`}
                        preload="metadata"
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-white">play_circle</span>
                      </div>
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-semibold rounded-full">
                        <span className="material-symbols-outlined text-[10px]">shield</span>
                        Private
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${getFileColor(
                          file.mimeType
                        )} bg-opacity-10`}
                      >
                        <span
                          className={`material-symbols-outlined text-2xl ${getFileColor(
                            file.mimeType
                          )}`}
                        >
                          {getFileIcon(file.mimeType)}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full">
                        <span className="material-symbols-outlined text-xs">shield</span>
                        Private
                      </span>
                    </div>
                  )}

                  <h3 className="text-sm font-semibold text-[#0F172A] truncate mb-1" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                  </p>
                </div>

                <div
                  className="flex items-center justify-between pt-3 mt-3 border-t border-[#F1F5F9]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-1 text-[#64748B] hover:text-[#2563EB] transition-colors"
                    title="Download"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                  </button>

                  <button
                    onClick={() => handleRemoveFromVault(file)}
                    className="text-xs text-[#64748B] hover:text-[#2563EB] flex items-center gap-1"
                    title="Remove from private vault"
                  >
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    <span>Unvault</span>
                  </button>

                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="p-1 text-[#64748B] hover:text-[#DC2626] transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E2E8F0] rounded-2xl text-center p-6">
          <div className="w-16 h-16 bg-[#EEF2FF] text-[#4F46E5] rounded-3xl flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-3xl">enhanced_encryption</span>
          </div>
          <h2
            className="text-lg font-bold text-[#0F172A]"
            style={{ fontFamily: 'Hanken Grotesk' }}
          >
            No private files in your vault
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm">
            Drag and drop files here or click the button below to store confidential files in your
            encrypted vault.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Upload Private Files</span>
          </button>
        </div>
      )}
    </div>
  );
}
