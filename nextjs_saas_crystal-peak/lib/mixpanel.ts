'use client';

import mixpanel from 'mixpanel-browser';

let initialized = false;

export function initMixpanel(): boolean {
  if (initialized || typeof window === 'undefined') return false;

  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) {
    console.info('[analytics] No Mixpanel token found. Running in local-only mode.');
    return false;
  }

  mixpanel.init(token, {
    track_pageview: 'url-with-path',
    persistence: 'localStorage',
    debug: process.env.NODE_ENV === 'development',
  });

  initialized = true;
  return true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    mixpanel.track(event, properties);
  } catch {
    // Swallow tracking errors to avoid crashing the UI.
  }
}

export function identify(distinctId: string, traits?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  mixpanel.identify(distinctId);
  if (traits && Object.keys(traits).length > 0) {
    mixpanel.people.set(traits);
  }
}

export function reset(): void {
  if (typeof window === 'undefined') return;
  mixpanel.reset();
}

export function getDistinctId(): string {
  if (typeof window === 'undefined') return '';
  return mixpanel.get_distinct_id();
}

export { mixpanel };
