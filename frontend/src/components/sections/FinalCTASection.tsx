'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export interface FinalCTAProps {
  onImpressionTrack?: () => void;
  onCTAClick?: (action: string) => void;
  headline?: string;
  subheadline?: string;
  onScheduleDemoClick?: () => void;
}

export function FinalCTASection({
  onImpressionTrack,
  onCTAClick,
  headline = 'Ready to secure your digital life?',
  subheadline = 'Join 50k+ professionals and teams who trust VaultX for zero-knowledge, privacy-first cloud storage.',
  onScheduleDemoClick,
}: FinalCTAProps) {
  const { isAuthenticated } = useAuthStore();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedImpression) {
          setHasTrackedImpression(true);
          if (onImpressionTrack) {
            onImpressionTrack();
          }
          if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({ event: 'final_cta_impression' });
          }
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [onImpressionTrack, hasTrackedImpression]);

  const handleCTAClick = (action: string) => {
    if (onCTAClick) {
      onCTAClick(action);
    }
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'final_cta_click',
        cta_type: action,
      });
    }
  };

  const handleDemoAction = () => {
    handleCTAClick('schedule-demo');
    if (onScheduleDemoClick) {
      onScheduleDemoClick();
    } else {
      setDemoModalOpen(true);
    }
  };

  return (
    <>
      <section
        ref={sectionRef}
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto"
        aria-label="Call to Action"
      >
        <div className="bg-gradient-to-tr from-[#1E40AF] via-[#2563EB] to-[#4F46E5] rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-blue-500/20 border border-blue-400/30">
          {/* Ambient Glowing Orbs */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-700" />

          {/* Inner Content */}
          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/15 border border-white/25 rounded-full text-white text-xs font-semibold mb-6 backdrop-blur-md">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              <span>Get 10 GB Free Forever • Zero-Knowledge Encryption</span>
            </div>

            {/* Headline */}
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 leading-tight"
              style={{ fontFamily: 'Hanken Grotesk' }}
            >
              {headline}
            </h2>

            {/* Subheadline */}
            <p className="text-sm sm:text-lg text-blue-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
              {subheadline}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-10">
              {isAuthenticated ? (
                <Link href="/dashboard" className="w-full sm:w-auto flex-1">
                  <button
                    onClick={() => handleCTAClick('open-dashboard')}
                    className="w-full py-4 px-7 bg-white text-[#2563EB] hover:bg-slate-50 font-bold text-base rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">space_dashboard</span>
                    <span>Go to Dashboard</span>
                  </button>
                </Link>
              ) : (
                <Link href="/register" className="w-full sm:w-auto flex-1">
                  <button
                    onClick={() => handleCTAClick('get-started-free')}
                    className="w-full py-4 px-7 bg-white text-[#2563EB] hover:bg-slate-50 font-bold text-base rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span>Get Started for Free</span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </Link>
              )}

              <button
                onClick={handleDemoAction}
                className="w-full sm:w-auto flex-1 py-4 px-7 bg-white/15 hover:bg-white/25 text-white font-semibold text-base rounded-xl transition-all duration-300 border border-white/30 backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                <span>Schedule Demo</span>
              </button>
            </div>

            {/* Social Proof Bar */}
            <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-white/90">
              {/* Avatar Stack */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-300 text-[#1E40AF] font-bold text-[10px] ring-2 ring-white">
                    JD
                  </div>
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-300 text-[#4338CA] font-bold text-[10px] ring-2 ring-white">
                    SL
                  </div>
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-300 text-[#065F46] font-bold text-[10px] ring-2 ring-white">
                    MK
                  </div>
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-300 text-[#92400E] font-bold text-[10px] ring-2 ring-white">
                    AR
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-300 text-xs">
                    {'★'.repeat(5)}
                  </div>
                  <span className="font-semibold ml-1">4.9/5</span>
                </div>
              </div>

              <span className="hidden sm:inline text-white/40">•</span>
              <span>Trusted by 50,000+ professionals worldwide</span>
              <span className="hidden sm:inline text-white/40">•</span>
              <span className="inline-flex items-center gap-1 text-blue-200">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>No credit card required</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Contact Dialog Modal */}
      {demoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Schedule a VaultX Demo"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] p-6 sm:p-8 max-w-md w-full animate-scale-in text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">calendar_today</span>
              </div>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <h3
              className="text-xl font-bold text-[#0F172A] mb-2"
              style={{ fontFamily: 'Hanken Grotesk' }}
            >
              Schedule an Enterprise Demo
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mb-6">
              Our security specialists will walk you through our zero-knowledge infrastructure, custom
              vault policies, and team permissions.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thank you! A demo specialist will reach out to you within 24 hours.');
                setDemoModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Company Name & Team Size
                </label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corp (10-50 users)"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Request Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default FinalCTASection;
