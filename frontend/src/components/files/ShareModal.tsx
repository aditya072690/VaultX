'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { fileService } from '@/services/fileService';
import { PublicLink, SearchUserResult, FileSharesResponse } from '@/types';
import { getInitials, formatDate, getFileIcon, getFileColor } from '@/utils/helpers';

export default function ShareModal() {
  const { shareModalFileId, closeShareModal, addToast } = useUIStore();
  const { files, loadFiles, currentFolder } = useFileStore();
  const file = files.find((f) => f.id === shareModalFileId);

  const [activeTab, setActiveTab] = useState<'people' | 'link'>('people');
  const [loading, setLoading] = useState(false);
  const [sharesData, setSharesData] = useState<FileSharesResponse>({ publicLinks: [], userShares: [] });

  // Direct Sharing Form State
  const [emailInput, setEmailInput] = useState('');
  const [permission, setPermission] = useState<'view' | 'download' | 'upload'>('download');
  const [userExpiresAt, setUserExpiresAt] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<SearchUserResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sharingUser, setSharingUser] = useState(false);

  // Public Link Form State
  const [password, setPassword] = useState('');
  const [linkExpiresAt, setLinkExpiresAt] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

  // Load existing shares
  const fetchShares = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await fileService.getFileShares(file.id);
      setSharesData(data);
      if (data.publicLinks.length > 0) {
        setShareUrl(`${window.location.origin}/public/${data.publicLinks[0].token}`);
      } else {
        setShareUrl('');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (file) {
      fetchShares();
    }
  }, [file]);

  // Autocomplete search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (emailInput.trim().length >= 2) {
        try {
          const results = await fileService.searchUsers(emailInput);
          setUserSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          setUserSuggestions([]);
        }
      } else {
        setUserSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [emailInput]);

  if (!shareModalFileId || !file) return null;

  const handleShareWithUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      addToast({ type: 'warning', message: 'Please enter a user email or name' });
      return;
    }
    setSharingUser(true);
    try {
      await fileService.shareWithUser(file.id, {
        recipientEmail: emailInput.trim(),
        permission,
        expiresAt: userExpiresAt || undefined,
      });
      addToast({ type: 'success', message: `File shared with ${emailInput.trim()}` });
      setEmailInput('');
      setUserExpiresAt('');
      setShowSuggestions(false);
      fetchShares();
      loadFiles(currentFolder);
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to share file' });
    } finally {
      setSharingUser(false);
    }
  };

  const handleRevokeUserShare = async (shareId: string, recipientName: string) => {
    try {
      await fileService.deleteShare(shareId);
      addToast({ type: 'success', message: `Revoked access for ${recipientName}` });
      fetchShares();
      loadFiles(currentFolder);
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to revoke access' });
    }
  };

  const handleCreatePublicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLink(true);
    try {
      const data = await fileService.createPublicLink(file.id, {
        password: password || undefined,
        expiresAt: linkExpiresAt || undefined,
      });
      setShareUrl(`${window.location.origin}/public/${data.token}`);
      addToast({ type: 'success', message: 'Public link created successfully' });
      fetchShares();
      loadFiles(currentFolder);
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create link' });
    } finally {
      setCreatingLink(false);
    }
  };

  const handleRevokePublicLink = async (token: string) => {
    setLoading(true);
    try {
      await fileService.revokePublicLink(token);
      addToast({ type: 'success', message: 'Public link revoked' });
      setShareUrl('');
      setPassword('');
      setLinkExpiresAt('');
      fetchShares();
      loadFiles(currentFolder);
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to revoke link' });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    addToast({ type: 'info', message: 'Link copied to clipboard' });
  };

  const handleClose = () => {
    setEmailInput('');
    setPassword('');
    setLinkExpiresAt('');
    setUserExpiresAt('');
    closeShareModal();
  };

  const existingPublicLink = sharesData.publicLinks.length > 0 ? sharesData.publicLinks[0] : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E2E8F0] animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`material-symbols-outlined text-2xl ${getFileColor(file.mimeType)}`}>
              {getFileIcon(file.mimeType)}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#0F172A] truncate" style={{ fontFamily: 'Hanken Grotesk' }}>
                Share &ldquo;{file.name}&rdquo;
              </h2>
              <p className="text-xs text-[#64748B]">Manage recipient permissions and public links</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E2E8F0] bg-white px-6 pt-2">
          <button
            onClick={() => setActiveTab('people')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'people'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Invite People
            {sharesData.userShares.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded-full text-[10px]">
                {sharesData.userShares.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'link'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-base">link</span>
            Public Link
            {existingPublicLink && (
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'people' ? (
            <div>
              {/* Add User Form */}
              <form onSubmit={handleShareWithUser} className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    User Email or Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94A3B8] text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter user email or search by name..."
                      className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:bg-white focus:border-[#2563EB] transition-all"
                    />
                  </div>

                  {/* Autocomplete dropdown */}
                  {showSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1 animate-slide-down">
                      {userSuggestions.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setEmailInput(u.email);
                            setShowSuggestions(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#F1F5F9] flex items-center gap-2.5 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#2563EB] text-xs font-bold flex items-center justify-center">
                            {getInitials(u.name.split(' ')[0] || '', u.name.split(' ')[1] || '')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-[#0F172A] truncate">{u.name}</div>
                            <div className="text-[11px] text-[#64748B] truncate">{u.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Permission Level
                    </label>
                    <select
                      value={permission}
                      onChange={(e) => setPermission(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:bg-white focus:border-[#2563EB] transition-all"
                    >
                      <option value="view">👁️ View Only (No Download)</option>
                      <option value="download">⬇️ Can Download</option>
                      <option value="upload">⬆️ Can Upload & Edit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Expiration (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={userExpiresAt}
                      onChange={(e) => setUserExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:bg-white focus:border-[#2563EB] transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sharingUser || !emailInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {sharingUser ? 'Inviting...' : 'Share File'}
                  </button>
                </div>
              </form>

              {/* People with Access List */}
              <div className="pt-5 border-t border-[#E2E8F0]">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">
                  People with Access ({sharesData.userShares.length})
                </div>

                {sharesData.userShares.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#94A3B8] bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
                    No specific users have been invited to this file yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sharesData.userShares.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {s.sharedWith?.avatar ? (
                            <img
                              src={s.sharedWith.avatar}
                              alt={s.sharedWith.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white text-xs font-bold flex items-center justify-center">
                              {s.sharedWith ? getInitials(s.sharedWith.name.split(' ')[0] || '', s.sharedWith.name.split(' ')[1] || '') : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#0F172A] truncate">
                              {s.sharedWith?.name}
                            </div>
                            <div className="text-[10px] text-[#64748B] truncate">
                              {s.sharedWith?.email} • {s.permission.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.permission === 'view'
                                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                                : s.permission === 'download'
                                ? 'bg-[#DCFCE7] text-[#16A34A]'
                                : 'bg-[#F5F3FF] text-[#8B5CF6]'
                            }`}
                          >
                            {s.permission === 'view' ? 'View' : s.permission === 'download' ? 'Download' : 'Upload'}
                          </span>

                          <button
                            onClick={() => handleRevokeUserShare(s.id, s.sharedWith?.name || 'User')}
                            className="p-1 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                            title="Revoke access"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Public Link Tab */}
              {existingPublicLink || shareUrl ? (
                <div className="space-y-4">
                  <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534] flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Public link is active and accessible.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Share Link URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A]"
                      />
                      <button
                        onClick={copyLink}
                        className="px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-base">content_copy</span>
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-xs text-[#64748B]">
                    <span>Access count: {existingPublicLink?.accessCount || 0}</span>
                    {existingPublicLink?.hasPassword && (
                      <span className="text-amber-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">key</span> Password Protected
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0] flex justify-between gap-3">
                    <button
                      onClick={() => handleRevokePublicLink(existingPublicLink!.token)}
                      disabled={loading}
                      className="px-4 py-2 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold rounded-xl transition-all"
                    >
                      {loading ? 'Revoking...' : '🔒 Revoke Public Link'}
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-xl transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreatePublicLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Password Protection (Optional)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Require a password to download"
                      className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:bg-white focus:border-[#2563EB] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={linkExpiresAt}
                      onChange={(e) => setLinkExpiresAt(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:bg-white focus:border-[#2563EB] transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingLink}
                      className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                      {creatingLink ? 'Creating...' : 'Generate Public Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
