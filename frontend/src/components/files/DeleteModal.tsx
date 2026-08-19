'use client';

import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { fileService } from '@/services/fileService';

export default function DeleteModal() {
  const { deleteModalItem, closeDeleteModal, addToast } = useUIStore();
  const { files, folders, loadFiles, loadFolders, currentFolder } = useFileStore();
  
  const item = deleteModalItem?.type === 'folder'
    ? folders.find((f) => f.id === deleteModalItem.id)
    : files.find((f) => f.id === deleteModalItem?.id);
  
  const [loading, setLoading] = useState(false);

  if (!deleteModalItem || !item) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (deleteModalItem.type === 'folder') {
        await fileService.deleteFolder(item.id);
        addToast({ type: 'success', message: 'Folder moved to trash' });
        loadFolders(currentFolder);
      } else {
        await fileService.deleteFile(item.id);
        addToast({ type: 'success', message: 'File moved to trash' });
        loadFiles(currentFolder);
      }
      closeDeleteModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.response?.data?.error || `Failed to delete ${deleteModalItem.type}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A]">Delete {deleteModalItem.type === 'folder' ? 'Folder' : 'File'}</h2>
          <button onClick={closeDeleteModal} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6 p-4 bg-[#FEF2F2] rounded-xl text-[#DC2626]">
            <span className="material-symbols-outlined text-2xl">warning</span>
            <div>
              <h3 className="font-semibold mb-1">Are you sure?</h3>
              <p className="text-sm opacity-90">
                &quot;{item.name}&quot; will be moved to the trash.
                {deleteModalItem.type === 'folder' && ' All contents inside this folder will also be moved to the trash.'}
                You can restore it later if needed.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 disabled:hover:bg-[#DC2626] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Moving to Trash...' : 'Move to Trash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
