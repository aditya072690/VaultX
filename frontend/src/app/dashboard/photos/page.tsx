'use client';

import { useEffect, useState, useMemo } from 'react';
import { fileService } from '@/services/fileService';
import { FileItem } from '@/types';
import { formatFileSize, formatDate, getFileIcon, getFileColor } from '@/utils/helpers';
import { useUIStore } from '@/store/uiStore';

type MediaFilter = 'all' | 'images' | 'videos';

export default function PhotosPage() {
  const { openPreview, openUploadModal, openShareModal, addToast } = useUIStore();
  const [mediaItems, setMediaItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const loadMedia = async () => {
    setLoading(true);
    try {
      // Query images & videos using 'media' or specific filter
      const mimeQuery = filter === 'images' ? 'image/' : filter === 'videos' ? 'video/' : 'media';
      const result = await fileService.listFiles({ mimeType: mimeQuery, limit: 100 });
      setMediaItems(result.files || []);
    } catch {
      addToast({ type: 'error', message: 'Failed to load photos and media' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [filter]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return mediaItems;
    const q = searchQuery.toLowerCase();
    return mediaItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [mediaItems, searchQuery]);

  const stats = useMemo(() => {
    const totalBytes = mediaItems.reduce((acc, item) => acc + Number(item.size), 0);
    const photoCount = mediaItems.filter((i) => i.mimeType.startsWith('image/')).length;
    const videoCount = mediaItems.filter((i) => i.mimeType.startsWith('video/')).length;
    return { totalBytes, photoCount, videoCount };
  }, [mediaItems]);

  const handleDownload = async (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('vaultx_token');
      const url = fileService.getDownloadUrl(item.id);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = item.name;
      a.click();
      URL.revokeObjectURL(a.href);
      addToast({ type: 'success', message: `Downloaded ${item.name}` });
    } catch {
      addToast({ type: 'error', message: 'Failed to download file' });
    }
  };

  const handleShare = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    openShareModal(item.id);
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight" style={{ fontFamily: 'Hanken Grotesk' }}>
            Photos &amp; Media
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {loading ? (
              'Loading your media library...'
            ) : (
              <span>
                {mediaItems.length} {mediaItems.length === 1 ? 'item' : 'items'}
                {stats.photoCount > 0 && ` • ${stats.photoCount} ${stats.photoCount === 1 ? 'photo' : 'photos'}`}
                {stats.videoCount > 0 && ` • ${stats.videoCount} ${stats.videoCount === 1 ? 'video' : 'videos'}`}
                {mediaItems.length > 0 && ` • ${formatFileSize(stats.totalBytes)} total`}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openUploadModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:shadow hover:scale-[1.01]"
          >
            <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
            Upload Media
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-base">perm_media</span>
            All Media
          </button>
          <button
            onClick={() => setFilter('images')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'images'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-base">image</span>
            Photos
          </button>
          <button
            onClick={() => setFilter('videos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'videos'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-base">videocam</span>
            Videos
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#94A3B8]">
            search
          </span>
          <input
            type="text"
            placeholder="Search media by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden animate-pulse shadow-sm"
            >
              <div className="aspect-square bg-slate-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredItems.map((item) => {
            const isVideo = item.mimeType.startsWith('video/');
            const previewUrl = fileService.getPreviewUrl(item.id);
            const hasError = imageErrors[item.id];

            return (
              <div
                key={item.id}
                onClick={() => openPreview(item.id)}
                className="group relative bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
              >
                {/* Media Preview Box */}
                <div className="aspect-square bg-[#0F172A]/5 relative overflow-hidden flex items-center justify-center">
                  {!hasError ? (
                    isVideo ? (
                      <>
                        <video
                          src={`${previewUrl}#t=0.5`}
                          preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          muted
                          playsInline
                        />
                        {/* Video Play Badge */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/90 group-hover:bg-white text-[#2563EB] shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl ml-0.5">play_arrow</span>
                          </div>
                        </div>
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold rounded uppercase tracking-wider">
                          {item.mimeType.replace('video/', '')}
                        </span>
                      </>
                    ) : (
                      <img
                        src={previewUrl}
                        alt={item.name}
                        loading="lazy"
                        onError={() => handleImageError(item.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <span className={`material-symbols-outlined text-4xl mb-1 ${getFileColor(item.mimeType)}`}>
                        {getFileIcon(item.mimeType)}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">Preview unavailable</span>
                    </div>
                  )}

                  {/* Top Action Badge on Hover */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => handleShare(e, item)}
                      title="Share"
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">share</span>
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, item)}
                      title="Download"
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-3 bg-white flex flex-col justify-between flex-1 border-t border-slate-100">
                  <p
                    className="text-xs font-semibold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-1">
                    <span>{formatFileSize(item.size)}</span>
                    <span>{formatDate(item.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">photo_library</span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">
            {searchQuery ? 'No matching media found' : 'No photos or videos yet'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mb-6">
            {searchQuery
              ? `We couldn't find any media matching "${searchQuery}". Try a different search term.`
              : 'Upload photos, screenshots, and videos to organize, preview, and share them securely in VaultX.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-xl transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={openUploadModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-base">upload</span>
              Upload Your First Photo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
