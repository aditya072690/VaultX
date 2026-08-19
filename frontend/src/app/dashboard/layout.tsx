'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import Sidebar from '@/components/layout/Sidebar';
import ToastList from '@/components/common/ToastList';
import UploadModal from '@/components/files/UploadModal';
import CreateFolderModal from '@/components/files/CreateFolderModal';
import RenameModal from '@/components/files/RenameModal';
import DeleteModal from '@/components/files/DeleteModal';
import ShareModal from '@/components/files/ShareModal';
import MoveModal from '@/components/files/MoveModal';
import FilePreviewModal from '@/components/files/FilePreviewModal';
import WelcomeTourModal from '@/components/common/WelcomeTourModal';
import StorageLimitModal from '@/components/common/StorageLimitModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, loadUser, token } = useAuthStore();
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const { 
    sidebarOpen, 
    uploadModalOpen, 
    createFolderModalOpen,
    renameModalItem,
    deleteModalItem,
    shareModalFileId,
    moveModalFileId,
    previewFileId,
    welcomeTourOpen,
    openWelcomeTour,
    closeWelcomeTour,
    storageLimitModalOpen,
    storageTrashSize,
    closeStorageLimitModal,
    closePreview,
  } = useUIStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      router.push('/login');
      return;
    }
    loadUser();
  }, [token, loadUser, router]);

  // Trigger welcome tour on first login or if onboarding is not completed
  useEffect(() => {
    if (user && user.onboardingCompleted === false) {
      openWelcomeTour();
    }
  }, [user, openWelcomeTour]);

  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden">
      <DashboardNavbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
          <div className="p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {uploadModalOpen && <UploadModal />}
      {createFolderModalOpen && <CreateFolderModal />}
      {renameModalItem && <RenameModal />}
      {deleteModalItem && <DeleteModal />}
      {shareModalFileId && <ShareModal />}
      {moveModalFileId && <MoveModal />}
      {previewFileId && <FilePreviewModal fileId={previewFileId} onClose={closePreview} />}
      <WelcomeTourModal
        isOpen={welcomeTourOpen}
        onClose={closeWelcomeTour}
        onComplete={closeWelcomeTour}
      />
      <StorageLimitModal
        isOpen={storageLimitModalOpen}
        onClose={closeStorageLimitModal}
        storageUsed={user?.storageUsed}
        storageLimit={user?.storageLimit}
        trashSize={storageTrashSize}
      />
      <ToastList />
    </div>
  );
}
