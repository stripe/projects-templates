'use client';

import { useState } from 'react';
import { track, getDistinctId } from '@/lib/mixpanel';
import { primaryButton, mutedText } from '@/lib/ui';

export function CheckoutButton({ label = 'Start checkout' }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    try {
      setLoading(true);
      setError(null);

      track('checkout_started');

      const response = await fetch('/api/checkout', {
        credentials: 'same-origin',
        method: 'POST',
        headers: {
          'X-MIXPANEL-DISTINCT-ID': getDistinctId(),
        },
      });

      const payload = (await response.json()) as { error?: string; url?: string };
      if (response.status === 401) {
        window.location.assign('/sign-in?redirect_to=/checkout');
        return;
      }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? 'Unable to create a checkout session.');
      }

      window.location.assign(payload.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to launch checkout.';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className={`${primaryButton} w-full`} disabled={loading} onClick={handleCheckout}>
        {loading ? 'Creating session...' : label}
      </button>
      {error ? <p className={mutedText}>{error}</p> : null}
    </div>
  );
}
