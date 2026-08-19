'use client';

import { useEffect, useState } from 'react';
import { userService } from '@/services/userService';
import { ActivityLogEntry } from '@/types';
import { formatDate } from '@/utils/helpers';

const actionIcons: Record<string, { icon: string; color: string; bg: string }> = {
  upload: { icon: 'upload', color: 'text-[#2563EB]', bg: 'bg-[#EEF2FF]' },
  delete: { icon: 'delete', color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]' },
  rename: { icon: 'edit', color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]' },
  share: { icon: 'share', color: 'text-[#16A34A]', bg: 'bg-[#DCFCE7]' },
  create: { icon: 'create_new_folder', color: 'text-[#4F46E5]', bg: 'bg-[#EEF2FF]' },
  register: { icon: 'person_add', color: 'text-[#0EA5E9]', bg: 'bg-[#E0F2FE]' },
  default: { icon: 'history', color: 'text-[#64748B]', bg: 'bg-[#F8FAFC]' },
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadActivity = async (p: number) => {
    setLoading(true);
    try {
      const result = await userService.getActivityLog(p);
      if (p === 1) {
        setActivities(result.activities);
      } else {
        setActivities((prev) => [...prev, ...result.activities]);
      }
      setHasMore(p < result.meta.totalPages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadActivity(1); }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadActivity(next);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>Activity Log</h1>
      <p className="text-sm text-[#64748B] mb-6">Track all actions on your account</p>

      {loading && activities.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => {
            const config = actionIcons[activity.action] || actionIcons.default;
            let details;
            try { details = activity.details ? JSON.parse(activity.details) : null; } catch { details = null; }

            return (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-white border border-[#E2E8F0] rounded-xl hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                  <span className={`material-symbols-outlined text-xl ${config.color}`}>{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] capitalize">
                    {activity.action} {activity.resourceType}
                  </p>
                  {details?.fileName && (
                    <p className="text-sm text-[#64748B] mt-0.5 truncate">{details.fileName}</p>
                  )}
                  {details?.oldName && details?.newName && (
                    <p className="text-sm text-[#64748B] mt-0.5">
                      <span className="line-through">{details.oldName}</span> → {details.newName}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[#94A3B8] shrink-0">{formatDate(activity.createdAt)}</span>
              </div>
            );
          })}

          {hasMore && (
            <button onClick={loadMore} disabled={loading}
              className="w-full py-3 text-sm font-medium text-[#2563EB] hover:bg-[#EEF2FF] rounded-xl border border-[#E2E8F0] transition-all disabled:opacity-50">
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-6xl text-[#E2E8F0] mb-4">history</span>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No activity yet</h3>
          <p className="text-sm text-[#64748B]">Your actions will be logged here</p>
        </div>
      )}
    </div>
  );
}
