import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthSync } from '@/components/auth-sync';
import { clerkConfigured, clerkPublishableKey } from '@/lib/clerk-config';

import './globals.css';

export const metadata: Metadata = {
  title: "Next.js One-time Payment Starter",
  description: 'A One-time Payment starter application created with Stripe Projects.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicons/favicon.svg',
    apple: '/favicons/favicon.svg',
  },
  openGraph: {
    images: ['/opengraph/default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph/default.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClassName =
    'font-sans relative isolate min-h-screen overflow-x-hidden bg-white text-neutral-950 antialiased';
  if (!clerkConfigured) {
    return (
      <html lang="en">
        <body className={bodyClassName}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en">
        <body className={bodyClassName}>
          <AuthSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
