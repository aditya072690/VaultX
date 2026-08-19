'use client';

import { useUIStore, Toast } from '@/store/uiStore';

export default function ToastList() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = {
    success: { bg: 'bg-[#DCFCE7] border-green-200', text: 'text-[#16A34A]', icon: 'check_circle' },
    error: { bg: 'bg-[#FEE2E2] border-red-200', text: 'text-[#DC2626]', icon: 'error' },
    warning: { bg: 'bg-[#FEF3C7] border-yellow-200', text: 'text-[#D97706]', icon: 'warning' },
    info: { bg: 'bg-[#E0F2FE] border-sky-200', text: 'text-[#0EA5E9]', icon: 'info' },
  }[toast.type];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${config.bg} animate-slide-up`}>
      <span className={`material-symbols-outlined ${config.text}`}>{config.icon}</span>
      <p className="text-sm font-medium text-[#0F172A] flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B]">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
