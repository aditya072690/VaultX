'use client';

import { useState, useRef, useEffect } from 'react';
import { useVaultStore } from '@/store/vaultStore';
import { useUIStore } from '@/store/uiStore';
import VaultSetupModal from './VaultSetupModal';

interface VaultUnlockModalProps {
  onUnlocked?: () => void;
}

export default function VaultUnlockModal({ onUnlocked }: VaultUnlockModalProps) {
  const { hasPinSet, hasPasswordSet, unlockVault, isLoading, unlockError, clearError } =
    useVaultStore();
  const { addToast } = useUIStore();

  const [method, setMethod] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [maskPin, setMaskPin] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    clearError();
    // Auto-focus first digit on mount
    if (method === 'pin') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [method]);

  const handlePinChange = (index: number, value: string) => {
    clearError();
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // If a digit was entered, auto-focus the next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If complete, attempt automatic unlock
    const fullPin = newPin.join('');
    if (fullPin.length === 6) {
      handleUnlockWithPin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullPin = pin.join('');
      if (fullPin.length === 6) {
        handleUnlockWithPin(fullPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setPin(digits);
      inputRefs.current[5]?.focus();
      handleUnlockWithPin(pasted);
    }
  };

  const handleUnlockWithPin = async (pinString: string) => {
    const success = await unlockVault({ vaultPin: pinString });
    if (success) {
      addToast({ type: 'success', message: 'Private Vault unlocked' });
      onUnlocked?.();
    } else {
      // Clear PIN inputs on error
      setPin(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    const success = await unlockVault({ vaultPassword: password });
    if (success) {
      addToast({ type: 'success', message: 'Private Vault unlocked' });
      onUnlocked?.();
    }
  };

  return (
    <>
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 relative animate-scale-up">
        {/* Top Decorative Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#4F46E5] to-[#2563EB] text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25 animate-pulse">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
              <span className="material-symbols-outlined text-sm">shield</span>
            </div>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-bold text-[#0F172A]"
            style={{ fontFamily: 'Hanken Grotesk' }}
          >
            Vault Locked
          </h1>
          <p className="text-sm text-[#64748B] mt-1 max-w-xs mx-auto">
            Enter your 6-digit security PIN or backup password to access your encrypted private files.
          </p>
        </div>

        {/* Unlock Method Tabs */}
        <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setMethod('pin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              method === 'pin'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-base">pin</span>
            6-Digit PIN
          </button>
          <button
            type="button"
            onClick={() => setMethod('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              method === 'password'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-base">password</span>
            Password
          </button>
        </div>

        {/* Error Alert */}
        {unlockError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] rounded-xl text-xs sm:text-sm mb-5 animate-shake">
            <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
            <div className="flex-1">
              <span>{unlockError}</span>
              {unlockError.includes('not been set up') && (
                <button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="block mt-1 underline font-semibold hover:text-[#B91C1C]"
                >
                  Click here to set up your Vault PIN now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Method 1: PIN Input */}
        {method === 'pin' && (
          <div className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type={maskPin ? 'password' : 'text'}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-14 sm:w-12 sm:h-15 text-center text-2xl font-bold border-2 rounded-2xl transition-all ${
                    unlockError
                      ? 'border-red-300 bg-red-50/30 text-red-700'
                      : digit
                      ? 'border-[#2563EB] bg-blue-50/20 text-[#0F172A]'
                      : 'border-[#E2E8F0] bg-white text-[#0F172A]'
                  } focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 disabled:opacity-50`}
                />
              ))}
            </div>

            {/* Mask Toggle */}
            <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
              <button
                type="button"
                onClick={() => setMaskPin(!maskPin)}
                className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  {maskPin ? 'visibility' : 'visibility_off'}
                </span>
                <span>{maskPin ? 'Show PIN digits' : 'Hide PIN digits'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSetupModal(true)}
                className="text-[#2563EB] hover:text-[#1D4ED8] font-medium"
              >
                {!hasPinSet ? 'Setup Vault PIN' : 'Reset / Forgot PIN?'}
              </button>
            </div>

            {/* Unlock Button */}
            <button
              type="button"
              onClick={() => handleUnlockWithPin(pin.join(''))}
              disabled={isLoading || pin.join('').length !== 6}
              className="w-full py-3.5 bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">lock_open</span>
                  <span>Unlock Private Vault</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Method 2: Password Input */}
        {method === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
                Vault Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    clearError();
                    setPassword(e.target.value);
                  }}
                  disabled={isLoading}
                  placeholder="Enter your backup password"
                  className="w-full px-4 py-3 pr-11 border-2 border-[#E2E8F0] rounded-2xl text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3.5 bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">lock_open</span>
                  <span>Unlock with Password</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Security Badge */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex items-center justify-center gap-2 text-xs text-[#94A3B8]">
          <span className="material-symbols-outlined text-sm text-[#10B981]">verified_user</span>
          <span>End-to-End Encrypted Session • Auto-locks after inactivity</span>
        </div>
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <VaultSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSuccess={() => {
            setShowSetupModal(false);
            onUnlocked?.();
          }}
        />
      )}
    </>
  );
}
