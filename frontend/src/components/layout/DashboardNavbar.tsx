'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { getInitials } from '@/utils/helpers';

export default function DashboardNavbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toggleSidebar, openUploadModal, openCreateFolderModal } = useUIStore();
  const { setSearchQuery } = useFileStore();
  const [searchInput, setSearchInput] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center px-4 gap-4 z-40 shrink-0">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="p-1.5 hover:bg-[#F8FAFC] rounded-lg transition-colors lg:hidden"
        >
          <span className="material-symbols-outlined text-[#64748B]">menu</span>
        </button>
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="p-1.5 hover:bg-[#F8FAFC] rounded-lg transition-colors hidden lg:block"
        >
          <span className="material-symbols-outlined text-[#64748B]">menu</span>
        </button>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push('/dashboard')}
        >
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-white text-lg">shield_lock</span>
          </div>
          <span
            className="text-lg font-bold text-[#0F172A] hidden sm:block tracking-tight"
            style={{ fontFamily: 'Hanken Grotesk' }}
          >
            VaultX
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xl">
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search files, folders..."
            className="w-full pl-10 pr-16 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </span>
        </div>
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={openUploadModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-all shadow-xs hover:shadow"
        >
          <span className="material-symbols-outlined text-lg">upload</span>
          <span className="hidden sm:inline">Upload</span>
        </button>

        <button
          onClick={openCreateFolderModal}
          className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] text-[#0F172A] text-sm font-medium rounded-lg hover:bg-[#F8FAFC] transition-all hidden sm:flex"
        >
          <span className="material-symbols-outlined text-lg">create_new_folder</span>
          New Folder
        </button>

        {/* Notifications */}
        <button
          aria-label="View notifications"
          className="relative p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[#64748B]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="User profile menu"
            className="flex items-center gap-2 p-1 hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-[#E2E8F0] shadow-lg animate-scale-in z-50">
              <div className="p-4 border-b border-[#E2E8F0]">
                <p className="text-sm font-semibold text-[#0F172A]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">{user?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push('/dashboard/settings');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[#64748B] text-xl">settings</span>
                  Settings
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push('/dashboard/activity');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[#64748B] text-xl">history</span>
                  Activity Log
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    useUIStore.getState().openWelcomeTour();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[#2563EB] text-xl">explore</span>
                  Product Tour
                </button>
                <div className="h-px bg-[#E2E8F0] my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
