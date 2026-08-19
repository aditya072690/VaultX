'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { IconBadge } from '@/components/common/IconBadge';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('VaultX Global Error:', error);
  }, [error]);

  return (
    <div
      className="fixed inset-0 min-h-screen bg-white flex flex-col items-center justify-center p-4 selection:bg-red-100 selection:text-[#DC2626] z-50 overflow-y-auto"
      style={{
        backgroundImage: 'radial-gradient(circle, #f0f0f0 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="flex flex-col items-center justify-center w-full my-auto">
        <main className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-6 sm:p-8 max-w-[420px] w-full animate-scale-in text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <IconBadge icon="error" size="lg" variant="danger" className="shadow-sm" />
          </div>

          {/* Heading */}
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight"
            style={{ fontFamily: 'Hanken Grotesk' }}
          >
            Something Went Wrong
          </h1>

          {/* Error Description */}
          <p className="text-gray-600 text-sm leading-relaxed mt-3">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button onClick={reset} variant="primary" fullWidth icon="refresh">
              Try Again
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button variant="secondary" fullWidth icon="home">
                Go Home
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <code className="text-xs text-gray-400">
              {error.digest ? `Digest: ${error.digest}` : 'Status: 500'}
            </code>
          </div>
        </main>
      </div>
    </div>
  );
}
