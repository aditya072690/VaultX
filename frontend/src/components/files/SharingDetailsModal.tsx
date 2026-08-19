'use client';

import { useState } from 'react';
import { SharedFileItem } from '@/types';
import { formatDateFull, formatFileSize, getFileIcon, getFileColor, getInitials } from '@/utils/helpers';
import { fileService } from '@/services/fileService';
import { useUIStore } from '@/store/uiStore';

interface SharingDetailsModalProps {
  share: SharedFileItem;
  isOwner?: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onPreview?: (fileId: string) => void;
}

export default function SharingDetailsModal({
  share,
  isOwner = false,
  onClose,
  onRefresh,
  onPreview,
}: SharingDetailsModalProps) {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  const party = isOwner ? share.sharedWith : share.sharedBy;
  const isPending = share.status === 'pending';
  const isExpired = share.status === 'expired';

  const handleAccept = async () => {
    setLoading(true);
    try {
      await fileService.acceptShare(share.id);
      addToast({ type: 'success', message: 'Share accepted successfully' });
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to accept share' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await fileService.rejectShare(share.id);
      addToast({ type: 'info', message: 'Share rejected' });
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to reject share' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm(isOwner ? 'Revoke this recipient’s access to the file?' : 'Remove this file from your shared drive?')) {
      return;
    }
    setLoading(true);
    try {
      await fileService.deleteShare(share.id);
      addToast({
        type: 'success',
        message: isOwner ? 'Recipient access revoked' : 'File removed from your drive',
      });
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to remove share' });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToPrivate = async () => {
    if (!confirm('Move file to private vault? This will revoke all public links and user shares.')) {
      return;
    }
    setLoading(true);
    try {
      await fileService.moveToPrivate(share.fileId);
      addToast({ type: 'success', message: 'File moved to private vault' });
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to move file' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (share.permission === 'view') {
      addToast({ type: 'warning', message: 'View-only permissions do not allow downloading' });
      return;
    }
    try {
      const token = localStorage.getItem('vaultx_token');
      const url = fileService.getDownloadUrl(share.fileId);
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
      a.download = share.fileName;
      a.click();
      URL.revokeObjectURL(a.href);
      addToast({ type: 'success', message: 'Download started' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Download failed' });
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E2E8F0] animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`material-symbols-outlined text-2xl ${getFileColor(share.fileMimeType)}`}>
              {getFileIcon(share.fileMimeType)}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#0F172A] truncate" style={{ fontFamily: 'Hanken Grotesk' }}>
                {share.fileName}
              </h2>
              <p className="text-xs text-[#64748B] flex items-center gap-2">
                <span>{formatFileSize(share.fileSize)}</span>
                <span>•</span>
                <span>{isOwner ? 'Shared by you' : `Shared by ${share.sharedBy?.name || 'User'}`}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* User Profile Card */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">
              {isOwner ? 'Recipient Information' : 'Sharer Information'}
            </div>
            <div className="flex items-center gap-3.5">
              {party?.avatar ? (
                <img
                  src={party.avatar}
                  alt={party.name}
                  className="w-12 h-12 rounded-full object-cover border border-[#CBD5E1]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {party ? getInitials(party.name.split(' ')[0] || '', party.name.split(' ')[1] || '') : 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-[#0F172A] truncate">{party?.name || 'Unknown User'}</div>
                <div className="text-xs text-[#64748B] truncate">{party?.email || 'No email provided'}</div>
                <div className="text-[11px] text-[#94A3B8] mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  Shared on {formatDateFull(share.sharedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Current Permissions & Status Card */}
          <div className="border border-[#E2E8F0] rounded-xl p-4 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Permission Level</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  share.status === 'active'
                    ? 'bg-[#DCFCE7] text-[#16A34A]'
                    : share.status === 'pending'
                    ? 'bg-[#FEF3C7] text-[#D97706]'
                    : share.status === 'expired'
                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {share.status.charAt(0).toUpperCase() + share.status.slice(1)}
              </span>
            </div>

            {/* Permission Option Display */}
            <div className="grid grid-cols-1 gap-2.5">
              <div
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  share.permission === 'view'
                    ? 'border-[#2563EB] bg-[#EFF6FF]'
                    : 'border-[#E2E8F0] bg-[#FAFAFA] opacity-60'
                }`}
              >
                <span className="material-symbols-outlined text-lg text-[#2563EB] mt-0.5">visibility</span>
                <div className="text-xs">
                  <div className="font-semibold text-[#0F172A]">View Only</div>
                  <div className="text-[#64748B]">Recipient can preview and stream the file online without direct downloading.</div>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  share.permission === 'download'
                    ? 'border-[#16A34A] bg-[#F0FDF4]'
                    : 'border-[#E2E8F0] bg-[#FAFAFA] opacity-60'
                }`}
              >
                <span className="material-symbols-outlined text-lg text-[#16A34A] mt-0.5">download</span>
                <div className="text-xs">
                  <div className="font-semibold text-[#0F172A]">Download Allowed</div>
                  <div className="text-[#64748B]">Recipient has full permission to download and save the file offline.</div>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  share.permission === 'upload'
                    ? 'border-[#8B5CF6] bg-[#F5F3FF]'
                    : 'border-[#E2E8F0] bg-[#FAFAFA] opacity-60'
                }`}
              >
                <span className="material-symbols-outlined text-lg text-[#8B5CF6] mt-0.5">drive_folder_upload</span>
                <div className="text-xs">
                  <div className="font-semibold text-[#0F172A]">Upload & Edit</div>
                  <div className="text-[#64748B]">Recipient can download, replace, and upload updated versions.</div>
                </div>
              </div>
            </div>

            {/* Expiration Details */}
            <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
              <span className="text-[#64748B] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">event</span>
                Access Expiration
              </span>
              <span className="font-medium text-[#0F172A]">
                {share.expiresAt ? formatDateFull(share.expiresAt) : 'Never expires (Permanent)'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isPending && !isOwner && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  Accept Share
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                  Reject
                </button>
              </>
            )}

            {share.status === 'active' && !isExpired && (
              <>
                {onPreview && (
                  <button
                    onClick={() => {
                      onPreview(share.fileId);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Preview
                  </button>
                )}

                {share.permission !== 'view' && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Download
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={handleMoveToPrivate}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] text-xs font-medium rounded-lg transition-all"
                  title="Make this file strictly private and revoke all shares"
                >
                  <span className="material-symbols-outlined text-base">lock</span>
                  Move to Private
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-2 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-base">person_remove</span>
                  Revoke Share
                </button>
              </>
            ) : (
              <button
                onClick={handleRevoke}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Remove from Drive
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
