'use client';

import { useState, useEffect } from 'react';
import { fileService } from '@/services/fileService';
import { FileItem } from '@/types';
import { formatFileSize, formatDate, getFileIcon, getFileColor } from '@/utils/helpers';
import { useUIStore } from '@/store/uiStore';

interface FilePreviewModalProps {
  fileId: string;
  fileName?: string;
  permission?: 'view' | 'download' | 'upload';
  onClose: () => void;
}

export default function FilePreviewModal({
  fileId,
  fileName,
  permission = 'download',
  onClose,
}: FilePreviewModalProps) {
  const { addToast } = useUIStore();
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadFileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await fileService.getFile(fileId);
        if (!active) return;
        setFile(item);

        const previewUrl = fileService.getPreviewUrl(fileId);

        if (
          item.mimeType.startsWith('image/') ||
          item.mimeType.startsWith('video/') ||
          item.mimeType.startsWith('audio/') ||
          item.mimeType === 'application/pdf'
        ) {
          if (active) {
            setPreviewBlobUrl(previewUrl);
          }
        } else if (item.mimeType.startsWith('text/') || item.mimeType.includes('json') || item.mimeType.includes('javascript')) {
          const token = localStorage.getItem('vaultx_token');
          const res = await fetch(previewUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const text = await res.text();
            if (active) setTextContent(text.slice(0, 50000));
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.response?.data?.error || err.message || 'Unable to load file preview');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFileData();

    return () => {
      active = false;
    };
  }, [fileId]);

  const handleDownload = async () => {
    if (permission === 'view') {
      addToast({ type: 'warning', message: 'You have view-only access. Downloading is disabled.' });
      return;
    }
    setDownloading(true);
    try {
      const token = localStorage.getItem('vaultx_token');
      const url = fileService.getDownloadUrl(fileId);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Download failed');
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file?.name || fileName || 'download';
      a.click();
      URL.revokeObjectURL(a.href);
      addToast({ type: 'success', message: 'Download started' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Download failed' });
    } finally {
      setDownloading(false);
    }
  };

  const isViewOnly = permission === 'view';
  const effectiveName = file?.name || fileName || 'File Preview';
  const effectiveMime = file?.mimeType || 'application/octet-stream';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E8F0] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`material-symbols-outlined text-2xl ${getFileColor(effectiveMime)}`}>
              {getFileIcon(effectiveMime)}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#0F172A] truncate" style={{ fontFamily: 'Hanken Grotesk' }}>
                {effectiveName}
              </h2>
              <p className="text-xs text-[#64748B] flex items-center gap-2">
                {file && <span>{formatFileSize(file.size)}</span>}
                {file && <span>•</span>}
                <span className="truncate">{effectiveMime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isViewOnly ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold rounded-lg border border-[#C7D2FE]">
                <span className="material-symbols-outlined text-sm">visibility</span>
                View Only
              </span>
            ) : (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">download</span>
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Preview Viewer Area */}
        <div className="flex-1 bg-[#0F172A] overflow-auto flex items-center justify-center p-4 relative min-h-[360px]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-xs text-white/70">Loading preview...</p>
            </div>
          ) : error ? (
            <div className="text-center p-6 max-w-md bg-white/10 rounded-2xl backdrop-blur-md text-white">
              <span className="material-symbols-outlined text-4xl text-amber-400 mb-2">visibility_off</span>
              <h3 className="text-sm font-semibold mb-1">Preview Notice</h3>
              <p className="text-xs text-slate-300 mb-4">{error}</p>
              {!isViewOnly && (
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Download File Instead
                </button>
              )}
            </div>
          ) : previewBlobUrl && effectiveMime.startsWith('image/') ? (
            <img
              src={previewBlobUrl}
              alt={effectiveName}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : previewBlobUrl && effectiveMime.startsWith('video/') ? (
            <video
              src={previewBlobUrl}
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded-lg shadow-lg"
            />
          ) : previewBlobUrl && effectiveMime.startsWith('audio/') ? (
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-5xl text-pink-400 animate-pulse">audiotrack</span>
              <audio src={previewBlobUrl} controls className="w-80" />
            </div>
          ) : previewBlobUrl && effectiveMime === 'application/pdf' ? (
            <iframe
              src={previewBlobUrl}
              className="w-full h-[70vh] rounded-lg bg-white border-0"
              title={effectiveName}
            />
          ) : textContent !== null ? (
            <pre className="bg-[#1E293B] text-slate-200 p-6 rounded-xl text-xs font-mono w-full h-[70vh] overflow-auto whitespace-pre-wrap border border-slate-700">
              {textContent}
            </pre>
          ) : (
            <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur-md text-white max-w-sm">
              <span className={`material-symbols-outlined text-6xl mb-3 ${getFileColor(effectiveMime)}`}>
                {getFileIcon(effectiveMime)}
              </span>
              <h3 className="text-sm font-semibold text-white mb-1">{effectiveName}</h3>
              <p className="text-xs text-slate-400 mb-4">
                This file format cannot be directly previewed in the browser.
              </p>
              {!isViewOnly ? (
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Download to View
                </button>
              ) : (
                <p className="text-xs text-amber-300">View-only mode is active for this share.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            {file?.uploadedAt && <span>Uploaded {formatDate(file.uploadedAt)}</span>}
            {isViewOnly && (
              <span className="text-amber-600 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-xs">info</span>
                Downloading disabled by file owner
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
