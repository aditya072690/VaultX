'use client';

import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { fileService } from '@/services/fileService';

export default function CreateFolderModal() {
  const { closeCreateFolderModal, addToast } = useUIStore();
  const { currentFolder, refreshFiles } = useFileStore();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await fileService.createFolder(name.trim(), currentFolder || undefined);
      addToast({ type: 'success', message: `Folder "${name}" created` });
      refreshFiles();
      closeCreateFolderModal();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create folder' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCreateFolderModal} />
      <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl w-full max-w-md mx-4 animate-scale-in">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4" style={{ fontFamily: 'Hanken Grotesk' }}>
            Create New Folder
          </h2>
          <form onSubmit={handleCreate}>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Folder name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
              className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeCreateFolderModal}
                className="px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!name.trim() || isCreating}
                className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {isCreating ? 'Creating...' : 'Create Folder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
