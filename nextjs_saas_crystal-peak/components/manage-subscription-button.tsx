'use client';

import { useState } from 'react';
import { track } from '@/lib/mixpanel';
import { mutedText, secondaryButton } from '@/lib/ui';

export function ManageSubscriptionButton({
  buttonLabel = 'Manage Subscription',
  variant = 'secondary',
}: {
  buttonLabel?: string;
  variant?: 'secondary' | 'status';
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManageSubscription() {
    try {
      setLoading(true);
      setError(null);

      track('billing_portal_opened');

      const response = await fetch('/api/billing-portal', {
        method: 'POST',
      });
      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? 'Unable to launch the Stripe customer portal.');
      }

      window.location.assign(payload.url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to launch the Stripe customer portal.';
      setError(message);
      setLoading(false);
    }
  }

  const buttonClassName =
    variant === 'secondary'
      ? secondaryButton
      : 'group inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-[15px] font-medium text-neutral-700 shadow-sm transition-all duration-200 ease-out hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="space-y-2">
      <button
        className={buttonClassName}
        disabled={loading}
        onClick={handleManageSubscription}
        type="button"
      >
        {loading ? 'Opening portal...' : buttonLabel}
        {!loading && variant === 'status' ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5">
            <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        ) : null}
      </button>
      {error ? <p className={mutedText}>{error}</p> : null}
    </div>
  );
}
