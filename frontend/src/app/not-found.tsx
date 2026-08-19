'use client';

import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { IconBadge } from '@/components/common/IconBadge';
import { Badge } from '@/components/common/Badge';

export default function NotFound() {
  return (
    <div
      className="fixed inset-0 min-h-screen bg-white flex flex-col items-center justify-center p-4 selection:bg-blue-100 selection:text-[#2563EB] z-50 overflow-y-auto"
      style={{
        backgroundImage: 'radial-gradient(circle, #f0f0f0 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="flex flex-col items-center justify-center w-full my-auto">
        <main className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-6 sm:p-8 max-w-[420px] w-full animate-scale-in">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <IconBadge
              icon="folder_off"
              size="lg"
              className="text-[#94A3B8] shadow-sm animate-float"
            />
          </div>

          {/* Heading */}
          <h1
            className="text-3xl font-bold text-gray-900 text-center tracking-tight"
            style={{ fontFamily: 'Hanken Grotesk' }}
          >
            Page Not Found
          </h1>
          <div className="flex justify-center mt-2">
            <Badge variant="surface-high">Error 404</Badge>
          </div>

          {/* Description */}
          <p className="text-center text-gray-600 text-sm leading-relaxed mt-4">
            The file or page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Primary CTA */}
          <div className="mt-8">
            <Link href="/dashboard" className="block">
              <Button variant="primary" fullWidth icon="arrow_back">
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Secondary CTAs */}
          <div className="flex gap-3 mt-3">
            <Link href="/dashboard" className="flex-1">
              <Button variant="secondary" fullWidth icon="search">
                Search Files
              </Button>
            </Link>
            <a
              href="mailto:support@vaultx.com?subject=VaultX%20Support%20Request"
              className="flex-1"
            >
              <Button variant="ghost" fullWidth icon="support_agent">
                Support
              </Button>
            </a>
          </div>

          {/* Fallback Button */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full text-sm text-gray-500 mt-4 hover:text-gray-700 transition-colors py-1 cursor-pointer flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-base">undo</span>
            <span>Or go back</span>
          </button>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <code className="text-xs text-gray-400">Error Code: 404</code>
          </div>
        </main>
      </div>
    </div>
  );
}
