import type { NextConfig } from 'next';

const posthogHost =
  process.env.POSTHOG_ANALYTICS_HOST ??
  process.env.POSTHOG_HOST ??
  process.env.NEXT_PUBLIC_POSTHOG_HOST ??
  'https://us.posthog.com';

// Stripe Projects injects the PostHog dashboard host; the browser SDK sends events to ingest hosts.
const posthogIngestHost = posthogHost
  .replace('https://us.posthog.com', 'https://us.i.posthog.com')
  .replace('https://eu.posthog.com', 'https://eu.i.posthog.com');

const posthogAssetsHost = posthogIngestHost
  .replace('https://us.i.posthog.com', 'https://us-assets.i.posthog.com')
  .replace('https://eu.i.posthog.com', 'https://eu-assets.i.posthog.com');

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_POSTHOG_HOST: posthogHost,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
      process.env.POSTHOG_ANALYTICS_API_KEY ??
      process.env.POSTHOG_API_KEY ??
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  },
  // Reverse proxy for PostHog (matches api_host in instrumentation-client.ts).
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${posthogAssetsHost}/static/:path*` },
      { source: '/ingest/array/:path*', destination: `${posthogAssetsHost}/array/:path*` },
      { source: '/ingest/:path*', destination: `${posthogIngestHost}/:path*` },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
