'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { userService } from '@/services/userService';
import { formatFileSize } from '@/utils/helpers';
import { User, StorageAnalytics } from '@/types';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'vault' | 'storage'>('profile');
  const [profile, setProfile] = useState({ firstName: '', lastName: '', timezone: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [vaultForm, setVaultForm] = useState({
    currentAuth: '',
    newPin: '',
    confirmPin: '',
    newPassword: '',
    autoLockTimeout: 1800,
    lockOnAppClose: true,
    lockOnInactivity: true,
  });
  const [vaultSettings, setVaultSettings] = useState<{
    hasPinSet: boolean;
    hasPasswordSet: boolean;
    autoLockTimeout: number;
    lockOnAppClose: boolean;
    lockOnInactivity: boolean;
  } | null>(null);
  const [analytics, setAnalytics] = useState<StorageAnalytics | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName, lastName: user.lastName, timezone: user.timezone || 'UTC' });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'storage') {
      userService.getStorageAnalytics().then(setAnalytics).catch(() => {});
    } else if (activeTab === 'vault') {
      import('@/services/vaultService').then(({ vaultService }) => {
        vaultService.getSettings().then((s) => {
          setVaultSettings(s);
          setVaultForm((prev) => ({
            ...prev,
            autoLockTimeout: s.autoLockTimeout,
            lockOnAppClose: s.lockOnAppClose,
            lockOnInactivity: s.lockOnInactivity,
          }));
        }).catch(() => {});
      });
    }
  }, [activeTab]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile(profile);
      setUser(updated as User);
      addToast({ type: 'success', message: 'Profile updated successfully' });
    } catch {
      addToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      addToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (passwords.new.length < 8) {
      addToast({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }
    setSaving(true);
    try {
      await userService.changePassword({ currentPassword: passwords.current, newPassword: passwords.new });
      addToast({ type: 'success', message: 'Password changed successfully' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handleVaultSave = async () => {
    if (vaultForm.newPin) {
      if (!/^\d{6}$/.test(vaultForm.newPin)) {
        addToast({ type: 'error', message: 'Vault PIN must be exactly 6 digits' });
        return;
      }
      if (vaultForm.newPin !== vaultForm.confirmPin) {
        addToast({ type: 'error', message: 'New PIN and Confirm PIN do not match' });
        return;
      }
    }

    if (vaultForm.newPassword && vaultForm.newPassword.length < 8) {
      addToast({ type: 'error', message: 'Backup password must be at least 8 characters' });
      return;
    }

    if (vaultSettings?.hasPinSet && (vaultForm.newPin || vaultForm.newPassword) && !vaultForm.currentAuth) {
      addToast({ type: 'error', message: 'Current PIN or password is required to change credentials' });
      return;
    }

    setSaving(true);
    try {
      const { vaultService } = await import('@/services/vaultService');
      const res = await vaultService.updateSettings({
        currentPinOrPassword: vaultForm.currentAuth || undefined,
        vaultPin: vaultForm.newPin || undefined,
        vaultPassword: vaultForm.newPassword || undefined,
        autoLockTimeout: vaultForm.autoLockTimeout,
        lockOnAppClose: vaultForm.lockOnAppClose,
        lockOnInactivity: vaultForm.lockOnInactivity,
      });

      setVaultSettings({
        hasPinSet: res.hasPinSet,
        hasPasswordSet: res.hasPasswordSet,
        autoLockTimeout: res.autoLockTimeout,
        lockOnAppClose: res.lockOnAppClose,
        lockOnInactivity: res.lockOnInactivity,
      });

      setVaultForm((prev) => ({
        ...prev,
        currentAuth: '',
        newPin: '',
        confirmPin: '',
        newPassword: '',
      }));

      addToast({ type: 'success', message: 'Vault security settings updated successfully' });
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to update vault settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: 'person' },
    { id: 'security' as const, label: 'Security', icon: 'shield' },
    { id: 'vault' as const, label: 'Private Vault', icon: 'enhanced_encryption' },
    { id: 'storage' as const, label: 'Storage', icon: 'cloud' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6" style={{ fontFamily: 'Hanken Grotesk' }}>Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-1 mb-8 w-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.id ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}>
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 max-w-2xl animate-fade-in">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>Profile Information</h2>
          <p className="text-sm text-[#64748B] mb-6">Update your personal details</p>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </div>
            <div>
              <button className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]">Change Avatar</button>
              <p className="text-xs text-[#94A3B8] mt-0.5">JPG, PNG or GIF. Max 2MB</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">First name</label>
                <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Last name</label>
                <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#94A3B8] bg-[#F8FAFC] cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Timezone</label>
              <select value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={handleProfileSave} disabled={saving}
              className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>Change Password</h2>
            <p className="text-sm text-[#64748B] mb-6">Update your password to keep your account secure</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Current Password</label>
                <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">New Password</label>
                <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Confirm New Password</label>
                <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${
                    passwords.confirm && passwords.confirm !== passwords.new ? 'border-red-300' : 'border-[#E2E8F0]'
                  }`} />
                {passwords.confirm && passwords.confirm !== passwords.new && (
                  <p className="mt-1 text-xs text-[#DC2626]">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={handlePasswordChange} disabled={saving || !passwords.current || !passwords.new}
                className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* 2FA Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Two-Factor Authentication</h3>
                <p className="text-sm text-[#64748B] mt-1">Add an extra layer of security to your account</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user?.twoFactorEnabled ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'
              }`}>
                {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <button className="mt-4 px-4 py-2 border border-[#E2E8F0] text-sm font-medium text-[#0F172A] rounded-lg hover:bg-[#F8FAFC] transition-colors">
              {user?.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
            </button>
          </div>

          {/* Active Sessions */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Active Sessions</h3>
            <p className="text-sm text-[#64748B] mb-4">Manage your active login sessions</p>
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="material-symbols-outlined text-2xl text-[#2563EB]">computer</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0F172A]">Current Session</p>
                <p className="text-xs text-[#64748B]">This device • Active now</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 bg-[#DCFCE7] text-[#16A34A] text-xs font-medium rounded-full">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Private Vault Tab */}
      {activeTab === 'vault' && (
        <div className="space-y-6 max-w-2xl animate-fade-in">
          {/* Vault Security Status Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-[#4F46E5] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">enhanced_encryption</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: 'Hanken Grotesk' }}>
                    Private Vault Security
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Manage your 6-digit Vault PIN, backup password, and auto-lock preferences.
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                  vaultSettings?.hasPinSet
                    ? 'bg-[#DCFCE7] text-[#16A34A]'
                    : 'bg-[#FEF3C7] text-[#D97706]'
                }`}
              >
                <span className="material-symbols-outlined text-xs">
                  {vaultSettings?.hasPinSet ? 'check_circle' : 'warning'}
                </span>
                {vaultSettings?.hasPinSet ? 'PIN Active' : 'Setup Required'}
              </span>
            </div>

            {/* Change Credentials Form */}
            <div className="space-y-4 pt-2">
              {vaultSettings?.hasPinSet && (
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Current Vault PIN or Password
                  </label>
                  <input
                    type="password"
                    value={vaultForm.currentAuth}
                    onChange={(e) => setVaultForm({ ...vaultForm, currentAuth: e.target.value })}
                    placeholder="Enter current PIN or password to authorize changes"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    New 6-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    value={vaultForm.newPin}
                    onChange={(e) => setVaultForm({ ...vaultForm, newPin: e.target.value })}
                    placeholder="6 digits (e.g. 123456)"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    value={vaultForm.confirmPin}
                    onChange={(e) => setVaultForm({ ...vaultForm, confirmPin: e.target.value })}
                    placeholder="Re-enter 6 digits"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${
                      vaultForm.confirmPin && vaultForm.confirmPin !== vaultForm.newPin
                        ? 'border-red-300'
                        : 'border-[#E2E8F0]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Backup Password (Optional)
                </label>
                <input
                  type="password"
                  value={vaultForm.newPassword}
                  onChange={(e) => setVaultForm({ ...vaultForm, newPassword: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Auto-Lock Timeout
                </label>
                <select
                  value={vaultForm.autoLockTimeout}
                  onChange={(e) =>
                    setVaultForm({ ...vaultForm, autoLockTimeout: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all bg-white"
                >
                  <option value={900}>15 Minutes</option>
                  <option value={1800}>30 Minutes (Recommended)</option>
                  <option value={3600}>1 Hour</option>
                  <option value={14400}>4 Hours</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vaultForm.lockOnAppClose}
                    onChange={(e) =>
                      setVaultForm({ ...vaultForm, lockOnAppClose: e.target.checked })
                    }
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0] focus:ring-[#2563EB]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">Lock on browser / tab close</p>
                    <p className="text-xs text-[#64748B]">Automatically locks the vault whenever you close the window</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vaultForm.lockOnInactivity}
                    onChange={(e) =>
                      setVaultForm({ ...vaultForm, lockOnInactivity: e.target.checked })
                    }
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0] focus:ring-[#2563EB]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">Lock on inactivity</p>
                    <p className="text-xs text-[#64748B]">Auto-locks vault when the configured timeout expires</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleVaultSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {saving ? 'Saving Settings...' : 'Save Vault Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Tab */}
      {activeTab === 'storage' && (
        <div className="max-w-2xl animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4" style={{ fontFamily: 'Hanken Grotesk' }}>Storage Usage</h2>

            {analytics ? (
              <>
                {/* Storage Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#0F172A]">
                      {formatFileSize(analytics.storageUsed)} of {formatFileSize(analytics.storageLimit)} used
                    </span>
                    <span className="text-sm font-semibold text-[#2563EB]">{analytics.storagePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      analytics.storagePercentage > 90 ? 'bg-[#DC2626]' : analytics.storagePercentage > 70 ? 'bg-[#D97706]' : 'bg-[#2563EB]'
                    }`} style={{ width: `${analytics.storagePercentage}%` }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total Files', value: analytics.totalFiles, icon: 'description', color: 'text-blue-500' },
                    { label: 'Folders', value: analytics.totalFolders, icon: 'folder', color: 'text-yellow-500' },
                    { label: 'File Types', value: analytics.filesByType.length, icon: 'category', color: 'text-purple-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-center">
                      <span className={`material-symbols-outlined text-2xl ${stat.color} mb-1 block`}>{stat.icon}</span>
                      <p className="text-2xl font-bold text-[#0F172A]">{stat.value}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* File Type Breakdown */}
                {analytics.filesByType.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Storage Breakdown</h3>
                    <div className="space-y-3">
                      {analytics.filesByType.map((ft) => {
                        const pct = analytics.storageUsed > 0 ? (ft.totalSize / analytics.storageUsed) * 100 : 0;
                        return (
                          <div key={ft.mimeType} className="flex items-center gap-3">
                            <div className="w-32 text-xs text-[#64748B] truncate">{ft.mimeType.split('/')[0]}</div>
                            <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="w-20 text-xs text-[#64748B] text-right">{formatFileSize(ft.totalSize)}</div>
                            <div className="w-10 text-xs text-[#94A3B8] text-right">{ft.count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Plan Info */}
          <div className="bg-gradient-to-r from-[#2563EB] to-[#4F46E5] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Free Plan</h3>
                <p className="text-white/80 text-sm mt-1">10 GB storage included</p>
              </div>
              <button className="px-4 py-2 bg-white text-[#2563EB] text-sm font-semibold rounded-lg hover:bg-white/90 transition-all">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
