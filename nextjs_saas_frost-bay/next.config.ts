import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_MIXPANEL_TOKEN:
      process.env.MIXPANEL_PROJECT_TOKEN ?? process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    NEXT_PUBLIC_MIXPANEL_INGESTION_URL:
      process.env.MIXPANEL_INGESTION_URL ?? 'https://api.mixpanel.com',
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
