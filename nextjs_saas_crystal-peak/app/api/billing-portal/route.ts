import { NextResponse } from 'next/server';
import { clerkConfigured } from '@/lib/clerk-config';
import { databaseConfigured } from '@/lib/database-config';
import { findUserByClerkId, upsertUserFromClerk } from '@/lib/data';
import { getServerAuthContext, getServerCurrentUser } from '@/lib/server-auth';

import { getStripeClient } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    if (!clerkConfigured) {
      throw new Error('Clerk is not configured yet.');
    }

    const authContext = await getServerAuthContext();
    if (!authContext.userId) {
      return NextResponse.json({ error: 'Sign in is required before opening the Stripe customer portal.' }, { status: 401 });
    }

    if (!databaseConfigured) {
      return NextResponse.json(
        { error: 'The starter database is not configured yet, so there is no linked Stripe customer to manage.' },
        { status: 400 },
      );
    }

    let user = await findUserByClerkId(authContext.userId);
    if (!user) {
      const clerkUser = await getServerCurrentUser();
      user = await upsertUserFromClerk({
        clerkUserId: authContext.userId,
        email: clerkUser?.primaryEmailAddress?.emailAddress ?? authContext.email,
      });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No linked Stripe customer was found for this account yet. Complete checkout first.' },
        { status: 400 },
      );
    }

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: origin + '/dashboard',
    });

    if (!session.url) {
      throw new Error('Stripe billing portal did not return a redirect URL.');
    }

    return NextResponse.json({ url: session.url });

  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to launch the Stripe customer portal.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
