'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface Feature {
  icon: string;
  title: string;
  description: string;
  href?: string;
  badge?: string;
}

const DEFAULT_FEATURES: Feature[] = [
  {
    icon: 'enhanced_encryption',
    title: 'Military-Grade Security',
    description:
      'End-to-end zero-knowledge encryption ensures that only you hold the keys to your data. Not even we can see or access your files.',
    href: '#security',
    badge: 'AES-256 GCM',
  },
  {
    icon: 'sync',
    title: 'Seamless Sync',
    description:
      'Access your files instantly across desktop, mobile, and web. Changes sync securely in real-time with chunked upload acceleration.',
    href: '#sync',
    badge: 'Real-Time',
  },
  {
    icon: 'account_tree',
    title: 'Smart Organization',
    description:
      'Intelligent folder hierarchies, granular recipient permissions, and instant in-browser previews for PDFs, photos, and video media.',
    href: '#organization',
    badge: 'Productivity',
  },
];

export interface FeaturesSectionProps {
  features?: Feature[];
  title?: string;
  subtitle?: string;
}

export function FeaturesSection({
  features = DEFAULT_FEATURES,
  title = 'Built for uncompromising security',
  subtitle = 'We designed VaultX from the ground up to prioritize your privacy without adding friction to your workflow.',
}: FeaturesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto relative overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-50/60 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Section Header */}
      <div
        className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-2 block">
          Core Architecture
        </span>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F172A] tracking-tight mb-4"
          style={{ fontFamily: 'Hanken Grotesk' }}
        >
          {title}
        </h2>
        <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Features 3-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
        {features.map((feature, idx) => (
          <div
            key={feature.title}
            tabIndex={0}
            className={`bg-white p-7 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-[#2563EB] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 relative ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{
              transitionDelay: isVisible ? `${idx * 150}ms` : '0ms',
              transitionDuration: '800ms',
            }}
          >
            <div>
              {/* Header with Icon and Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-13 h-13 rounded-2xl bg-blue-50 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white group-hover:scale-110 group-hover:shadow-md group-hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl leading-none">
                    {feature.icon}
                  </span>
                </div>

                {feature.badge && (
                  <span className="text-[11px] font-semibold text-[#2563EB] bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100 group-hover:border-blue-200 transition-colors">
                    {feature.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#2563EB] transition-colors"
                style={{ fontFamily: 'Hanken Grotesk' }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-6">
                {feature.description}
              </p>
            </div>

            {/* Learn More Link / Action */}
            {feature.href && (
              <div className="pt-4 border-t border-[#F1F5F9]">
                <a
                  href={feature.href}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#2563EB] group-hover:gap-2.5 transition-all"
                >
                  <span>Learn More</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
