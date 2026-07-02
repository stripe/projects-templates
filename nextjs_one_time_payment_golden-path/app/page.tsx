import Link from 'next/link';
import { clerkConfigured } from '@/lib/clerk-config';
import { getServerAuthContext } from '@/lib/server-auth';
import { findLatestPurchaseForUser, findUserByClerkId } from '@/lib/data';
import { DatabaseStatusButton } from '@/components/database-status-button';
import { databaseConfigured } from '@/lib/database-config';
import { DeployCard, DeployCommand } from '@/components/deploy-command';
import { AppTopbar } from '@/components/app-topbar';
import { CopyButton } from '@/components/copy-button';
import { appConfig } from '@/lib/app-config';
import { twilioEmailConfigured } from '@/lib/twilio-config';

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'configured' | 'pending' | 'notIncluded';
}) {
  const style =
    tone === 'configured'
      ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-700'
      : tone === 'pending'
        ? 'bg-amber-500/10 border-amber-500/30 text-amber-700'
        : 'bg-neutral-200 border-neutral-300 text-neutral-500';
  const dot =
    tone === 'configured'
      ? 'bg-emerald-500 border-emerald-600'
      : tone === 'pending'
        ? 'bg-amber-500 border-amber-600'
        : 'bg-neutral-400 border-neutral-500';

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


export default async function HomePage() {
  const checkoutConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
  const hostingConfigured = Boolean(process.env.VERCEL === '1' || process.env.VERCEL_URL || process.env.VERCEL_PROJECT_URL || process.env.VERCEL_PROJECT_ID);
  const authContext = clerkConfigured ? await getServerAuthContext() : null;
  const signedIn = Boolean(authContext?.userId);
  let latestPurchaseStatus: string | null = null;

  if (databaseConfigured && authContext?.userId) {
    const user = await findUserByClerkId(authContext.userId);

    if (user) {
      const latestPurchase = await findLatestPurchaseForUser(user.id);
      latestPurchaseStatus = latestPurchase?.status ?? null;
    }
  }

  const hasUnlockedAccess = latestPurchaseStatus === 'paid';
  const databaseDashboardUrl = resolveDatabaseDashboardUrl();


  return (
    <main className="relative min-h-screen w-full">
      <AppTopbar />

      <section className="flex w-full flex-col items-center px-6 pb-15">
        <div className="relative flex w-full max-w-6xl flex-col items-center gap-14 pt-36 sm:gap-20 sm:pt-44">
          <div className="relative flex w-full flex-col items-center gap-4 text-center">
            <h1 className="max-w-lg text-balance text-4xl tracking-tight sm:text-6xl">
              Unlock the app once, then make it yours
            </h1>
            <p className="mb-3 max-w-112 text-xl text-neutral-600 sm:text-2xl">
              This starter uses a one-time purchase to unlock the signed-in workspace, with the same auth, data, and hosting wiring already in place.
            </p>

            <div className="group/customize relative flex w-full flex-col items-center">
              <div className="relative h-14 w-full max-w-128 rounded-lg border border-neutral-200 bg-neutral-100 p-1">
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
          </div>

          <div className="relative flex w-full flex-col items-start overflow-hidden rounded-xl border border-neutral-950/6 text-sm/[100%] text-neutral-600 shadow-xl">
            <div className="flex h-10 w-full items-center justify-between bg-neutral-50 px-3 font-medium">
              <div className="relative flex items-center gap-1">
                <div className="whitespace-nowrap">Site map</div>
              </div>
              <div className="hidden items-center sm:flex">
                <div className="rounded-sm border border-neutral-950/10 bg-neutral-200 px-1.5 py-1.25 font-mono text-[0.625rem]/[100%] uppercase text-neutral-600">
                  System overview
                </div>
              </div>
            </div>
            <div className="relative h-full w-full pb-1 sm:px-2 sm:pb-2">
              <div className="relative h-full w-full border-t border-neutral-950/6 bg-white/25 sm:rounded-md sm:border-x sm:border-b sm:shadow-xl">
                <div className="relative flex h-full w-full flex-col overflow-hidden">
                  <div className="px-4 pb-4 pt-4 text-2xl tracking-tight text-neutral-950 sm:pb-6 sm:pt-6 sm:text-3xl">
                    What's included:
                  </div>
                  <div className="overflow-x-auto px-4 pb-4">
                    <div className="w-full min-w-3xl overflow-hidden rounded-md border border-neutral-950/6 text-sm sm:min-w-4xl sm:text-base">
                      <div className="grid h-10 grid-cols-[1fr_1fr_0.75fr_1fr] border-b border-neutral-950/6 bg-neutral-950/2 *:flex *:items-center *:border-r *:border-neutral-950/6 *:px-3 *:font-medium sm:h-12 sm:grid-cols-[1fr_1fr_1fr_1fr]">
                        <div>Page</div>
                        <div>Purpose</div>
                        <div>Path</div>
                        <div className="border-r-0!">Powered by</div>
                      </div>
                      {[
                        { label: 'Home', path: '/', description: 'Market your app', services: [{ label: 'Tailwind', icon: '/icons/tailwind.svg' }, { label: 'Next.js', icon: '/icons/nextjs.svg' }] },
                        { label: 'Dashboard', path: '/dashboard', description: 'Unlocked workspace', services: [{ label: "Neon Postgres", icon: "/icons/neon.svg" }] },
                        { label: 'Sign Up', path: '/sign-up', description: 'Create an account', services: [{ label: 'Clerk', icon: '/icons/clerk.svg' }] },
                        { label: 'Sign In', path: '/sign-in', description: 'Log into your account', services: [{ label: 'Clerk', icon: '/icons/clerk.svg' }] },
                        { label: 'Checkout', path: '/checkout', description: 'Unlock the app', services: [{ label: 'Stripe', icon: '/icons/stripe.svg' }] },
                        { label: 'Success', path: '/success', description: 'Access unlocked', services: [{ label: 'Stripe', icon: '/icons/stripe.svg' }] },
                        { label: 'Cancel', path: '/cancel', description: 'Purchase canceled', services: [{ label: 'Stripe', icon: '/icons/stripe.svg' }] },
                        { label: 'Health', path: '/api/health', description: 'System status check', services: [{ label: "Vercel", icon: "/icons/vercel.svg" }] },
                      ].map((page) => (
                        <Link
                          key={page.path}
                          href={page.path}
                          className="group grid grid-cols-[1fr_1fr_0.75fr_1fr] border-b border-neutral-950/6 transition-colors duration-150 last:border-b-0 hover:bg-neutral-950/2 sm:grid-cols-[1fr_1fr_1fr_1fr]"
                        >
                          <div className="flex items-center justify-between border-r border-neutral-950/6 px-3 py-2.5 text-neutral-950">
                            <span className="font-medium">{page.label}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 -translate-x-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                              <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex items-center border-r border-neutral-950/6 px-3 py-2.5 text-neutral-500">
                            {page.description}
                          </div>
                          <div className="flex items-center justify-between border-r border-neutral-950/6 px-3 py-2.5 text-neutral-500">
                            <span>{page.path}</span>
                          </div>
                          <div className="flex items-center gap-2.5 px-3 py-2.5">
                            <div className="flex items-center">
                              {page.services.map((service, index) => (
                                <img
                                  key={service.label}
                                  alt=""
                                  className={`inline-block h-5 w-5 rounded-full ring-2 ring-white ${index > 0 ? '-ml-0.75' : ''}`}
                                  src={service.icon}
                                />
                              ))}
                            </div>
                            <span className="font-medium text-neutral-950">
                              {page.services.map((service) => service.label).join(', ')}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex w-full flex-col items-center px-6 pb-32 pt-7 sm:pt-15">
        <div className="relative flex w-full max-w-6xl flex-col items-center gap-8 sm:gap-14">
          <div className="grid items-end justify-center gap-4 text-center sm:grid-cols-2 sm:justify-start sm:text-left lg:grid-cols-3">
            <h2 className="shrink-0 text-3xl tracking-tight text-neutral-950 sm:text-5xl lg:col-span-2">
              Connected services
            </h2>
            <div className="sm:flex sm:justify-end">
              <p className="min-w-0 pb-0.5 text-balance text-lg/[120%] text-neutral-600 sm:min-w-96 lg:min-w-0">
                Auth, payments, data, and hosting are already wired up for a pay-once unlock flow.
              </p>
            </div>
          </div>

          <ul className="relative grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <li className="relative">
              <Link href={signedIn ? '/dashboard' : '/sign-in?redirect_to=/dashboard'} className="group relative flex h-full flex-col justify-between rounded-md border border-neutral-950/10 p-6 transition-all duration-200 ease-out hover:border-neutral-950/0 hover:bg-white hover:shadow-lg">
                <div className="relative">
                  <img alt="" className="inline-block h-8 w-8 rounded-sm" src="/icons/clerk.svg" />
                  <div className="mb-1.5 mt-3 flex items-center gap-2">
                    <h3 className="text-lg font-medium text-neutral-950">Clerk</h3>
                    <StatusBadge label={clerkConfigured ? 'Configured' : 'Needs config'} tone={clerkConfigured ? 'configured' : 'pending'} />
                  </div>
                  <p className="mb-3 text-pretty text-neutral-600">
                    Clerk handles user authentication, sign-up, sign-in, and session management for your app.
                  </p>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  {signedIn ? 'Open dashboard' : 'Sign up / sign in'}
                </div>
              </Link>
            </li>

            <li className="relative">
              <Link href={hasUnlockedAccess ? '/dashboard' : checkoutConfigured ? '/checkout' : '/api/health'} className="group relative flex h-full flex-col justify-between rounded-md border border-neutral-950/10 p-6 transition-all duration-200 ease-out hover:border-neutral-950/0 hover:bg-white hover:shadow-lg">
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
                <div className="flex items-center gap-1 font-medium">
                  {hasUnlockedAccess ? 'Access unlocked' : 'Unlock access'}
                </div>
              </Link>
            </li>

            <li className="relative">
              {twilioEmailConfigured ? (
                <a
                  href="https://1console.twilio.com"
                  rel="noreferrer"
                  target="_blank"
                  className="group relative flex h-full flex-col justify-between rounded-md border border-neutral-950/10 p-6 transition-all duration-200 ease-out hover:border-neutral-950/0 hover:bg-white hover:shadow-lg"
                >
                  <div className="relative">
                    <img alt="" className="inline-block h-8 w-8 rounded-sm" src="/icons/twilio.svg" />
                    <div className="mb-1.5 mt-3 flex items-center gap-2">
                      <h3 className="text-lg font-medium text-neutral-950">Twilio Email</h3>
                      <StatusBadge label="Configured" tone="configured" />
                    </div>
                    <p className="mb-3 text-pretty text-neutral-600">
                      Twilio sends the welcome email that greets buyers the moment their one-time purchase unlocks access.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    Open Twilio Console
                  </div>
                </a>
              ) : (
                <div className="relative flex h-full flex-col rounded-md border border-neutral-950/10 p-6">
                  <div className="relative">
                    <img alt="" className="inline-block h-8 w-8 rounded-sm" src="/icons/twilio.svg" />
                    <div className="mb-1.5 mt-3 flex items-center gap-2">
                      <h3 className="text-lg font-medium text-neutral-950">Twilio Email</h3>
                      <StatusBadge label="Needs config" tone="pending" />
                    </div>
                    <p className="mb-3 text-pretty text-neutral-600">
                      Twilio sends the post-purchase welcome email. Finish setup to turn it on:
                    </p>
                  </div>
                  <ol className="flex flex-col gap-2 text-sm text-neutral-600">
                    <li className="flex gap-2">
                      <span className="font-mono text-xs text-neutral-400">1.</span>
                      <span>
                        Sign in at{' '}
                        <a href="https://1console.twilio.com" rel="noreferrer" target="_blank" className="font-medium text-neutral-950 underline underline-offset-2">
                          1console.twilio.com
                        </a>{' '}
                        and add a verified sending domain.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-mono text-xs text-neutral-400">2.</span>
                      <span>
                        Add the sender address to your env as{' '}
                        <code className="rounded bg-neutral-950/5 px-1 py-0.5 font-mono text-xs text-neutral-950">TWILIO_EMAIL_FROM_ADDRESS</code>
                        {' '}(and optionally{' '}
                        <code className="rounded bg-neutral-950/5 px-1 py-0.5 font-mono text-xs text-neutral-950">TWILIO_EMAIL_FROM_NAME</code>).
                      </span>
                    </li>
                  </ol>
                </div>
              )}
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
                  <DeployCommand />
                </div>
              </DeployCard>
            </li>


            <li className="relative sm:col-span-2 md:col-span-2">
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
        </div>
      </section>
    </main>
  );
}
