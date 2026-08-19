'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { useAuthStore } from '@/store/authStore';
import { fileService } from '@/services/fileService';
import { formatFileSize, getFileIcon, getFileColor } from '@/utils/helpers';

interface UploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export default function UploadModal() {
  const { closeUploadModal, addToast, openStorageLimitModal } = useUIStore();
  const { user } = useAuthStore();
  const { currentFolder, refreshFiles } = useFileStore();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploads((prev) => [...prev, ...newUploads]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 104857600, // 100MB
  });

  const handleUpload = async () => {
    if (uploads.length === 0) return;

    // Check if adding pending files would exceed quota
    const pendingTotal = uploads
      .filter((u) => u.status === 'pending')
      .reduce((acc, u) => acc + u.file.size, 0);

    if (user && user.storageLimit && user.storageUsed + pendingTotal > user.storageLimit) {
      closeUploadModal();
      openStorageLimitModal();
      return;
    }

    setIsUploading(true);

    let hasErrors = false;
    let hasSuccess = false;

    for (let i = 0; i < uploads.length; i++) {
      if (uploads[i].status !== 'pending') continue;

      setUploads((prev) =>
        prev.map((u, idx) => idx === i ? { ...u, status: 'uploading' } : u)
      );

      try {
        await fileService.uploadFile(
          uploads[i].file,
          currentFolder || undefined,
          (progress) => {
            setUploads((prev) =>
              prev.map((u, idx) => idx === i ? { ...u, progress } : u)
            );
          }
        );
        setUploads((prev) =>
          prev.map((u, idx) => idx === i ? { ...u, status: 'done', progress: 100 } : u)
        );
        hasSuccess = true;
      } catch (err: any) {
        hasErrors = true;
        const isQuota =
          err?.response?.status === 413 ||
          err?.status === 413 ||
          err?.message?.includes('Storage limit') ||
          err?.message?.includes('quota');

        if (isQuota) {
          const trashSize = err?.response?.data?.trashSize || 0;
          setIsUploading(false);
          closeUploadModal();
          openStorageLimitModal(trashSize);
          return;
        }

        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === i ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u
          )
        );
      }
    }

    setIsUploading(false);
    if (hasSuccess) {
      addToast({ type: 'success', message: 'Files uploaded successfully!' });
      refreshFiles();
    }
  };

  const removeFile = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeUploadModal} />
      <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl w-full max-w-lg mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: 'Hanken Grotesk' }}>
            Upload Files
          </h2>
          <button onClick={closeUploadModal} className="p-1 hover:bg-[#F8FAFC] rounded-lg">
            <span className="material-symbols-outlined text-[#64748B]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragActive
                ? 'border-[#2563EB] bg-[#EEF2FF]'
                : 'border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC]'
            }`}
          >
            <input {...getInputProps()} />
            <span className="material-symbols-outlined text-4xl text-[#2563EB] mb-3 block">cloud_upload</span>
            <p className="text-sm font-medium text-[#0F172A]">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">or click to browse • Max 100MB per file</p>
          </div>

          {/* File List */}
          {uploads.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {uploads.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <span className={`material-symbols-outlined text-xl ${getFileColor(item.file.type)}`}>
                    {getFileIcon(item.file.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#94A3B8]">{formatFileSize(item.file.size)}</span>
                      {item.status === 'uploading' && (
                        <div className="flex-1 h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                      {item.status === 'done' && (
                        <span className="material-symbols-outlined text-sm text-[#16A34A]">check_circle</span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-xs text-[#DC2626]">{item.error}</span>
                      )}
                    </div>
                  </div>
                  {item.status === 'pending' && (
                    <button onClick={() => removeFile(idx)} className="text-[#94A3B8] hover:text-[#DC2626]">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-0">
          <button onClick={closeUploadModal}
            className="px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleUpload} disabled={uploads.length === 0 || isUploading}
            className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
            {isUploading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">upload</span>Upload {uploads.length > 0 && `(${uploads.length})`}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
