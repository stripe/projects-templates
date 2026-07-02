import Link from 'next/link';
import { databaseConfigured } from '@/lib/database-config';
import { syncPurchaseFromCheckoutSessionID } from '@/lib/purchase-sync';
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

  let purchaseMessage: string | null = null;

  if (databaseConfigured && sessionID) {
    try {
      const result = await syncPurchaseFromCheckoutSessionID(sessionID);

      if (result?.status === 'paid' && result.userId) {
        purchaseMessage =
          'This checkout was linked to the signed-in user in your starter database, and access is now unlocked.';
      } else if (result?.status === 'paid') {
        purchaseMessage =
          'This checkout completed, but there was no signed-in user to attach in your starter database.';
      }
    } catch (error) {
      purchaseMessage =
        error instanceof Error
          ? error.message
          : 'Unable to sync the starter purchase record from this checkout session.';
    }
  }

  return (
    <main className={centeredPageShell}>
      <section className={`${heroPanel} w-full`}>
        <h1 className="mb-3 text-3xl font-bold tracking-[-0.03em] text-slate-950">
          Access unlocked
        </h1>
        <p className={bodyCopy}>
          Your starter checkout flow is live. You can now replace the placeholder purchase gate with
          your own product behavior and offer framing.
        </p>
        {purchaseMessage ? (
          <p className={`${bodyCopy} mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3`}>
            {purchaseMessage}
          </p>
        ) : null}
        <div className={`${buttonRow} mt-6`}>
          <Link className={`${primaryButton} max-sm:w-full`} href="/dashboard">
            Open dashboard
          </Link>
          <Link className={`${secondaryButton} max-sm:w-full`} href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
