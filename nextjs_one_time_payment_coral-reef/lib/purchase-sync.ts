import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import {
  attachStripeCustomerToUser,
  findUserByClerkId,
  findUserByID,
  upsertPurchaseFromCheckout,
  upsertUserFromClerk,
} from '@/lib/data';

type SyncPurchaseResult = {
  status: string;
  stripePaymentIntentId: string;
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

export async function syncPurchaseFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<SyncPurchaseResult | null> {
  if (session.mode !== 'payment') {
    return null;
  }

  const stripePaymentIntentID = asStripeID(session.payment_intent);
  if (!stripePaymentIntentID) {
    return null;
  }

  const stripeCustomerID = asStripeID(session.customer);
  const userID = await resolveUserIDForSession(session);

  const purchase = await upsertPurchaseFromCheckout({
    status: session.payment_status ?? 'unpaid',
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: stripeCustomerID,
    stripePaymentIntentId: stripePaymentIntentID,
    userId: userID,
  });

  if (userID && stripeCustomerID) {
    await attachStripeCustomerToUser({
      stripeCustomerId: stripeCustomerID,
      userId: userID,
    });
  }

  return {
    status: purchase.status,
    stripePaymentIntentId: purchase.stripePaymentIntentId,
    userId: purchase.userId,
  };
}

export async function syncPurchaseFromCheckoutSessionID(sessionID: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionID, {
    expand: ['customer', 'payment_intent'],
  });

  return syncPurchaseFromCheckoutSession(session);
}
