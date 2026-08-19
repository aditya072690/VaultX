'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would call the API
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-[440px] animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2563EB] rounded-xl mb-4">
            <span className="material-symbols-outlined text-white text-3xl">shield_lock</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Hanken Grotesk' }}>VaultX</h1>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-8">
          {submitted ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-[#16A34A]">mark_email_read</span>
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-2" style={{ fontFamily: 'Hanken Grotesk' }}>Check your email</h2>
              <p className="text-sm text-[#64748B] mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>Forgot password?</h2>
              <p className="text-sm text-[#64748B] mb-6">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email address</label>
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xl">mail</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all" />
                </div>
                <button type="submit"
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2.5 rounded-lg transition-all">
                  Send Reset Link
                </button>
              </form>
            </>
          )}
        </div>

        {!submitted && (
          <p className="text-center mt-6 text-sm text-[#64748B]">
            Remember your password?{' '}
            <Link href="/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
