'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize } from '@/utils/helpers';

const navItems = [
  { label: 'All Files', icon: 'folder_open', href: '/dashboard' },
  { label: 'Photos', icon: 'photo_library', href: '/dashboard/photos' },
  { label: 'Shared with Me', icon: 'group', href: '/dashboard/shared' },
  { label: 'Private Vault', icon: 'lock', href: '/dashboard/private' },
  { label: 'Trash', icon: 'delete', href: '/dashboard/trash' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  const storageUsed = user?.storageUsed || 0;
  const storageLimit = user?.storageLimit || 10737418240;
  const storagePercent = Math.min((storageUsed / storageLimit) * 100, 100);

  if (!sidebarOpen) return null;

  return (
    <aside className="w-60 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 overflow-hidden">
      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#EEF2FF] text-[#2563EB]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? 'text-[#2563EB]' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Storage Meter */}
      <div className="p-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#64748B]">Storage</span>
          <span className="text-xs text-[#94A3B8]">
            {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
          </span>
        </div>
        <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              storagePercent > 90 ? 'bg-[#DC2626]' : storagePercent > 70 ? 'bg-[#D97706]' : 'bg-[#2563EB]'
            }`}
            style={{ width: `${storagePercent}%` }}
          />
        </div>
        {storagePercent > 90 && (
          <p className="text-xs text-[#DC2626] mt-1.5">Storage almost full</p>
        )}
      </div>
    </aside>
  );
}
