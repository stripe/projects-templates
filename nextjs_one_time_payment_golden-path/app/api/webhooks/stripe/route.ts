import type Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { syncPurchaseFromCheckoutSession } from '@/lib/purchase-sync';
import { getPostHogClient } from '@/lib/posthog-server';
import { sendWelcomeEmailForPurchaseOnce } from '@/lib/twilio-email';
import { appConfig } from '@/lib/app-config';

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error(
        'Missing STRIPE_WEBHOOK_SECRET. Add a Stripe webhook signing secret to your environment before using the Stripe webhook route.',
      );
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe-Signature header.' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const payload = await request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to verify the Stripe webhook signature.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const result = await syncPurchaseFromCheckoutSession(
        event.data.object as Stripe.Checkout.Session,
      );

      if (result?.userId) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: result.userId,
          event: 'purchase_completed',
          properties: {
            stripe_payment_intent_id: result.stripePaymentIntentId,
            status: result.status,
          },
        });
        await posthog.flush();
      }

      if (result?.status === 'paid' && result.email) {
        await sendWelcomeEmailForPurchaseOnce({
          stripePaymentIntentId: result.stripePaymentIntentId,
          to: result.email,
          productName: appConfig.name,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process the Stripe webhook.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
