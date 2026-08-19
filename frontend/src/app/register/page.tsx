'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  const passwordStrength = (() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (form.password !== form.confirmPassword) {
      return;
    }
    if (!agreed) return;

    try {
      await register(form.email, form.password, form.firstName, form.lastName);
      router.push('/dashboard');
    } catch {
      // Error handled by store
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-8">
      <div className="w-full max-w-[440px] animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2563EB] rounded-xl mb-4">
            <span className="material-symbols-outlined text-white text-3xl">shield_lock</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Hanken Grotesk' }}>VaultX</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>
            Create your account
          </h2>
          <p className="text-sm text-[#64748B] mb-6">Start storing your files securely</p>

          {error && (
            <div className="mb-4 p-3 bg-[#FEE2E2] border border-red-200 rounded-lg text-[#DC2626] text-sm flex items-center gap-2 animate-slide-down">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">First name</label>
                <input
                  type="text" value={form.firstName} onChange={update('firstName')}
                  placeholder="John" required
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Last name</label>
                <input
                  type="text" value={form.lastName} onChange={update('lastName')}
                  placeholder="Doe" required
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xl">mail</span>
                <input
                  type="email" value={form.email} onChange={update('email')}
                  placeholder="you@example.com" required
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xl">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={update('password')}
                  placeholder="Min. 8 characters" required minLength={8}
                  className="w-full pl-10 pr-12 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>

              {/* Password Strength */}
              {form.password && (
                <div className="mt-2 animate-slide-down">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColor : 'bg-[#E2E8F0]'}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength >= 3 ? 'text-green-600' : passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {strengthLabel}
                  </p>
                  <div className="mt-2 space-y-1">
                    {[
                      { test: form.password.length >= 8, label: 'At least 8 characters' },
                      { test: /[A-Z]/.test(form.password), label: 'One uppercase letter' },
                      { test: /[0-9]/.test(form.password), label: 'One number' },
                      { test: /[^A-Za-z0-9]/.test(form.password), label: 'One special character' },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-2 text-xs">
                        <span className={`material-symbols-outlined text-sm ${req.test ? 'text-green-500' : 'text-[#CBD5E1]'}`}>
                          {req.test ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={req.test ? 'text-green-700' : 'text-[#94A3B8]'}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Confirm password</label>
              <input
                type="password" value={form.confirmPassword} onChange={update('confirmPassword')}
                placeholder="Re-enter your password" required
                className={`w-full px-3 py-2.5 border rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${
                  form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0]'
                }`}
              />
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]" />
              <label className="text-sm text-[#64748B]">
                I agree to the <a href="#" className="text-[#2563EB] hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-[#2563EB] hover:underline">Privacy Policy</a>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading || !agreed || form.password !== form.confirmPassword}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-[#64748B]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
