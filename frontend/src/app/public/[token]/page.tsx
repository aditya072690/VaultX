'use client';

import { useEffect, useState, use } from 'react';
import { formatFileSize, getFileIcon, getFileColor } from '@/utils/helpers';

interface PublicFileData {
  requiresPassword: boolean;
  file: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    owner: { firstName: string; lastName: string };
  } | null;
}

export default function PublicDownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<PublicFileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);

  const loadFile = async (pwd?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = pwd ? `?password=${encodeURIComponent(pwd)}` : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/${token}${params}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to load file');
        return;
      }

      setData(json.data);
    } catch {
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFile(); }, [token]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFile(password);
  };

  const handleDownload = async () => {
    if (!data?.file) return;
    setDownloading(true);
    try {
      const params = password ? `?password=${encodeURIComponent(password)}` : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/${token}/download${params}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = data.file.name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2563EB] rounded-xl mb-4">
            <span className="material-symbols-outlined text-white text-3xl">shield_lock</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Hanken Grotesk' }}>VaultX</h1>
          <p className="text-sm text-[#64748B] mt-1">Secure file sharing</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-[#DC2626] mb-3 block">error</span>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Access Denied</h3>
              <p className="text-sm text-[#64748B]">{error}</p>
            </div>
          ) : data?.requiresPassword ? (
            <div>
              <div className="text-center mb-6">
                <span className="material-symbols-outlined text-4xl text-[#D97706] mb-3 block">lock</span>
                <h3 className="text-lg font-semibold text-[#0F172A]">Password Protected</h3>
                <p className="text-sm text-[#64748B] mt-1">Enter the password to access this file</p>
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password" autoFocus
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all mb-4" />
                <button type="submit"
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2.5 rounded-lg transition-all">
                  Unlock File
                </button>
              </form>
            </div>
          ) : data?.file ? (
            <div className="text-center">
              <span className={`material-symbols-outlined text-5xl ${getFileColor(data.file.mimeType)} mb-4 block`}>
                {getFileIcon(data.file.mimeType)}
              </span>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-1">{data.file.name}</h3>
              <p className="text-sm text-[#64748B] mb-1">{formatFileSize(data.file.size)}</p>
              <p className="text-xs text-[#94A3B8] mb-6">
                Shared by {data.file.owner.firstName} {data.file.owner.lastName}
              </p>
              <button onClick={handleDownload} disabled={downloading}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50">
                {downloading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Downloading...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">download</span>Download File</>
                )}
              </button>
            </div>
          ) : null}
        </div>

        <p className="text-center mt-6 text-xs text-[#94A3B8]">
          Powered by VaultX • Secure File Storage
        </p>
      </div>
    </div>
  );
}
