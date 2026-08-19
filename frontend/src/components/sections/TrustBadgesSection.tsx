'use client';

import React, { useState } from 'react';

export interface TrustBadge {
  icon: string;
  label: string;
  description: string;
  certUrl?: string;
  complianceId?: string;
}

const DEFAULT_BADGES: TrustBadge[] = [
  {
    icon: 'security',
    label: 'SOC 2 Type II Compliant',
    description: 'Independently audited and certified for security, confidentiality, and uptime availability.',
    certUrl: '#security-audit',
    complianceId: 'SOC2-2026-VX',
  },
  {
    icon: 'cloud_done',
    label: 'CloudSec Partner',
    description: 'Continuous cloud security posture and automated threat prevention monitoring.',
    certUrl: '#cloudsec-compliance',
    complianceId: 'CSP-99482',
  },
  {
    icon: 'verified',
    label: 'Privacy Shield & GDPR',
    description: 'Strict adherence to European and global privacy regulations with zero data mining.',
    certUrl: '#gdpr-privacy',
    complianceId: 'GDPR-EU-COMPLIANT',
  },
  {
    icon: 'enhanced_encryption',
    label: 'AES-256 Validated',
    description: 'Military-grade end-to-end symmetric encryption keys stored with zero-knowledge architecture.',
    certUrl: '#encryption-standards',
    complianceId: 'AES256-NIST-GCM',
  },
];

export interface TrustBadgesSectionProps {
  badges?: TrustBadge[];
  title?: string;
}

export function TrustBadgesSection({
  badges = DEFAULT_BADGES,
  title = 'Trusted by industry leaders and audited for security',
}: TrustBadgesSectionProps) {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  return (
    <section className="py-12 md:py-16 border-y border-[#E2E8F0] bg-white relative z-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Header */}
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-8 md:mb-10">
          {title}
        </p>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 max-w-5xl mx-auto items-center justify-center">
          {badges.map((badge, idx) => {
            const isHovered = activeTooltipIndex === idx;

            return (
              <div
                key={badge.label}
                className="relative group flex flex-col items-center justify-center"
                onMouseEnter={() => setActiveTooltipIndex(idx)}
                onMouseLeave={() => setActiveTooltipIndex(null)}
                onFocus={() => setActiveTooltipIndex(idx)}
                onBlur={() => setActiveTooltipIndex(null)}
                tabIndex={0}
                role="button"
                aria-label={`${badge.label}: ${badge.description}`}
                aria-describedby={isHovered ? `tooltip-${idx}` : undefined}
              >
                {/* Badge Container */}
                <div
                  className={`flex flex-col items-center gap-3 p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
                    isHovered
                      ? 'opacity-100 scale-105'
                      : 'opacity-70 grayscale hover:grayscale-0'
                  }`}
                >
                  {/* Badge Icon Box */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xs ${
                      isHovered
                        ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/25 rotate-1'
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl sm:text-3xl leading-none">
                      {badge.icon}
                    </span>
                  </div>

                  {/* Badge Label */}
                  <span
                    className={`font-semibold text-xs sm:text-sm tracking-tight transition-colors text-center ${
                      isHovered ? 'text-[#0F172A]' : 'text-[#64748B]'
                    }`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Floating Tooltip / Popover */}
                {isHovered && (
                  <div
                    id={`tooltip-${idx}`}
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-[#0F172A] text-white p-3.5 rounded-xl text-xs shadow-2xl z-30 animate-slide-up border border-slate-700 text-left pointer-events-auto"
                  >
                    {/* Tooltip Header */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-white text-xs">{badge.label}</span>
                      {badge.complianceId && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                          {badge.complianceId}
                        </span>
                      )}
                    </div>

                    {/* Tooltip Description */}
                    <p className="text-slate-300 text-[11px] leading-relaxed mb-2.5">
                      {badge.description}
                    </p>

                    {/* Action link */}
                    {badge.certUrl && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Status: Verified</span>
                        <span className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-0.5">
                          <span>Details</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </span>
                      </div>
                    )}

                    {/* Triangle Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2.5 h-2.5 bg-[#0F172A] rotate-45 border-r border-b border-slate-700" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default TrustBadgesSection;
