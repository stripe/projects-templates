import type { ReactNode } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { clerkConfigured } from '@/lib/clerk-config';
import { databaseConfigured } from '@/lib/database-config';
import { findLatestPurchaseForUser, upsertUserFromClerk } from '@/lib/data';

import { BuildProductCommandsCard } from '@/components/build-product-commands-card';
import { DatabaseStatusButton } from '@/components/database-status-button';

import { DeployCommand } from '@/components/deploy-command';


import { appConfig } from '@/lib/app-config';
import { getServerAuthContext, getServerCurrentUser } from '@/lib/server-auth';

import { bodyCopy, primaryButton, inlineIcon } from '@/lib/ui';

type StatusState = 'configured' | 'pending' | 'notIncluded';

type StatusItem = {
  action: ReactNode;
  icon: string;
  name: string;
  state: StatusState;
  subheader: string;
};

function getInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'SB';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function HomeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const monoLabelClass =
  'text-[10px] font-mono font-medium uppercase tracking-[0.18em] text-neutral-500';

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`${inlineIcon} ${className}`.trim()} viewBox="0 0 16 16">
      <path
        d="m6 3.5 4 4.5-4 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function StatusStateIndicator({ state }: { state: StatusState }) {
  const stateStyles: Record<
    StatusState,
    { label: string; dot: string; pulse: string; text: string }
  > = {
    configured: {
      label: 'Configured',
      dot: 'bg-emerald-500',
      pulse: 'bg-emerald-400/25',
      text: 'text-emerald-700',
    },
    pending: {
      label: 'Needs config',
      dot: 'bg-amber-500',
      pulse: 'bg-amber-400/25',
      text: 'text-amber-700',
    },
    notIncluded: {
      label: 'Not included',
      dot: 'bg-neutral-400',
      pulse: 'bg-neutral-300/25',
      text: 'text-neutral-500',
    },
  };

  const style = stateStyles[state];

  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${style.text}`}>
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className={`absolute h-4 w-4 animate-ping rounded-full ${style.pulse}`} />
        <span className={`relative h-2.5 w-2.5 rounded-full ${style.dot}`} />
      </span>
      {style.label}
    </span>
  );
}

export default async function DashboardPage() {
  if (!clerkConfigured) {
    return (
      <main className="min-h-screen w-full bg-white">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <section className="w-full p-8">
            <h1
              className="max-w-[16ch] text-balance text-[clamp(2.8rem,5vw,4rem)] font-[300] leading-[0.96] tracking-[-0.04em] text-neutral-950"
            >
              Authentication is not configured yet.
            </h1>
            <p className={`${bodyCopy} mt-4 max-w-2xl`}>
              Provision Clerk for {appConfig.name}, then return to this dashboard to explore the unlocked
              starter experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={primaryButton} href="/">
                Return home
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const authContext = await getServerAuthContext();
  const checkoutConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
  const hostingConfigured = Boolean(process.env.NETLIFY_NETLIFY_SITE_URL || process.env.NETLIFY_NETLIFY_SITE_NAME || process.env.NETLIFY_NETLIFY_SITE_ID || process.env.NETLIFY_SITE_URL || process.env.NETLIFY_SITE_NAME || process.env.NETLIFY_SITE_ID);


  if (!authContext.userId) {
    return (
      <main className="min-h-screen w-full bg-white">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <section className="w-full p-8">
            <h1
              className="max-w-[16ch] text-balance text-[clamp(2.8rem,5vw,4rem)] font-[300] leading-[0.96] tracking-[-0.04em] text-neutral-950"
            >
              Your sign-in session is still syncing.
            </h1>
            <p className={`${bodyCopy} mt-4 max-w-2xl`}>
              The browser thinks you signed in, but the server has not confirmed that session yet. Refresh this
              page or continue through sign in again to finish loading your dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={primaryButton} href="/dashboard">
                Try again
              </Link>
              <Link className={primaryButton} href="/sign-in?redirect_to=/dashboard">
                Continue to sign in
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const user = await getServerCurrentUser();

  const displayName =
    user?.fullName ??
    user?.firstName ??
    authContext.fullName ??
    authContext.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    authContext.email ??
    'there';
  const email = user?.primaryEmailAddress?.emailAddress ?? authContext.email;
  const initials = getInitials(displayName);
  const imageURL = user?.imageUrl ?? null;

  let latestPurchaseStatus: string | null = null;

  if (databaseConfigured && authContext.userId) {
    const record = await upsertUserFromClerk({
      clerkUserId: authContext.userId,
      email,
    });
    const latestPurchase = await findLatestPurchaseForUser(record.id);

    latestPurchaseStatus = latestPurchase?.status ?? null;
  }

  const hasUnlockedAccess = latestPurchaseStatus === 'paid';

  if (!hasUnlockedAccess) {
    const lockedMessage = !databaseConfigured
      ? 'Connect your database first so the starter can record successful purchases and unlock the workspace.'
      : checkoutConfigured
        ? 'Complete the starter checkout once to unlock this signed-in workspace.'
        : 'Configure Stripe checkout first, then complete the starter purchase to unlock the workspace.';

    return (
      <main className="min-h-screen w-full bg-white">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <section className="w-full p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Locked until paid
            </p>
            <h1
              className="mt-3 max-w-[12ch] text-balance text-[clamp(3rem,5vw,4.2rem)] font-[300] leading-[0.96] tracking-[-0.04em] text-neutral-950"
            >
              Complete purchase to unlock this page.
            </h1>
            <p className={`${bodyCopy} mt-4 max-w-2xl`}>{lockedMessage}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={primaryButton} href={checkoutConfigured ? '/checkout' : '/api/health'}>
                {checkoutConfigured ? 'Go to checkout' : 'View health'}
              </Link>
              <Link className={primaryButton} href="/">
                Return home
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const subcopy =
    'This is your unlocked workspace. Add your own pages and features for signed-in users here now that the starter purchase has been completed.';

  const statusItems: StatusItem[] = [
    {
      action: (
        <span className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-neutral-500">
          Logged in as {email ?? displayName}
        </span>
      ),
      icon: '/icons/clerk.svg',
      name: 'Clerk',
      state: clerkConfigured ? 'configured' : 'pending',
      subheader: 'Auth',
    },
    {
      action: (
        <span className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-emerald-700">
          Access granted
        </span>
      ),
      icon: '/icons/stripe.svg',
      name: 'Stripe',
      state: checkoutConfigured || hasUnlockedAccess ? 'configured' : 'pending',
      subheader: 'Payments',
    },
    {
      action: <DatabaseStatusButton />,
      icon: "https://render.com/favicon.ico",
      name: "Render Postgres",
      state: databaseConfigured ? 'configured' : 'pending',
      subheader: 'Database',
    },
    {
      action: <DeployCommand label="Deploy to Netlify" />,
      icon: "https://www.netlify.com/favicon.ico",
      name: "Netlify",
      state: hostingConfigured ? 'configured' : 'pending',
      subheader: 'Hosting',
    },
  ];
  const hasPendingItems = statusItems.some((item) => item.state === 'pending');
  const statusPanelSummary = hasPendingItems
    ? 'Access is unlocked. Finish any remaining setup items as you customize the app.'
    : 'Access is unlocked and your services are connected.';

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="flex min-h-screen">
        <aside className="flex w-[240px] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/80 px-3 py-4">
          <div className="flex items-center gap-2.5 px-3 pb-6 pt-1">
            <span className="text-[17px] font-medium text-neutral-950">{appConfig.name}</span>
          </div>

          <nav className="space-y-0.5">
            <div className="flex items-center gap-2.5 rounded-md bg-neutral-100/80 px-3 py-1.5 text-[14px] font-medium text-neutral-950">
              <HomeIcon className="h-[18px] w-[18px] text-neutral-500" />
              Home
            </div>
          </nav>

          <div className="mt-auto space-y-2">
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-semibold text-white"
                style={imageURL ? { backgroundImage: `url(${imageURL})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {imageURL ? <span className="sr-only">{displayName}</span> : initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-neutral-950">{displayName}</p>
                <p className="truncate text-[12px] text-neutral-500">{email ?? 'Signed in'}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </aside>

        <section className="flex-1 px-10 py-10 lg:px-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Unlocked workspace
          </p>
          <h1
            className="mt-3 max-w-[14ch] text-balance text-[clamp(3rem,5vw,4.2rem)] font-[300] leading-[0.96] tracking-[-0.04em] text-neutral-950"
          >
            Welcome, <span className="font-[500]">{displayName}</span>
          </h1>
          <p className={`${bodyCopy} mt-4 max-w-2xl`}>{subcopy}</p>

          <section className="mt-8 max-w-4xl overflow-hidden rounded-[22px] border border-white/80 bg-white/68 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <div className="border-b border-black/[0.05] px-5 py-4 sm:px-6">
              <div>
                <p className={monoLabelClass}>Integration status panel</p>
                <p className="mt-2 text-sm text-neutral-600">{statusPanelSummary}</p>
              </div>
            </div>

            <div
              aria-hidden="true"
              className={`hidden grid-cols-[120px_minmax(0,1fr)_auto] gap-4 border-b border-black/[0.05] px-6 py-2.5 md:grid ${monoLabelClass}`}
            >
              <span>Status</span>
              <span>Integration</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-black/[0.05]">
              {statusItems.map((item) => (
                <article
                  key={item.name}
                  className="grid gap-3 px-5 py-4 transition-colors hover:bg-white/20 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center md:gap-4 md:px-6"
                >
                  <div>
                    <StatusStateIndicator state={item.state} />
                  </div>

                  <div className="flex min-w-0 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" className="h-8 w-8 rounded" src={item.icon} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-950">{item.name}</h3>
                      <p className="mt-0.5 text-xs text-neutral-400">{item.subheader}</p>
                    </div>
                  </div>

                  <div className="md:justify-self-end">{item.action}</div>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-8">
            <BuildProductCommandsCard />
          </div>
        </section>
      </div>
    </main>
  );
}
