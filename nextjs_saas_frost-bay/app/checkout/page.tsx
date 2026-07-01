import Link from 'next/link';
import { CheckoutButton } from '@/components/checkout-button';
import { getServerAuthContext } from '@/lib/server-auth';
import { primaryButton } from '@/lib/ui';


function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-neutral-900" fill="none" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

const features = [
  'Unlimited access to all features',
  'Priority customer support',
  'Advanced analytics dashboard',
  'Team collaboration tools',
  'Custom integrations',
];

export default async function CheckoutPage() {
  const authContext = await getServerAuthContext();
  return (
    <main className="relative min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-4 pb-12 pt-12">
        <div className="w-full rounded-2xl border border-white/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Subscription
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            Next.js SaaS Render Netlify Starter
          </h1>

          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight text-neutral-950">
              $10.00
            </span>
            <span className="text-base text-neutral-500">/ month</span>
          </div>

          <hr className="my-6 border-neutral-200/60" />

          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-neutral-700">
                <CheckIcon />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {authContext.userId ? (
              <CheckoutButton label={`Subscribe \u2014 $10.00 / month`} />
            ) : (
              <Link className={`${primaryButton} w-full`} href="/sign-in?redirect_to=/checkout">
                Sign in to continue
              </Link>
            )}
          </div>
        </div>

        <Link
          className="mt-6 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
          href="/dashboard"
        >
          &larr; Back to dashboard
        </Link>
      </div>
    </main>
  );
}
