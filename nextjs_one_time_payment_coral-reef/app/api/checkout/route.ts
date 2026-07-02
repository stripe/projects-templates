import { NextResponse } from 'next/server';

import { upsertUserFromClerk } from '@/lib/data';
import { databaseConfigured } from '@/lib/database-config';
import { getServerAuthContext, getServerCurrentUser } from '@/lib/server-auth';
import { trackEvent } from '@/lib/mixpanel-server';

import { getStripeClient } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const priceId = process.env.STRIPE_PRICE_ID;

    const authContext = await getServerAuthContext();

    if (!authContext.userId) {
      return NextResponse.json(
        { error: 'Sign in is required before starting this checkout.' },
        { status: 401 },
      );
    }


    let appUserId: string | null = null;
    let clerkUserId: string | null = authContext.userId;
    let customerEmail: string | null = null;

    if (clerkUserId) {
      const clerkUser = await getServerCurrentUser();
      const resolvedEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? authContext.email;
      if (databaseConfigured) {
        const record = await upsertUserFromClerk({
          clerkUserId,
          email: resolvedEmail,
        });

        appUserId = record.id;
        customerEmail = record.email;
      } else {
        customerEmail = resolvedEmail;
      }
    }


    if (!priceId) {
      throw new Error('Missing STRIPE_PRICE_ID. Run `npm run setup:stripe` and add the generated values to your deployment environment.');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_creation: 'always',
      success_url: origin + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/cancel',
      ...(clerkUserId ? { client_reference_id: appUserId ?? clerkUserId } : {}),
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      ...(clerkUserId || appUserId
        ? {
            metadata: {
              ...(clerkUserId ? { clerk_user_id: clerkUserId } : {}),
              ...(appUserId ? { app_user_id: appUserId } : {}),
            },
          }
        : {}),

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout session did not return a redirect URL.' }, { status: 500 });
    }

    const distinctId =
      request.headers.get('x-mixpanel-distinct-id') ?? appUserId ?? clerkUserId ?? undefined;
    if (distinctId) {
      trackEvent(distinctId, 'checkout_session_created', {
        stripe_session_id: session.id,
        stripe_price_id: priceId,
        customer_email: customerEmail,
        mode: 'payment',
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create a checkout session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
