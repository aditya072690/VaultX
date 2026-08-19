'use client';

import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { fileService } from '@/services/fileService';
import { Folder } from '@/types';

export default function MoveModal() {
  const { moveModalFileId, closeMoveModal, addToast } = useUIStore();
  const { files, loadFiles, currentFolder } = useFileStore();
  
  const file = files.find((f) => f.id === moveModalFileId);
  
  const [loading, setLoading] = useState(false);
  const isMovingRef = useRef(false);
  const [navFolderId, setNavFolderId] = useState<string | null>(null);
  const [navFolders, setNavFolders] = useState<Folder[]>([]);
  const [navBreadcrumb, setNavBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    if (moveModalFileId) {
      setNavFolderId(null);
      setNavBreadcrumb([]);
      fetchFolders(null);
    }
  }, [moveModalFileId]);

  const fetchFolders = async (parentId: string | null) => {
    setLoadingFolders(true);
    try {
      const fetched = await fileService.listFolders(parentId || undefined);
      setNavFolders(fetched);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load folders' });
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleNavigate = async (folder: Folder) => {
    setNavFolderId(folder.id);
    setNavBreadcrumb([...navBreadcrumb, { id: folder.id, name: folder.name }]);
    await fetchFolders(folder.id);
  };

  const handleBack = async () => {
    if (navBreadcrumb.length <= 1) {
      setNavFolderId(null);
      setNavBreadcrumb([]);
      await fetchFolders(null);
    } else {
      const newBreadcrumb = [...navBreadcrumb];
      newBreadcrumb.pop();
      const parent = newBreadcrumb[newBreadcrumb.length - 1];
      setNavFolderId(parent.id);
      setNavBreadcrumb(newBreadcrumb);
      await fetchFolders(parent.id);
    }
  };

  const handleNavigateRoot = async () => {
    setNavFolderId(null);
    setNavBreadcrumb([]);
    await fetchFolders(null);
  };

  if (!moveModalFileId || !file) return null;

  const handleMove = async () => {
    if (isMovingRef.current || loading) return;
    
    // Cannot move a file to its current folder
    if (file.folderId === navFolderId) {
      addToast({ type: 'info', message: 'File is already in this folder' });
      closeMoveModal();
      return;
    }

    isMovingRef.current = true;
    setLoading(true);
    try {
      await fileService.moveFile(file.id, navFolderId);
      addToast({ type: 'success', message: 'File moved successfully' });
      loadFiles(currentFolder);
      closeMoveModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.response?.data?.error || 'Failed to move file' });
    } finally {
      setLoading(false);
      isMovingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A]">Move File</h2>
          <button onClick={closeMoveModal} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-1 text-sm text-[#64748B] overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button onClick={handleNavigateRoot} className="hover:text-[#2563EB] font-medium transition-colors">
              VaultX
            </button>
            {navBreadcrumb.map((item, index) => (
              <span key={item.id} className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className={index === navBreadcrumb.length - 1 ? "font-medium text-[#0F172A]" : "hover:text-[#2563EB] cursor-pointer"}
                  onClick={() => {
                    // Navigate to this breadcrumb step
                    const newBreadcrumb = navBreadcrumb.slice(0, index + 1);
                    setNavBreadcrumb(newBreadcrumb);
                    setNavFolderId(item.id);
                    fetchFolders(item.id);
                  }}>
                  {item.name}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
          {loadingFolders ? (
            <div className="flex justify-center items-center h-32">
              <span className="material-symbols-outlined animate-spin text-[#2563EB]">sync</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {navFolderId !== null && (
                <button onClick={handleBack}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] text-left transition-colors text-[#64748B]">
                  <span className="material-symbols-outlined">arrow_back</span>
                  <span className="text-sm font-medium">Back</span>
                </button>
              )}
              
              {navFolders.length === 0 ? (
                <div className="text-center py-8 text-[#94A3B8] text-sm">
                  This folder is empty
                </div>
              ) : (
                navFolders.map((folder) => (
                  <button key={folder.id} onClick={() => handleNavigate(folder)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] group text-left transition-colors">
                    <span className="material-symbols-outlined text-2xl text-[#2563EB]">folder</span>
                    <span className="text-sm font-medium text-[#0F172A] flex-1 truncate">{folder.name}</span>
                    <span className="material-symbols-outlined text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-[#E2E8F0] bg-white mt-auto">
          <div className="flex justify-between items-center">
            <div className="text-xs text-[#64748B] truncate mr-4">
              Moving: <span className="font-medium text-[#0F172A]">{file.name}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={closeMoveModal}
                className="px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleMove} disabled={loading || loadingFolders}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:hover:bg-[#2563EB] text-white text-sm font-semibold rounded-lg transition-colors">
                {loading ? 'Moving...' : 'Move Here'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
