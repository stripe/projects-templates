import Link from 'next/link';
import { appConfig } from '@/lib/app-config';
import { databaseConfigured } from '@/lib/database-config';
import { syncSubscriptionFromCheckoutSessionID } from '@/lib/subscription-sync';
import { sendWelcomeEmailForSubscriptionOnce } from '@/lib/twilio-email';
import {
  bodyCopy,
  buttonRow,
  centeredPageShell,
  heroPanel,
  primaryButton,
  secondaryButton,
} from '@/lib/ui';

type SuccessPageProps = {
  searchParams?: Promise<{
    session_id?: string | string[];
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionID =
    typeof resolvedSearchParams?.session_id === 'string'
      ? resolvedSearchParams.session_id
      : null;

  let subscriptionMessage: string | null = null;

  if (databaseConfigured && sessionID) {
    try {
      const result = await syncSubscriptionFromCheckoutSessionID(sessionID);

      if (result?.userId) {
        subscriptionMessage =
          'This checkout was linked to the signed-in user in your starter database.';
      } else if (result) {
        subscriptionMessage =
          'This checkout completed, but there was no signed-in user to attach in your starter database.';
      }

      if (
        (result?.status === 'active' || result?.status === 'trialing') &&
        result.email
      ) {
        await sendWelcomeEmailForSubscriptionOnce({
          stripeSubscriptionId: result.stripeSubscriptionId,
          to: result.email,
          productName: appConfig.name,
        });
      }
    } catch (error) {
      subscriptionMessage =
        error instanceof Error
          ? error.message
          : 'Unable to sync the starter subscription record from this checkout session.';
    }
  }

  return (
    <main className={centeredPageShell}>
      <section className={`${heroPanel} w-full`}>
        <h1 className="mb-3 text-3xl font-bold tracking-[-0.03em] text-slate-950">
          Subscription started
        </h1>
        <p className={bodyCopy}>
          Your starter checkout flow is live. You can now replace the placeholder plan details with
          your own product copy and billing configuration.
        </p>
        {subscriptionMessage ? (
          <p className={`${bodyCopy} mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3`}>
            {subscriptionMessage}
          </p>
        ) : null}
        <div className={`${buttonRow} mt-6`}>
          <Link className={`${primaryButton} max-sm:w-full`} href="/">
            Return home
          </Link>
          <Link className={`${secondaryButton} max-sm:w-full`} href="/checkout">
            Visit checkout
          </Link>
        </div>
      </section>
    </main>
  );
}
