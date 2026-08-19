'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TourStep, WelcomeTourModalProps } from '@/types';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { analytics } from '@/utils/analytics';

const TOUR_STEPS: TourStep[] = [
  {
    id: 0,
    icon: 'enhanced_encryption',
    badgeText: 'Zero-Knowledge Security',
    title: 'Military-Grade Encryption',
    description:
      'End-to-end client-side encryption ensures only you hold the decryption keys. Your private vault files are protected with AES-256 and never leave your control.',
    details: [
      'Zero-knowledge architecture — we cannot read your files',
      'Client-side PIN protection for private vault isolation',
      'Encrypted transit and AES-256 resting storage',
    ],
    graphicType: 'encryption',
  },
  {
    id: 1,
    icon: 'cloud_sync',
    badgeText: 'Instant Everywhere',
    title: 'Seamless Real-Time Sync',
    description:
      'Access and update your files across all desktop, tablet, and mobile devices instantly. Real-time file status indicators keep your workspace synchronized without delays.',
    details: [
      'Instant delta sync on every device',
      'Background upload tray with automatic retry',
      'Granular link sharing with expiration and passwords',
    ],
    graphicType: 'sync',
  },
  {
    id: 2,
    icon: 'account_tree',
    badgeText: 'Effortless Productivity',
    title: 'Smart Organization & Search',
    description:
      'Locate any document, photo, or project asset in milliseconds with full-text search, faceted type filters, and intelligent visual gallery layouts.',
    details: [
      'Timeline photo grids with instant lightbox previews',
      'Faceted search by file types, sizes, and date ranges',
      'Detailed audit logs and activity tracking',
    ],
    graphicType: 'organization',
  },
];

export default function WelcomeTourModal({
  isOpen,
  onClose,
  onComplete,
}: WelcomeTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();

  const handleStepChange = useCallback((newStep: number) => {
    if (newStep === currentStep || newStep < 0 || newStep >= TOUR_STEPS.length) return;
    setIsTransitioning(true);
    analytics.trackOnboarding(newStep + 1, TOUR_STEPS[newStep].title, 'advance');
    setTimeout(() => {
      setCurrentStep(newStep);
      setIsTransitioning(false);
    }, 200);
  }, [currentStep]);

  const handleFinish = async (isSkip: boolean = false) => {
    setLoading(true);
    analytics.trackOnboarding(currentStep + 1, TOUR_STEPS[currentStep].title, isSkip ? 'skip' : 'complete');
    try {
      // 1. Immediately update local authStore & localStorage
      if (user) {
        const updated = { ...user, onboardingCompleted: true, isFirstLogin: false };
        setUser(updated);
        try {
          localStorage.setItem('vaultx_user', JSON.stringify(updated));
        } catch {}
      }

      // 2. Persist to backend
      const updatedUser = await userService.completeOnboarding(true);
      if (updatedUser) {
        setUser({ ...user, ...updatedUser, onboardingCompleted: true, isFirstLogin: false });
      }

      addToast({
        type: 'success',
        message: 'Welcome to VaultX! Your workspace is ready.',
      });
    } catch (err) {
      console.warn('Onboarding update notice:', err);
    } finally {
      setLoading(false);
      onComplete();
      onClose();
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      handleStepChange(currentStep + 1);
    } else {
      handleFinish(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Enter') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tour-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[#CBD5E1] flex flex-col md:flex-row relative max-h-[90vh]">
        {/* Close / Skip button in top corner */}
        <button
          onClick={() => handleFinish(true)}
          className="absolute top-4 right-4 z-20 text-[#94A3B8] hover:text-[#0F172A] p-2 rounded-full hover:bg-[#F1F5F9] transition-all"
          aria-label="Skip Tour"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* ================= LEFT COLUMN: HERO GRAPHIC ================= */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-[#0b1c30] via-[#122b49] to-[#004ac6] p-8 flex flex-col items-center justify-center relative overflow-hidden shrink-0 min-h-[220px] md:min-h-[480px]">
          {/* Subtle Radial Glow */}
          <div className="absolute w-72 h-72 rounded-full bg-[#2563eb]/20 blur-3xl -top-10 -left-10 pointer-events-none" />
          <div className="absolute w-60 h-60 rounded-full bg-[#645efb]/20 blur-3xl -bottom-10 -right-10 pointer-events-none" />

          {/* Dynamic SVG Visuals Based on Step */}
          <div
            className={`w-full max-w-[280px] h-[220px] md:h-[280px] relative flex items-center justify-center transition-all duration-300 ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {step.graphicType === 'encryption' && (
              <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl">
                <defs>
                  <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                  </linearGradient>
                  <linearGradient id="glowRing" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                {/* Outer Shield Orbit */}
                <circle cx="120" cy="120" r="95" fill="none" stroke="url(#glowRing)" strokeWidth="2" strokeDasharray="6 6" className="animate-spin-slow opacity-60" />
                <circle cx="120" cy="120" r="75" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" opacity="0.9" />
                {/* Vault Door Dial */}
                <circle cx="120" cy="120" r="55" fill="url(#vaultGrad)" stroke="#60a5fa" strokeWidth="3" />
                <circle cx="120" cy="120" r="42" fill="#0b1c30" stroke="#93c5fd" strokeWidth="1.5" />
                {/* Center Padlock */}
                <path
                  d="M120 95 C113 95 107 101 107 108 L107 114 L103 114 C100 114 98 116 98 119 L98 139 C98 142 100 144 103 144 L137 144 C140 144 142 142 142 139 L142 119 C142 116 140 114 137 114 L133 114 L133 108 C133 101 127 95 120 95 Z M120 102 C123.5 102 126 104.5 126 108 L126 114 L114 114 L114 108 C114 104.5 116.5 102 120 102 Z"
                  fill="#ffffff"
                />
                <circle cx="120" cy="128" r="3" fill="#0284c7" />
                {/* Floating badge */}
                <rect x="75" y="180" width="90" height="24" rx="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="120" y="196" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  AES-256 VAULT
                </text>
              </svg>
            )}

            {step.graphicType === 'sync' && (
              <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl">
                <defs>
                  <linearGradient id="syncCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                {/* Cloud Center */}
                <circle cx="120" cy="95" r="38" fill="url(#syncCloudGrad)" opacity="0.9" />
                <circle cx="95" cy="110" r="28" fill="url(#syncCloudGrad)" opacity="0.9" />
                <circle cx="145" cy="110" r="28" fill="url(#syncCloudGrad)" opacity="0.9" />
                <rect x="95" y="110" width="50" height="28" fill="url(#syncCloudGrad)" />
                {/* Sync Arrows in Cloud */}
                <path d="M110 105 A14 14 0 0 1 130 105 M130 102 L134 106 L130 110 M130 115 A14 14 0 0 1 110 115 M110 118 L106 114 L110 110" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Device Nodes */}
                {/* Laptop */}
                <rect x="35" y="165" width="40" height="26" rx="3" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
                <line x1="30" y1="191" x2="80" y2="191" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="60" y1="165" x2="105" y2="135" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Mobile */}
                <rect x="165" y="155" width="24" height="38" rx="4" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
                <circle cx="177" cy="186" r="2" fill="#a78bfa" />
                <line x1="165" y1="165" x2="135" y2="135" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Tablet */}
                <rect x="104" y="170" width="32" height="24" rx="3" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <line x1="120" y1="170" x2="120" y2="138" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            )}

            {step.graphicType === 'organization' && (
              <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl">
                <defs>
                  <linearGradient id="folderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                {/* Folder Stack */}
                <rect x="55" y="65" width="130" height="90" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <path d="M55 75 L95 75 L105 85 L185 85 L185 155 L55 155 Z" fill="#0f172a" />
                {/* Front Main Folder */}
                <rect x="65" y="95" width="110" height="75" rx="6" fill="url(#folderGrad)" stroke="#fbbf24" strokeWidth="1.5" />
                {/* Tag Pills Floating Out */}
                <g>
                  <rect x="35" y="110" width="55" height="22" rx="11" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" />
                  <text x="62" y="125" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">PDFs</text>

                  <rect x="150" y="110" width="60" height="22" rx="11" fill="#16a34a" stroke="#86efac" strokeWidth="1" />
                  <text x="180" y="125" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">Photos</text>

                  <rect x="90" y="180" width="60" height="22" rx="11" fill="#4f46e5" stroke="#c7d2fe" strokeWidth="1" />
                  <text x="120" y="195" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">Vault</text>
                </g>
              </svg>
            )}
          </div>

          {/* Step Pill */}
          <div className="mt-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-white/90">
            {step.badgeText}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: STEP CONTENT ================= */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header branding */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563EB] text-2xl font-bold">
                  security
                </span>
                <span
                  className="text-xl font-bold text-[#0F172A]"
                  style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
                >
                  VaultX
                </span>
              </div>
              <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
            </div>

            {/* Dynamic Step Content */}
            <div
              className={`transition-all duration-200 ${
                isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {/* Icon & Title */}
              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                  <span className="material-symbols-outlined text-2xl font-bold">
                    {step.icon}
                  </span>
                </div>
                <div>
                  <h2
                    className="text-2xl font-bold text-[#0F172A] leading-tight"
                    style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
                  >
                    {step.title}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                    Enterprise-Grade Storage Blueprint
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#475569] leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Key Highlights Bullet List */}
              {step.details && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 mb-6 space-y-2">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#334155]">
                      <span className="material-symbols-outlined text-sm text-[#16A34A] font-bold">
                        check_circle
                      </span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls: Dots + Action Buttons */}
          <div className="pt-4 border-t border-[#E2E8F0] mt-auto">
            <div className="flex items-center justify-between">
              {/* Progress Dots */}
              <div className="flex items-center gap-1.5" aria-label="Tour navigation dots">
                {TOUR_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => handleStepChange(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? 'w-7 bg-[#2563EB]'
                        : 'w-2.5 bg-[#CBD5E1] hover:bg-[#94A3B8]'
                    }`}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                >
                  Skip Tour
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : currentStep === TOUR_STEPS.length - 1 ? (
                    <>
                      <span>Get Started</span>
                      <span className="material-symbols-outlined text-sm font-bold">
                        rocket_launch
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <span className="material-symbols-outlined text-sm font-bold">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
