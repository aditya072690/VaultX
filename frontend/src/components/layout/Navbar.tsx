'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import MobileMenu, { NavLink } from './MobileMenu';

export interface NavbarProps {
  transparent?: boolean;
  sticky?: boolean;
  showAuth?: boolean;
  navLinks?: NavLink[];
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar({
  transparent = false,
  sticky = true,
  showAuth = true,
  navLinks = DEFAULT_NAV_LINKS,
}: NavbarProps) {
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isBackgroundSolid = !transparent || scrolled;

  return (
    <>
      <nav
        className={`${
          sticky ? 'fixed top-0 inset-x-0' : 'relative'
        } z-40 transition-all duration-300 ${
          isBackgroundSolid
            ? 'bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs'
            : 'bg-transparent border-b border-transparent'
        }`}
        aria-label="Main Navigation"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
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

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#64748B] hover:text-[#2563EB] transition-colors relative py-1 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2563EB] rounded-full transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop Auth Actions */}
          {showAuth && (
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
                    <span className="material-symbols-outlined text-base">space_dashboard</span>
                    <span>Dashboard</span>
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <button className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors">
                      Log in
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30">
                      Get Started Free
                    </button>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="md:hidden p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={navLinks}
        showAuth={showAuth}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}

export default Navbar;
