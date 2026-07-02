import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import {
  attachStripeCustomerToUser,
  findUserByClerkId,
  findUserByID,
  upsertSubscriptionFromCheckout,
  upsertUserFromClerk,
} from '@/lib/data';

type SyncSubscriptionResult = {
  email: string | null;
  status: string;
  stripeSubscriptionId: string;
  userId: string | null;
};

function asStripeID<T extends { id: string }>(value: string | T | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.id;
}

function getSessionEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email ?? session.customer_email ?? null;
}

function getSubscriptionStatus(session: Stripe.Checkout.Session) {
  if (session.subscription && typeof session.subscription !== 'string') {
    return session.subscription.status;
  }

  return 'active';
}

async function resolveUserIDForSession(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const appUserID = metadata.app_user_id?.trim() || null;
  const clerkUserID = metadata.clerk_user_id?.trim() || null;
  const email = getSessionEmail(session);

  if (appUserID) {
    const existingUser = await findUserByID(appUserID);
    if (existingUser) {
      return existingUser.id;
    }
  }

  if (clerkUserID) {
    const existingUser = await findUserByClerkId(clerkUserID);
    if (existingUser) {
      return existingUser.id;
    }

    const user = await upsertUserFromClerk({
      clerkUserId: clerkUserID,
      email,
    });

    return user.id;
  }

  return null;
}

export async function syncSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<SyncSubscriptionResult | null> {
  if (session.mode !== 'subscription') {
    return null;
  }

  const stripeSubscriptionID = asStripeID(session.subscription);
  if (!stripeSubscriptionID) {
    return null;
  }

  const stripeCustomerID = asStripeID(session.customer);
  const email = getSessionEmail(session);
  const userID = await resolveUserIDForSession(session);

  const subscription = await upsertSubscriptionFromCheckout({
    status: getSubscriptionStatus(session),
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: stripeCustomerID,
    stripeSubscriptionId: stripeSubscriptionID,
    userId: userID,
  });

  if (userID && stripeCustomerID) {
    await attachStripeCustomerToUser({
      stripeCustomerId: stripeCustomerID,
      userId: userID,
    });
  }

  return {
    email,
    status: subscription.status,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    userId: subscription.userId,
  };
}

export async function syncSubscriptionFromCheckoutSessionID(sessionID: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionID, {
    expand: ['customer', 'subscription'],
  });

  return syncSubscriptionFromCheckoutSession(session);
}
