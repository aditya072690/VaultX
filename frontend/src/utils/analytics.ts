/**
 * VaultX Client Telemetry & Analytics Utility
 * Provides structured tracking hooks for onboarding, quota warnings, conversion CTAs, and error events.
 */

export interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export const analytics = {
  trackEvent(event: AnalyticsEvent) {
    // 1. Console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event.category || 'Event'}: ${event.action}`, event.metadata || '');
    }

    // 2. Google Analytics / gtag dispatch (if configured)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.metadata,
      });
    }

    // 3. Custom telemetry endpoint (optional fallback)
    try {
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('event', { name: event.action, data: event.metadata });
      }
    } catch {}
  },

  trackOnboarding(step: number, stepName: string, action: 'view' | 'advance' | 'skip' | 'complete') {
    this.trackEvent({
      action: `onboarding_${action}`,
      category: 'Onboarding',
      label: stepName,
      value: step,
      metadata: { step, stepName, action, timestamp: new Date().toISOString() },
    });
  },

  trackStorageQuota(action: 'view_modal' | 'upgrade_click' | 'manage_files_click' | 'trash_recovery_click', metadata?: Record<string, any>) {
    this.trackEvent({
      action: `storage_quota_${action}`,
      category: 'Conversion',
      label: action,
      metadata: { ...metadata, timestamp: new Date().toISOString() },
    });
  },

  trackSecurity(action: '403_forbidden' | 'vault_unlocked' | 'vault_locked' | 'session_revoked', metadata?: Record<string, any>) {
    this.trackEvent({
      action: `security_${action}`,
      category: 'Security',
      label: action,
      metadata: { ...metadata, timestamp: new Date().toISOString() },
    });
  },
};

export default analytics;
