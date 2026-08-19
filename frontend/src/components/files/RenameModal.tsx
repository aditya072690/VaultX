'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { fileService } from '@/services/fileService';

export default function RenameModal() {
  const { renameModalItem, closeRenameModal, addToast } = useUIStore();
  const { files, folders, loadFiles, loadFolders, currentFolder } = useFileStore();
  
  const item = renameModalItem?.type === 'folder'
    ? folders.find((f) => f.id === renameModalItem.id)
    : files.find((f) => f.id === renameModalItem?.id);
  
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      // Strip extension if it's a file
      if (renameModalItem?.type === 'file' && item.name.includes('.')) {
        setName(item.name.substring(0, item.name.lastIndexOf('.')));
      } else {
        setName(item.name);
      }
    }
  }, [item, renameModalItem]);

  if (!renameModalItem || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (renameModalItem.type === 'folder') {
        await fileService.renameFolder(item.id, name.trim());
        addToast({ type: 'success', message: 'Folder renamed successfully' });
        loadFolders(currentFolder);
      } else {
        const extension = item.name.includes('.') ? item.name.substring(item.name.lastIndexOf('.')) : '';
        const newName = `${name.trim()}${extension}`;
        await fileService.renameFile(item.id, newName);
        addToast({ type: 'success', message: 'File renamed successfully' });
        loadFiles(currentFolder);
      }
      closeRenameModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.response?.data?.error || `Failed to rename ${renameModalItem.type}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A]">Rename {renameModalItem.type === 'folder' ? 'Folder' : 'File'}</h2>
          <button onClick={closeRenameModal} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#64748B] mb-2">New Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-[#0F172A]"
              placeholder="Enter new name"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeRenameModal}
              className="px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:hover:bg-[#2563EB] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
