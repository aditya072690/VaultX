'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StorageLimitModalProps } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatFileSize } from '@/utils/helpers';
import { analytics } from '@/utils/analytics';

export default function StorageLimitModal({
  isOpen,
  onClose,
  storageUsed: propUsed,
  storageLimit: propLimit,
  trashSize: propTrash,
}: StorageLimitModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { storageTrashSize } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute values from props or fallback to user context
  const used = propUsed !== undefined ? propUsed : (user?.storageUsed || 10737418240);
  const limit = propLimit !== undefined ? propLimit : (user?.storageLimit || 10737418240);
  const trash = propTrash !== undefined ? propTrash : storageTrashSize;

  const percentage = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 100;

  useEffect(() => {
    if (isOpen) {
      analytics.trackStorageQuota('view_modal', { used, limit, trash, percentage });
    }
  }, [isOpen, used, limit, trash, percentage]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="storage-limit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#E2E8F0] relative overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-2 rounded-full hover:bg-[#F1F5F9] transition-all"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Warning Icon - Pulsing Animation */}
        <div className="flex justify-center mb-5">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#DC2626]/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-[#DC2626]/15 animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center relative z-10 shadow-xs">
              <span className="material-symbols-outlined text-3xl text-[#DC2626] font-bold">
                warning
              </span>
            </div>
          </div>
        </div>

        {/* Heading */}
        <h2
          id="storage-limit-title"
          className="text-2xl font-bold text-[#0F172A] text-center mb-2 tracking-tight"
          style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
        >
          Storage Limit Reached
        </h2>

        {/* Description */}
        <p className="text-sm text-[#64748B] text-center mb-6 leading-relaxed">
          You&apos;ve used all <span className="font-semibold text-[#0F172A]">{formatFileSize(limit)}</span> of your allocated storage. Delete unused files or upgrade to expand your vault capacity.
        </p>

        {/* Storage Capacity Bar */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center mb-2 text-xs font-semibold text-[#64748B]">
            <span>Storage Used</span>
            <span>Total Limit</span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(percentage, 5)}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#0F172A] font-bold">
              {formatFileSize(used)}
            </span>
            <span className="text-[#64748B] font-medium">
              {formatFileSize(limit)}
            </span>
          </div>

          {/* 100% Capacity Indicator */}
          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            <p className="text-[11px] font-bold text-[#DC2626] tracking-wider uppercase">
              {percentage}% Capacity Reached
            </p>
          </div>
        </div>

        {/* Recovery Hint (if trash size > 0) */}
        {trash > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 flex items-start gap-3 text-xs text-amber-900">
            <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">
              auto_delete
            </span>
            <div className="flex-1">
              <p className="font-semibold text-amber-950">
                Recover space immediately
              </p>
              <p className="text-amber-800 mt-0.5 leading-normal">
                Empty your trash to recover <span className="font-bold">{formatFileSize(trash)}</span> of storage.
              </p>
            </div>
            <button
              onClick={() => {
                analytics.trackStorageQuota('trash_recovery_click', { trashSize: trash });
                onClose();
                router.push('/dashboard/trash');
              }}
              className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer"
            >
              View Trash
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            href="/dashboard/billing"
            className="block"
            onClick={() => {
              analytics.trackStorageQuota('upgrade_click', { plan: 'pro', currentUsed: used });
              onClose();
            }}
          >
            <button
              type="button"
              className="w-full py-3 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm active:scale-[0.99] cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg font-bold">
                rocket_launch
              </span>
              Upgrade to Pro Plan
            </button>
          </Link>

          <Link
            href="/dashboard/analytics"
            className="block"
            onClick={() => {
              analytics.trackStorageQuota('manage_files_click', { currentUsed: used });
              onClose();
            }}
          >
            <button
              type="button"
              className="w-full py-2.5 px-5 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">
                folder_open
              </span>
              Manage & Clean Files
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
