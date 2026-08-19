'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analytics } from '@/utils/analytics';

export default function Forbidden403Page() {
  const router = useRouter();

  useEffect(() => {
    analytics.trackSecurity('403_forbidden');
  }, []);

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Centered Error Card */}
      <main className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-8 text-center flex flex-col items-center relative z-10 animate-scale-in">
        {/* Red Lock Icon Badge with Glow */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 bg-[#FEE2E2] rounded-full flex items-center justify-center border border-[#DC2626]/15 shadow-sm">
            <span
              className="material-symbols-outlined text-[#DC2626] text-4xl font-bold"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#DC2626] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
            <span className="material-symbols-outlined text-white text-base font-bold">
              close
            </span>
          </div>
        </div>

        {/* 403 Error Pill */}
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F1F5F9] text-[#64748B] text-xs font-semibold uppercase tracking-wider mb-2.5">
          Error 403 • Forbidden
        </span>

        {/* Heading */}
        <h1
          className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-2"
          style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
        >
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-sm text-[#64748B] leading-relaxed mb-6">
          You do not have permission to access this resource or private vault. Please verify your credentials or request access from the file owner.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <Link href="/dashboard" className="block w-full">
            <button
              type="button"
              className="w-full py-3 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-lg">
                dashboard
              </span>
              Return to Dashboard
            </button>
          </Link>

          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2.5 px-4 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">
                arrow_back
              </span>
              Go Back
            </button>

            <Link href="/login" className="flex-1 block">
              <button
                type="button"
                className="w-full py-2.5 px-4 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">
                  switch_account
                </span>
                Switch User
              </button>
            </Link>
          </div>
        </div>

        {/* Support Footer Link */}
        <div className="mt-6 pt-4 border-t border-[#E2E8F0] w-full text-center">
          <p className="text-xs text-[#64748B]">
            Believe this is an error?{' '}
            <a
              href="mailto:support@vaultx.com?subject=403%20Access%20Denied%20Inquiry"
              className="text-[#2563EB] hover:underline font-semibold"
            >
              Contact Support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
