import { randomUUID } from 'node:crypto';
import { ensureDatabaseSchema, getDatabaseClient } from '@/lib/db';

export type AppUser = {
  clerkUserId: string | null;
  createdAt: string;
  email: string | null;
  id: string;
  stripeCustomerId: string | null;
  updatedAt: string;
};

export type AppPurchase = {
  createdAt: string;
  id: string;
  status: string;
  stripeCheckoutSessionId: string;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string;
  updatedAt: string;
  userId: string | null;
};

function asRecord(value: unknown) {
  return (value ?? {}) as Record<string, unknown>;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function mapUser(row: unknown): AppUser {
  const record = asRecord(row);

  return {
    clerkUserId: asNullableString(record.clerk_user_id),
    createdAt: asString(record.created_at),
    email: asNullableString(record.email),
    id: asString(record.id),
    stripeCustomerId: asNullableString(record.stripe_customer_id),
    updatedAt: asString(record.updated_at),
  };
}

function mapPurchase(row: unknown): AppPurchase {
  const record = asRecord(row);

  return {
    createdAt: asString(record.created_at),
    id: asString(record.id),
    status: asString(record.status),
    stripeCheckoutSessionId: asString(record.stripe_checkout_session_id),
    stripeCustomerId: asNullableString(record.stripe_customer_id),
    stripePaymentIntentId: asString(record.stripe_payment_intent_id),
    updatedAt: asString(record.updated_at),
    userId: asNullableString(record.user_id),
  };
}

export async function findUserByID(id: string) {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  const rows = (await sql`
    select
      id,
      clerk_user_id,
      email,
      stripe_customer_id,
      created_at,
      updated_at
    from users
    where id = ${id}
    limit 1
  `) as Array<Record<string, unknown>>;

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserByClerkId(clerkUserId: string) {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  const rows = (await sql`
    select
      id,
      clerk_user_id,
      email,
      stripe_customer_id,
      created_at,
      updated_at
    from users
    where clerk_user_id = ${clerkUserId}
    limit 1
  `) as Array<Record<string, unknown>>;

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function upsertUserFromClerk({
  clerkUserId,
  email,
}: {
  clerkUserId: string;
  email: string | null;
}) {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  const existingRows = (await sql`
    select id
    from users
    where clerk_user_id = ${clerkUserId}
    limit 1
  `) as Array<Record<string, unknown>>;

  const userID =
    typeof existingRows[0]?.id === 'string' && existingRows[0].id
      ? existingRows[0].id
      : randomUUID();

  const rows = (await sql`
    insert into users (
      id,
      clerk_user_id,
      email
    )
    values (
      ${userID},
      ${clerkUserId},
      ${email}
    )
    on conflict (clerk_user_id)
    do update set
      email = excluded.email,
      updated_at = now()
    returning
      id,
      clerk_user_id,
      email,
      stripe_customer_id,
      created_at,
      updated_at
  `) as Array<Record<string, unknown>>;

  return mapUser(rows[0]);
}

export async function attachStripeCustomerToUser({
  stripeCustomerId,
  userId,
}: {
  stripeCustomerId: string;
  userId: string;
}) {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  await sql`
    update users
    set
      stripe_customer_id = ${stripeCustomerId},
      updated_at = now()
    where id = ${userId}
  `;
}

export async function findLatestPurchaseForUser(userId: string) {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  const rows = (await sql`
    select
      id,
      user_id,
      stripe_payment_intent_id,
      stripe_customer_id,
      stripe_checkout_session_id,
      status,
      created_at,
      updated_at
    from purchases
    where user_id = ${userId}
    order by updated_at desc, created_at desc
    limit 1
  `) as Array<Record<string, unknown>>;

  return rows[0] ? mapPurchase(rows[0]) : null;
}

/**
 * Atomically claim the right to send the welcome email for a purchase.
 *
 * Returns true for exactly one caller: the conditional update only matches
 * while welcome_email_sent_at is null, so concurrent callers (the Stripe
 * webhook and the success page) cannot both win. A false result means the email
 * was already sent or is being sent by another caller.
 */
export async function claimPurchaseWelcomeEmail(stripePaymentIntentId: string) {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  const rows = (await sql`
    update purchases
    set welcome_email_sent_at = now()
    where stripe_payment_intent_id = ${stripePaymentIntentId}
      and welcome_email_sent_at is null
    returning id
  `) as Array<Record<string, unknown>>;

  return rows.length > 0;
}

/**
 * Release a welcome-email claim by clearing the timestamp, so a later attempt
 * can retry. Called when the send fails after the claim was won.
 */
export async function releasePurchaseWelcomeEmailClaim(stripePaymentIntentId: string) {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  await sql`
    update purchases
    set welcome_email_sent_at = null
    where stripe_payment_intent_id = ${stripePaymentIntentId}
  `;
}

export async function upsertPurchaseFromCheckout({
  status,
  stripeCheckoutSessionId,
  stripeCustomerId,
  stripePaymentIntentId,
  userId,
}: {
  status: string;
  stripeCheckoutSessionId: string;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string;
  userId: string | null;
}) {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  const rows = (await sql`
    insert into purchases (
      id,
      user_id,
      stripe_payment_intent_id,
      stripe_customer_id,
      stripe_checkout_session_id,
      status
    )
    values (
      ${randomUUID()},
      ${userId},
      ${stripePaymentIntentId},
      ${stripeCustomerId},
      ${stripeCheckoutSessionId},
      ${status}
    )
    on conflict (stripe_payment_intent_id)
    do update set
      user_id = excluded.user_id,
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_checkout_session_id = excluded.stripe_checkout_session_id,
      status = excluded.status,
      updated_at = now()
    returning
      id,
      user_id,
      stripe_payment_intent_id,
      stripe_customer_id,
      stripe_checkout_session_id,
      status,
      created_at,
      updated_at
  `) as Array<Record<string, unknown>>;

  return mapPurchase(rows[0]);
}
