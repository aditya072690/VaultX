'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { VideoModal } from './VideoModal';

export interface HeroSectionProps {
  onDemoClick?: () => void;
  videoUrl?: string;
}

export function HeroSection({
  onDemoClick,
  videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
}: HeroSectionProps) {
  const { isAuthenticated } = useAuthStore();
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleOpenDemo = () => {
    if (onDemoClick) {
      onDemoClick();
    } else {
      setVideoModalOpen(true);
    }
  };

  return (
    <>
      <section
        ref={sectionRef}
        className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto text-center overflow-hidden"
      >
        {/* Decorative Background Blurred Shapes */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />

        <div className="max-w-5xl mx-auto">
          {/* Security Pill Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-[#2563EB] rounded-full text-xs font-semibold mb-6 shadow-xs transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Next-Generation Zero-Knowledge Cloud Storage</span>
          </div>

          {/* Headline */}
          <div
            className={`transition-all duration-1000 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0F172A] leading-tight max-w-4xl mx-auto"
              style={{ fontFamily: 'Hanken Grotesk' }}
            >
              Your files, secured by{' '}
              <span className="bg-gradient-to-r from-[#2563EB] to-[#4F46E5] bg-clip-text text-transparent">
                Slate-grade encryption
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <p className="mt-6 text-base sm:text-xl text-[#64748B] max-w-3xl mx-auto leading-relaxed">
              Experience zero-knowledge security without sacrificing seamless access. VaultX ensures
              your data remains undisputably yours, organized exactly how you need it.
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className={`mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {isAuthenticated ? (
              <Link href="/dashboard" className="w-full sm:w-auto flex-1">
                <button className="w-full py-3.5 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">space_dashboard</span>
                  <span>Open Dashboard</span>
                </button>
              </Link>
            ) : (
              <Link href="/register" className="w-full sm:w-auto flex-1">
                <button className="w-full py-3.5 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                  <span>Get Started for Free</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </Link>
            )}

            <button
              onClick={handleOpenDemo}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xs group cursor-pointer hover:shadow-md"
            >
              <span className="material-symbols-outlined text-[#2563EB] group-hover:scale-110 transition-transform">
                play_circle
              </span>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Dashboard Preview Section */}
          <div
            id="product"
            className={`relative max-w-5xl mx-auto mt-16 rounded-2xl shadow-2xl overflow-hidden border border-[#E2E8F0] bg-white transform hover:-translate-y-1 transition-all duration-500 z-10 text-left ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{ transitionDuration: '1200ms', transitionDelay: '400ms' }}
          >
            {/* Top Chrome Window Header */}
            <div className="bg-[#F8FAFC] px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-[#94A3B8] font-mono ml-2 hidden sm:inline">
                  https://vaultx.app/dashboard
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>AES-256 Active</span>
              </div>
            </div>

            {/* Dashboard Visual or Interactive Mockup */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-50 overflow-hidden">
              {!imageError ? (
                <Image
                  src="/screen.png"
                  alt="VaultX Dashboard Preview"
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover object-top"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                /* Rich Interactive Mockup Fallback */
                <div className="p-6 h-full flex flex-col justify-between bg-gradient-to-b from-white to-slate-50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-lg">folder</span>
                      </div>
                      <p className="text-sm font-semibold text-[#0F172A]">All Files</p>
                      <p className="text-xs text-[#64748B]">Cloud storage & folders</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-lg">enhanced_encryption</span>
                      </div>
                      <p className="text-sm font-semibold text-[#0F172A]">Private Vault</p>
                      <p className="text-xs text-[#64748B]">6-digit PIN protected</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-lg">share</span>
                      </div>
                      <p className="text-sm font-semibold text-[#0F172A]">Shared with Me</p>
                      <p className="text-xs text-[#64748B]">Recipient permissions</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-2xl text-[#2563EB]">
                        description
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A]">
                          Confidential_Financial_Audit_2026.pdf
                        </p>
                        <p className="text-[10px] text-[#94A3B8]">24.8 MB • Encrypted</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      Verified
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal Component */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={videoUrl}
      />
    </>
  );
}

export default HeroSection;
