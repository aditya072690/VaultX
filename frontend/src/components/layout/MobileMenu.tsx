'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export interface NavLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
  showAuth?: boolean;
  isAuthenticated?: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  links,
  showAuth = true,
  isAuthenticated = false,
}) => {
  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 md:hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Container */}
      <div className="fixed top-0 inset-x-0 bg-white border-b border-[#E2E8F0] shadow-2xl z-10 px-6 py-6 animate-slide-down">
        {/* Header with Logo and Close button */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 bg-gradient-to-tr from-[#2563EB] to-[#4F46E5] rounded-lg flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-lg">shield</span>
            </div>
            <span
              className="text-lg font-bold text-[#0F172A] tracking-tight"
              style={{ fontFamily: 'Hanken Grotesk' }}
            >
              VaultX
            </span>
          </Link>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="py-4 space-y-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between py-3 px-3 rounded-xl text-base font-medium text-[#0F172A] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
            >
              <span>{link.label}</span>
              <span className="material-symbols-outlined text-sm text-[#94A3B8]">chevron_right</span>
            </a>
          ))}
        </nav>

        {/* Auth Buttons */}
        {showAuth && (
          <div className="pt-4 border-t border-[#F1F5F9] space-y-2.5">
            {isAuthenticated ? (
              <Link href="/dashboard" className="block" onClick={onClose}>
                <button className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">space_dashboard</span>
                  <span>Go to Dashboard</span>
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="block" onClick={onClose}>
                  <button className="w-full py-2.5 px-4 text-center text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl transition-colors">
                    Log in
                  </button>
                </Link>
                <Link href="/register" className="block" onClick={onClose}>
                  <button className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 text-center">
                    Get Started Free
                  </button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
