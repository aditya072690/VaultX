'use client';

import { useEffect, useState } from 'react';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { fileService } from '@/services/fileService';
import { FileItem, Folder } from '@/types';
import { formatFileSize, formatDate, getFileIcon, getFileColor } from '@/utils/helpers';

type TrashItem = 
  | { type: 'file'; item: FileItem }
  | { type: 'folder'; item: Folder };

export default function TrashPage() {
  const { addToast } = useUIStore();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const [filesResult, foldersResult] = await Promise.all([
        fileService.listFiles({ includeDeleted: 'true' }),
        fileService.listFolders(undefined, true)
      ]);
      
      const deletedFiles = filesResult.files
        .filter((f) => f.deletedAt)
        .map(f => ({ type: 'file' as const, item: f }));
        
      const deletedFolders = foldersResult
        .filter((f) => f.deletedAt)
        .map(f => ({ type: 'folder' as const, item: f }));

      setItems([...deletedFolders, ...deletedFiles]);
    } catch {
      addToast({ type: 'error', message: 'Failed to load trash' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrash(); }, []);

  const handleRestore = async (type: 'file' | 'folder', id: string) => {
    try {
      if (type === 'file') {
        await fileService.restoreFile(id);
      } else {
        await fileService.restoreFolder(id);
      }
      addToast({ type: 'success', message: `${type === 'file' ? 'File' : 'Folder'} restored` });
      loadTrash();
    } catch {
      addToast({ type: 'error', message: `Failed to restore ${type}` });
    }
  };

  const handlePermanentDelete = async (type: 'file' | 'folder', id: string) => {
    if (!confirm('This action cannot be undone. Delete permanently?')) return;
    try {
      if (type === 'file') {
        await fileService.permanentDelete(id);
      } else {
        await fileService.permanentDeleteFolder(id);
      }
      addToast({ type: 'success', message: `${type === 'file' ? 'File' : 'Folder'} permanently deleted` });
      loadTrash();
    } catch {
      addToast({ type: 'error', message: `Failed to delete ${type}` });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Hanken Grotesk' }}>Trash</h1>
          <p className="text-sm text-[#64748B] mt-1">Items in trash will be permanently deleted after 30 days</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : items.length > 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden md:table-cell">Size</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden lg:table-cell">Deleted</th>
                <th className="w-32 px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ type, item }) => (
                <tr key={`${type}-${item.id}`} className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {type === 'folder' ? (
                        <span className="material-symbols-outlined text-xl text-[#3B82F6]">folder</span>
                      ) : (
                        <span className={`material-symbols-outlined text-xl ${getFileColor((item as FileItem).mimeType)}`}>{getFileIcon((item as FileItem).mimeType)}</span>
                      )}
                      <span className="text-sm font-medium text-[#0F172A]">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748B] hidden md:table-cell">
                    {type === 'folder' ? '-' : formatFileSize((item as FileItem).size)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748B] hidden lg:table-cell">
                    {item.deletedAt ? formatDate(item.deletedAt) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleRestore(type, item.id)}
                        className="p-1.5 hover:bg-[#DCFCE7] rounded-lg transition-colors" title="Restore">
                        <span className="material-symbols-outlined text-lg text-[#16A34A]">restore</span>
                      </button>
                      <button onClick={() => handlePermanentDelete(type, item.id)}
                        className="p-1.5 hover:bg-[#FEE2E2] rounded-lg transition-colors" title="Delete permanently">
                        <span className="material-symbols-outlined text-lg text-[#DC2626]">delete_forever</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-6xl text-[#E2E8F0] mb-4">delete_sweep</span>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Trash is empty</h3>
          <p className="text-sm text-[#64748B]">Deleted items will appear here</p>
        </div>
      )}
    </div>
  );
}
