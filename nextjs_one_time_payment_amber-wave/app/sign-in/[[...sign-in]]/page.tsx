import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { clerkConfigured } from '@/lib/clerk-config';
import { bodyCopy, buttonRow, centeredPageShell, heroPanel, primaryButton } from '@/lib/ui';

type SignInPageProps = {
  searchParams?: Promise<{
    redirect_to?: string | string[];
  }>;
};

function resolveRedirectTarget(value: string | string[] | undefined) {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return '/dashboard';
  }

  return value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (!clerkConfigured) {
    return (
      <main className={centeredPageShell}>
        <section className={`${heroPanel} w-full`}>
          <h1 className="mb-3 text-3xl font-bold tracking-[-0.03em] text-neutral-950">
            Authentication is not configured yet
          </h1>
          <p className={bodyCopy}>
            Provision Clerk with Stripe Projects, then pull your env vars into this project.
          </p>
          <div className={`${buttonRow} mt-6`}>
            <Link className={`${primaryButton} max-sm:w-full`} href="/">
              Return home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTarget = resolveRedirectTarget(resolvedSearchParams?.redirect_to);

  return (
    <main className="relative min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <section className="w-full max-w-md">
          <SignIn
            fallbackRedirectUrl={redirectTarget}
            forceRedirectUrl={redirectTarget}
            signUpFallbackRedirectUrl={redirectTarget}
            signUpForceRedirectUrl={redirectTarget}
            signUpUrl={`/sign-up?redirect_to=${encodeURIComponent(redirectTarget)}`}
          />
        </section>
      </div>
    </main>
  );
}
