'use client';

import { useState } from 'react';
import { useVaultStore } from '@/store/vaultStore';
import { useUIStore } from '@/store/uiStore';

interface VaultSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VaultSetupModal({ isOpen, onClose, onSuccess }: VaultSetupModalProps) {
  const { updateSettings, unlockVault } = useVaultStore();
  const { addToast } = useUIStore();

  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [autoLockTimeout, setAutoLockTimeout] = useState(1800);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'pin' | 'confirm' | 'options'>('pin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinChange = (
    index: number,
    value: string,
    isConfirm: boolean = false
  ) => {
    setError(null);
    if (!/^\d*$/.test(value)) return;

    const currentArray = isConfirm ? [...confirmPin] : [...pin];
    currentArray[index] = value.slice(-1);

    if (isConfirm) {
      setConfirmPin(currentArray);
    } else {
      setPin(currentArray);
    }

    // Auto-focus next input
    if (value && index < 5) {
      const nextId = `${isConfirm ? 'confirm-' : ''}pin-setup-${index + 1}`;
      document.getElementById(nextId)?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    isConfirm: boolean = false
  ) => {
    const currentArray = isConfirm ? confirmPin : pin;
    if (e.key === 'Backspace' && !currentArray[index] && index > 0) {
      const prevId = `${isConfirm ? 'confirm-' : ''}pin-setup-${index - 1}`;
      document.getElementById(prevId)?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    isConfirm: boolean = false
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      if (isConfirm) {
        setConfirmPin(digits);
      } else {
        setPin(digits);
      }
      document.getElementById(`${isConfirm ? 'confirm-' : ''}pin-setup-5`)?.focus();
    }
  };

  const handleProceedToConfirm = () => {
    const pinStr = pin.join('');
    if (pinStr.length !== 6) {
      setError('Please enter a complete 6-digit PIN');
      return;
    }
    setError(null);
    setStep('confirm');
    setTimeout(() => {
      document.getElementById('confirm-pin-setup-0')?.focus();
    }, 100);
  };

  const handleProceedToOptions = () => {
    const pinStr = pin.join('');
    const confirmStr = confirmPin.join('');
    if (pinStr !== confirmStr) {
      setError('PINs do not match. Please try again.');
      return;
    }
    setError(null);
    setStep('options');
  };

  const handleSaveAndUnlock = async () => {
    const pinStr = pin.join('');
    if (password && password.length < 8) {
      setError('Backup password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await updateSettings({
        vaultPin: pinStr,
        vaultPassword: password || undefined,
        autoLockTimeout,
      });

      if (success) {
        addToast({ type: 'success', message: 'Private Vault configured successfully' });
        // Unlock immediately with newly set PIN
        await unlockVault({ vaultPin: pinStr });
        onSuccess?.();
        onClose();
      } else {
        setError('Failed to setup vault. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during vault setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#4F46E5] to-[#2563EB] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
          <h2
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: 'Hanken Grotesk' }}
          >
            Setup Private Vault
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            {step === 'pin' && 'Create a 6-digit security PIN to protect your private vault.'}
            {step === 'confirm' && 'Re-enter your 6-digit PIN to confirm.'}
            {step === 'options' && 'Configure backup password and auto-lock preferences.'}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`h-1.5 rounded-full transition-all ${
              step === 'pin' ? 'w-8 bg-[#2563EB]' : 'w-3 bg-[#E2E8F0]'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step === 'confirm' ? 'w-8 bg-[#2563EB]' : 'w-3 bg-[#E2E8F0]'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step === 'options' ? 'w-8 bg-[#2563EB]' : 'w-3 bg-[#E2E8F0]'
            }`}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] rounded-xl text-sm mb-5">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Create PIN */}
        {step === 'pin' && (
          <div className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  id={`pin-setup-${idx}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value, false)}
                  onKeyDown={(e) => handleKeyDown(idx, e, false)}
                  onPaste={(e) => handlePaste(e, false)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all text-[#0F172A]"
                />
              ))}
            </div>

            <button
              onClick={handleProceedToConfirm}
              disabled={pin.join('').length !== 6}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Step 2: Confirm PIN */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {confirmPin.map((digit, idx) => (
                <input
                  key={idx}
                  id={`confirm-pin-setup-${idx}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value, true)}
                  onKeyDown={(e) => handleKeyDown(idx, e, true)}
                  onPaste={(e) => handlePaste(e, true)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all text-[#0F172A]"
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('pin');
                  setConfirmPin(['', '', '', '', '', '']);
                }}
                className="w-1/3 py-3 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] font-semibold rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProceedToOptions}
                disabled={confirmPin.join('').length !== 6}
                className="w-2/3 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optional Backup Password & Preferences */}
        {step === 'options' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Backup Password (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 pr-10 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Allows unlocking your vault if you forget your PIN.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Auto-Lock Timeout
              </label>
              <select
                value={autoLockTimeout}
                onChange={(e) => setAutoLockTimeout(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-[#0F172A]"
              >
                <option value={900}>15 Minutes</option>
                <option value={1800}>30 Minutes (Recommended)</option>
                <option value={3600}>1 Hour</option>
                <option value={14400}>4 Hours</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="w-1/3 py-3 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] font-semibold rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveAndUnlock}
                disabled={loading}
                className="w-2/3 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock_open</span>
                    <span>Finish & Unlock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
