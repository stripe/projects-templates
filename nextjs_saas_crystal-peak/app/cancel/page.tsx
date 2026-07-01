import Link from 'next/link';
import {
  bodyCopy,
  buttonRow,
  centeredPageShell,
  heroPanel,
  primaryButton,
  secondaryButton,
} from '@/lib/ui';

export default function CancelPage() {
  return (
    <main className={centeredPageShell}>
      <section className={`${heroPanel} w-full`}>
        <h1 className="mb-3 text-3xl font-bold tracking-[-0.03em] text-neutral-950">
          Checkout canceled
        </h1>
        <p className={bodyCopy}>
          The customer can return here if they back out of checkout. This keeps the first slice
          real without inventing a fake business.
        </p>
        <div className={`${buttonRow} mt-6`}>
          <Link className={`${primaryButton} max-sm:w-full`} href="/dashboard">
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
