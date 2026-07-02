import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { clerkConfigured } from '@/lib/clerk-config';
import { databaseConfigured } from '@/lib/database-config';
import { findLatestPurchaseForUser, upsertUserFromClerk } from '@/lib/data';
import { DatabaseStatusButton } from '@/components/database-status-button';

import { DeployCard, DeployCommand } from '@/components/deploy-command';

import { appConfig } from '@/lib/app-config';
import { getServerAuthContext, getServerCurrentUser } from '@/lib/server-auth';

import { CopyButton } from '@/components/copy-button';
import { bodyCopy, primaryButton } from '@/lib/ui';

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

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'configured' | 'pending';
}) {
  const style =
    tone === 'configured'
      ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-700'
      : 'bg-amber-500/10 border-amber-500/30 text-amber-700';
  const dot =
    tone === 'configured'
      ? 'bg-emerald-500 border-emerald-600'
      : 'bg-amber-500 border-amber-600';

  return (
    <div className={`flex items-center gap-1 rounded-sm border px-1.5 py-1.25 font-mono text-[0.625rem]/[100%] uppercase ${style}`}>
      <div className={`h-2 w-2 rounded-full border ${dot}`} />
      <p>{label}</p>
    </div>
  );
}

function resolveDatabaseDashboardUrl() {
  const directDashboardURL =
    process.env.NEON_DASHBOARD_URL?.trim() || process.env.NEON_POSTGRES_DASHBOARD_URL?.trim();

  if (directDashboardURL) {
    return directDashboardURL;
  }

  const projectId =
    process.env.NEON_PROJECT_ID?.trim() || process.env.NEON_POSTGRES_PROJECT_ID?.trim();
  const branchId =
    process.env.NEON_BRANCH_ID?.trim() || process.env.NEON_POSTGRES_BRANCH_ID?.trim();

  if (!projectId) {
    return null;
  }

  if (branchId) {
    return `https://console.neon.tech/app/projects/${projectId}/branches/${branchId}`;
  }

  return `https://console.neon.tech/app/projects/${projectId}`;
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
  const hostingConfigured = Boolean(process.env.VERCEL === '1' || process.env.VERCEL_URL || process.env.VERCEL_PROJECT_URL || process.env.VERCEL_PROJECT_ID);


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

  const databaseDashboardUrl = resolveDatabaseDashboardUrl();


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
                style={
                  imageURL
                    ? {
                        backgroundImage: `url(${imageURL})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
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
          <h1 className="mt-3 max-w-lg text-balance text-4xl tracking-tight text-neutral-950 sm:text-6xl">
            Welcome, {displayName}
          </h1>
          <p className={`${bodyCopy} mt-4 max-w-2xl`}>{subcopy}</p>

          <div className="group/customize relative mt-8 flex w-full max-w-4xl flex-col items-start">
            <div className="relative h-14 w-full rounded-lg border border-neutral-200 bg-neutral-100 p-1">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm border border-neutral-300 bg-neutral-200">
                <div className="absolute flex h-full w-full -translate-y-14 items-center justify-between overflow-hidden opacity-0 transition duration-400 ease-in-out group-has-checked/customize:translate-y-0 group-has-checked/customize:opacity-100">
                  <div className="flex h-full w-full items-center justify-start overflow-scroll whitespace-nowrap px-4 font-mono text-sm">
                    claude &quot;Help me turn this into a real product. Follow prompts/starter-to-product.md.&quot;
                  </div>
                  <div className="relative flex h-full shrink-0 items-center bg-neutral-200 pr-1.75">
                    <div className="absolute top-0 -left-4 h-14 w-4 bg-linear-to-l from-neutral-200 to-neutral-200/0" />
                    <CopyButton text='claude "Help me turn this into a real product. Follow prompts/starter-to-product.md."' />
                  </div>
                </div>
                <div className="absolute flex h-full w-full translate-y-0 items-center justify-between overflow-hidden transition duration-400 ease-in-out group-has-checked/customize:translate-y-14 group-has-checked/customize:opacity-0">
                  <div className="flex h-full w-full items-center justify-start overflow-scroll whitespace-nowrap px-4 font-mono text-sm">
                    codex &quot;Help me turn this into a real product. Follow prompts/starter-to-product.md.&quot;
                  </div>
                  <div className="relative flex h-full shrink-0 items-center bg-neutral-200 pr-1.75">
                    <div className="absolute top-0 -left-4 h-14 w-4 bg-linear-to-l from-neutral-200 to-neutral-200/0" />
                    <CopyButton text='codex "Help me turn this into a real product. Follow prompts/starter-to-product.md."' />
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative z-10 -mt-0.25 rounded-b-lg border-x border-b border-neutral-200 bg-neutral-100 px-1 pb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 8" className="absolute -left-2 top-0 ml-0.25 -mt-0.25 size-2 -scale-y-100">
                <path fill="var(--color-neutral-100)" d="M8 8H0V6a6 6 0 0 0 6-6h2z" />
                <path fill="var(--color-neutral-200)" d="M7 0a7 7 0 0 1-7 7V6a6 6 0 0 0 6-6z" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 8" className="absolute -right-2 top-0 mr-0.25 -mt-0.25 size-2 -scale-x-100 -scale-y-100">
                <path fill="var(--color-neutral-100)" d="M8 8H0V6a6 6 0 0 0 6-6h2z" />
                <path fill="var(--color-neutral-200)" d="M7 0a7 7 0 0 1-7 7V6a6 6 0 0 0 6-6z" />
              </svg>
              <div className="relative grid w-full grid-cols-2 sm:w-auto">
                <div className="absolute left-0 top-0 h-full w-1/2 translate-x-full rounded-sm bg-[#3B3DD7] transition duration-400 ease-in-out group-has-checked:translate-x-0 group-has-checked:bg-[#C47152]" />
                <div className="relative flex h-9 items-center justify-center gap-2 px-4 text-sm font-medium text-neutral-500 transition duration-400 ease-in-out hover:text-neutral-950 group-has-checked:pointer-events-none group-has-checked:text-white">
                  <span className="hidden sm:inline">Customize with</span> Claude
                </div>
                <div className="relative flex h-9 items-center justify-center gap-2 px-4 text-sm font-medium text-white transition duration-400 ease-in-out group-has-checked:pointer-events-auto group-has-checked:text-neutral-500">
                  <span className="hidden sm:inline">Customize with</span> Codex
                </div>
                <input type="checkbox" name="customization-toggle" id="customization-toggle" defaultChecked className="absolute left-0 top-0 h-full w-full cursor-pointer opacity-0" />
              </div>
            </div>
          </div>

          <section className="mt-12 max-w-6xl">
            <div className="grid items-end gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
              <h2 className="shrink-0 text-3xl tracking-tight text-neutral-950 sm:text-5xl lg:col-span-2">
                Connected services
              </h2>
              <div className="sm:flex sm:justify-end">
                <p className="min-w-0 pb-0.5 text-balance text-lg/[120%] text-neutral-600 sm:min-w-96 lg:min-w-0">
                  Auth, payments, data, and hosting are already wired up for a pay-once unlock flow.
                </p>
              </div>
            </div>

            <ul className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <li className="relative">
                <div className="group relative flex h-full flex-col justify-between rounded-md border border-neutral-950/10 p-6 transition-all duration-200 ease-out hover:border-neutral-950/0 hover:bg-white hover:shadow-lg">
                  <div className="relative">
                    <img alt="" className="inline-block h-8 w-8 rounded-sm" src="/icons/clerk.svg" />
                    <div className="mb-1.5 mt-3 flex items-center gap-2">
                      <h3 className="text-lg font-medium text-neutral-950">Clerk</h3>
                      <StatusBadge label="Configured" tone="configured" />
                    </div>
                    <p className="mb-3 text-pretty text-neutral-600">
                      Clerk handles user authentication, sign-up, sign-in, and session management for your app.
                    </p>
                  </div>
                  <div className="font-medium text-neutral-500">
                    Logged in as {email ?? displayName}
                  </div>
                </div>
              </li>


              <li className="relative">
                <div className="group relative flex h-full flex-col justify-between rounded-md border border-neutral-950/10 p-6 transition-all duration-200 ease-out hover:border-neutral-950/0 hover:bg-white hover:shadow-lg">
                  <div className="relative">
                    <img alt="" className="inline-block h-8 w-8 rounded-sm" src="/icons/stripe.svg" />
                    <div className="mb-1.5 mt-3 flex items-center gap-2">
                      <h3 className="text-lg font-medium text-neutral-950">Stripe</h3>
                      <StatusBadge
                        label={checkoutConfigured || hasUnlockedAccess ? 'Configured' : 'Needs config'}
                        tone={checkoutConfigured || hasUnlockedAccess ? 'configured' : 'pending'}
                      />
                    </div>
                    <p className="mb-3 text-pretty text-neutral-600">
                      Stripe powers the one-time checkout that unlocks access to the signed-in workspace.
                    </p>
                  </div>
                  <div className="font-medium text-neutral-500">Access unlocked</div>
                </div>
              </li>

              <li className="relative sm:col-span-2 md:col-span-1">
                <DeployCard className="group relative flex h-full flex-col justify-between rounded-md border border-neutral-950/10 px-6 pb-4 pt-6 transition-all duration-200 ease-out hover:border-neutral-950/0 hover:bg-white hover:shadow-lg">
                  <div className="relative">
                    <img alt="" className="inline-block h-8 w-8 rounded-sm" src="/icons/vercel.svg" />
                    <div className="mb-1.5 mt-3 flex items-center gap-2">
                      <h3 className="text-lg font-medium text-neutral-950">Vercel</h3>
                      <StatusBadge label={hostingConfigured ? 'Configured' : 'Needs config'} tone={hostingConfigured ? 'configured' : 'pending'} />
                    </div>
                    <p className="mb-3 text-neutral-600">
                      Vercel is wired up as the hosting target for this starter.
                    </p>
                  </div>
                  <div className="relative h-10">
                    <DeployCommand label="Deploy to Vercel" />
                  </div>
                </DeployCard>
              </li>


              <li className="relative sm:col-span-2 md:col-span-3">
                {databaseDashboardUrl ? (
                  <a
                    className="group grid overflow-hidden rounded-md border border-neutral-950/10 transition-all duration-200 ease-out hover:border-neutral-950/0 hover:bg-white hover:shadow-lg md:grid-cols-2"
                    href={databaseDashboardUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="p-6">
                      <div className="relative">
                        <img alt="" className="inline-block h-8 w-8 rounded-sm" src="/icons/neon.svg" />
                        <div className="mb-1.5 mt-3 flex items-center gap-2">
                          <h3 className="text-lg font-medium text-neutral-950">Neon Postgres</h3>
                          <StatusBadge label={databaseConfigured ? 'Configured' : 'Needs config'} tone={databaseConfigured ? 'configured' : 'pending'} />
                        </div>
                        <p className="mb-3 text-balance text-neutral-600">
                          Neon Postgres stores users, purchases, and application data for your app.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        View on Neon
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 translate-y-0.25 transition-transform duration-200 group-hover:translate-x-0.5">
                          <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="min-h-64 pl-6 md:pl-0 md:pt-6">
                      <DatabaseStatusButton variant="inline" />
                    </div>
                  </a>
                ) : (
                  <div className="grid overflow-hidden rounded-md border border-neutral-950/10 md:grid-cols-2">
                    <div className="p-6">
                      <div className="relative">
                        <img alt="" className="inline-block h-8 w-8 rounded-sm" src="/icons/neon.svg" />
                        <div className="mb-1.5 mt-3 flex items-center gap-2">
                          <h3 className="text-lg font-medium text-neutral-950">Neon Postgres</h3>
                          <StatusBadge label={databaseConfigured ? 'Configured' : 'Needs config'} tone={databaseConfigured ? 'configured' : 'pending'} />
                        </div>
                        <p className="mb-3 text-balance text-neutral-600">
                          Neon Postgres stores users, purchases, and application data for your app.
                        </p>
                      </div>
                      <div className="text-sm text-neutral-500">No dashboard URL configured yet.</div>
                    </div>
                    <div className="min-h-64 pl-6 md:pl-0 md:pt-6">
                      <DatabaseStatusButton variant="inline" />
                    </div>
                  </div>
                )}
              </li>

            </ul>
          </section>
        </section>
      </div>
    </main>
  );
}
