'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface FooterLinkItem {
  label: string;
  href: string;
  badge?: string;
  isExternal?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface SocialLink {
  icon: string;
  label: string;
  href: string;
}

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Private Vault', href: '/dashboard/private', badge: 'PIN Locked' },
      { label: 'Shared with Me', href: '/dashboard/shared' },
      { label: 'Pricing & Plans', href: '#pricing' },
      { label: 'Product Tour', href: '#product' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Zero-Knowledge Security', href: '#features' },
      { label: 'Activity Logs', href: '/dashboard/activity' },
      { label: 'Trash & Recovery', href: '/dashboard/trash' },
      { label: 'Frequently Asked Questions', href: '#faq' },
      { label: 'Help & Documentation', href: 'mailto:support@vaultx.com' },
    ],
  },
  {
    title: 'Legal & Trust',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Security & Compliance', href: '#features' },
      { label: 'SOC 2 Type II Certified', href: '#security' },
      { label: 'GDPR Compliance', href: '#privacy' },
    ],
  },
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { icon: 'language', label: 'VaultX Website', href: 'https://vaultx.app' },
  { icon: 'code', label: 'GitHub Repository', href: 'https://github.com/vaultx' },
  { icon: 'mail', label: 'Email Support', href: 'mailto:support@vaultx.com' },
  { icon: 'help_outline', label: 'Support Center', href: 'mailto:support@vaultx.com' },
];

export interface FooterProps {
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
  showNewsletter?: boolean;
}

export function Footer({
  columns = DEFAULT_FOOTER_COLUMNS,
  socialLinks = DEFAULT_SOCIAL_LINKS,
  showNewsletter = true,
}: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-[#E2E8F0] text-[#0F172A] relative" aria-label="Site Footer">
      {/* Main Footer Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 md:gap-12">
          {/* Col 1: Brand & Mission & Newsletter (Span 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-tr from-[#2563EB] to-[#4F46E5] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-xl">shield</span>
              </div>
              <span
                className="text-xl font-bold text-[#0F172A] tracking-tight group-hover:text-[#2563EB] transition-colors"
                style={{ fontFamily: 'Hanken Grotesk' }}
              >
                VaultX
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-xs sm:text-sm text-[#64748B] max-w-sm leading-relaxed">
              Zero-knowledge encrypted cloud storage designed for modern professionals, developers,
              and security-conscious teams.
            </p>

            {/* Newsletter Form */}
            {showNewsletter && (
              <div className="pt-2 max-w-sm">
                <p className="text-xs font-semibold text-[#0F172A] mb-2">
                  Stay updated with security releases
                </p>
                {subscribed ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Thank you for subscribing!</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer hover:shadow"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#2563EB] hover:border-[#2563EB] hover:scale-105 transition-all duration-300 shadow-xs"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Col 2, 3, 4: Navigation Columns */}
          {columns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h4
                className="text-xs font-bold text-[#0F172A] uppercase tracking-wider"
                style={{ fontFamily: 'Hanken Grotesk' }}
              >
                {column.title}
              </h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('#') || link.href.startsWith('mailto:') ? (
                      <a
                        href={link.href}
                        className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#64748B] hover:text-[#2563EB] transition-colors group"
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100 group-hover:bg-blue-100">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#64748B] hover:text-[#2563EB] transition-colors group"
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100 group-hover:bg-blue-100">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Live System Status & Encryption Indicator */}
        <div className="mt-12 pt-6 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-medium text-[#0F172A]">All Systems Operational</span>
            <span className="text-gray-300">•</span>
            <span>99.99% Global Uptime</span>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1 text-[#64748B] hover:text-[#2563EB] transition-colors font-medium cursor-pointer"
          >
            <span>Back to top</span>
            <span className="material-symbols-outlined text-base">arrow_upward</span>
          </button>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>© {new Date().getFullYear()} VaultX Inc. Zero-Knowledge Cloud Storage. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#2563EB] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#2563EB] transition-colors">
              Terms
            </Link>
            <a href="mailto:security@vaultx.com" className="hover:text-[#2563EB] transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
