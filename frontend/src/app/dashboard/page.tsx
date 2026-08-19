'use client';

import { useEffect, useState } from 'react';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { fileService } from '@/services/fileService';
import { FileItem, Folder } from '@/types';
import { formatFileSize, formatDate, getFileIcon, getFileColor, truncateFileName } from '@/utils/helpers';

export default function DashboardPage() {
  const {
    files, folders, currentFolder, breadcrumb, viewMode, isLoading,
    loadFiles, loadFolders, setCurrentFolder, setViewMode,
    selectedFiles, toggleSelect, selectAll, clearSelection,
  } = useFileStore();
  const { openUploadModal, openShareModal, openDeleteModal, openRenameModal, openMoveModal, openPreview, addToast } = useUIStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string; type: 'file' | 'folder' } | null>(null);

  useEffect(() => {
    loadFiles(currentFolder);
    loadFolders(currentFolder);
  }, []);

  const handleFolderClick = (folderId: string) => {
    setCurrentFolder(folderId);
  };

  const handleBackClick = () => {
    if (breadcrumb.length > 1) {
      const parentId = breadcrumb[breadcrumb.length - 2].id;
      setCurrentFolder(parentId);
    } else {
      setCurrentFolder(null);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const token = localStorage.getItem('vaultx_token');
      const url = `${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}/download`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const file = files.find((f) => f.id === fileId);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file?.name || 'download';
      a.click();
      URL.revokeObjectURL(a.href);
      addToast({ type: 'success', message: 'Download started' });
    } catch {
      addToast({ type: 'error', message: 'Download failed' });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string, type: 'file' | 'folder') => {
    e.preventDefault();
    const menuWidth = 180;
    const menuHeight = 160;
    
    let x = e.clientX;
    let y = e.clientY;
    
    // Prevent menu from going off-screen on the right
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    
    // Prevent menu from going off-screen on the bottom
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setContextMenu({ x, y, id, type });
  };

  return (
    <div onClick={() => setContextMenu(null)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm mb-1">
            <button onClick={() => setCurrentFolder(null)} className="text-[#64748B] hover:text-[#2563EB] font-medium">
              All Files
            </button>
            {breadcrumb.map((item) => (
              <span key={item.id} className="flex items-center gap-1">
                <span className="text-[#94A3B8]">/</span>
                <button onClick={() => handleFolderClick(item.id)} className="text-[#64748B] hover:text-[#2563EB] font-medium">
                  {item.name}
                </button>
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Hanken Grotesk' }}>
            {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'All Files'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5">
            <button onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-[#2563EB]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}>
              <span className="material-symbols-outlined text-xl">view_list</span>
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#2563EB]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}>
              <span className="material-symbols-outlined text-xl">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Folders</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {folders.map((folder) => (
                  <div key={folder.id} 
                    onContextMenu={(e) => handleContextMenu(e, folder.id, 'folder')}
                    onClick={() => handleFolderClick(folder.id)}
                    className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#2563EB] hover:shadow-sm transition-all group cursor-pointer">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="material-symbols-outlined text-2xl text-[#2563EB]">folder</span>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{folder.name}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {folder._count?.files || 0} files
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleContextMenu(e, folder.id, 'folder'); 
                      }} 
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#F1F5F9] rounded text-[#94A3B8] transition-all flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 ? (
            <>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Files</h3>

              {viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E2E8F0]">
                        <th className="w-10 px-4 py-3">
                          <input type="checkbox" onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                            className="w-4 h-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]" />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden md:table-cell">Size</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden lg:table-cell">Modified</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th className="w-12 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id}
                          onClick={() => openPreview(file.id)}
                          onContextMenu={(e) => handleContextMenu(e, file.id, 'file')}
                          className={`border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                            selectedFiles.has(file.id) ? 'bg-[#EEF2FF]' : ''
                          }`}>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={selectedFiles.has(file.id)}
                              onChange={() => toggleSelect(file.id)}
                              className="w-4 h-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-xl ${getFileColor(file.mimeType)}`}>
                                {getFileIcon(file.mimeType)}
                              </span>
                              <span className="text-sm font-medium text-[#0F172A]">{truncateFileName(file.name)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#64748B] hidden md:table-cell">{formatFileSize(file.size)}</td>
                          <td className="px-4 py-3 text-sm text-[#64748B] hidden lg:table-cell">{formatDate(file.uploadedAt)}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {file.isPublic ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#DCFCE7] text-[#16A34A] text-xs font-medium rounded-full">
                                <span className="material-symbols-outlined text-sm">public</span>Public
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-xs font-medium rounded-full">
                                <span className="material-symbols-outlined text-sm">lock</span>Private
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, file.id, 'file'); }}
                              className="p-1 hover:bg-[#E2E8F0] rounded-lg transition-colors">
                              <span className="material-symbols-outlined text-[#64748B]">more_vert</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {files.map((file) => {
                    const isImage = file.mimeType.startsWith('image/');
                    const isVideo = file.mimeType.startsWith('video/');
                    const previewUrl = fileService.getPreviewUrl(file.id);

                    return (
                      <div key={file.id}
                        onClick={() => openPreview(file.id)}
                        onContextMenu={(e) => handleContextMenu(e, file.id, 'file')}
                        className={`bg-white border rounded-xl p-3 hover:shadow-md hover:border-[#2563EB] transition-all cursor-pointer group flex flex-col justify-between ${
                          selectedFiles.has(file.id) ? 'border-[#2563EB] bg-[#EEF2FF]' : 'border-[#E2E8F0]'
                        }`}>
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-[#F8FAFC] mb-2.5 flex items-center justify-center relative border border-slate-100">
                          {isImage ? (
                            <img
                              src={previewUrl}
                              alt={file.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : isVideo ? (
                            <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                              <video
                                src={`${previewUrl}#t=0.5`}
                                preload="metadata"
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl text-white">play_circle</span>
                              </div>
                            </div>
                          ) : (
                            <span className={`material-symbols-outlined text-4xl ${getFileColor(file.mimeType)}`}>
                              {getFileIcon(file.mimeType)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#0F172A] truncate" title={file.name}>{file.name}</p>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-[#94A3B8]">
                            <span>{formatFileSize(file.size)}</span>
                            {file.isPublic && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#DCFCE7] text-[#16A34A] text-[9px] font-medium rounded-full">
                                Public
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            !folders.length && (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-[#E2E8F0] mb-4">cloud_upload</span>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No files yet</h3>
                <p className="text-sm text-[#64748B] mb-6">Upload your first file to get started</p>
                <button onClick={openUploadModal}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-all">
                  <span className="material-symbols-outlined text-lg">upload</span>
                  Upload Files
                </button>
              </div>
            )
          )}
        </>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-50 bg-white rounded-xl border border-[#E2E8F0] shadow-xl py-2 min-w-[180px] animate-scale-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          {contextMenu.type === 'file' && (
            <>
              <button onClick={() => { openPreview(contextMenu.id); setContextMenu(null); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]">
                <span className="material-symbols-outlined text-xl text-[#64748B]">visibility</span>Preview
              </button>
              <button onClick={() => { handleDownload(contextMenu.id); setContextMenu(null); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]">
                <span className="material-symbols-outlined text-xl text-[#64748B]">download</span>Download
              </button>
              <button onClick={() => { openShareModal(contextMenu.id); setContextMenu(null); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]">
                <span className="material-symbols-outlined text-xl text-[#64748B]">share</span>Share
              </button>
              <button onClick={() => { openMoveModal(contextMenu.id); setContextMenu(null); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]">
                <span className="material-symbols-outlined text-xl text-[#64748B]">drive_file_move</span>Move
              </button>
            </>
          )}
          <button onClick={() => { openRenameModal(contextMenu.id, contextMenu.type); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]">
            <span className="material-symbols-outlined text-xl text-[#64748B]">edit</span>Rename
          </button>
          <div className="h-px bg-[#E2E8F0] my-1" />
          <button onClick={() => { openDeleteModal(contextMenu.id, contextMenu.type); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEE2E2]">
            <span className="material-symbols-outlined text-xl">delete</span>Delete
          </button>
        </div>
      )}
    </div>
  );
}
