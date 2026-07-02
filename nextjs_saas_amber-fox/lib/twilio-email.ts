import {
  twilioEmailConfigured,
  twilioEmailFromAddress,
  twilioEmailFromName,
  twilioOAuthClientId,
  twilioOAuthClientSecret,
} from '@/lib/twilio-config';
import { databaseConfigured } from '@/lib/database-config';
import {
  claimSubscriptionWelcomeEmail,
  releaseSubscriptionWelcomeEmailClaim,
} from '@/lib/data';

const TWILIO_TOKEN_URL = 'https://oauth.twilio.com/v2/token';
const TWILIO_EMAIL_URL = 'https://comms.twilio.com/v1/Emails';

const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 60_000;

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

/**
 * Exchange the injected OAuth client credentials for a short-lived Twilio access
 * token, caching it until shortly before it expires so we do not re-exchange on
 * every send.
 */
async function getTwilioAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const response = await fetch(TWILIO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: twilioOAuthClientId,
      client_secret: twilioOAuthClientSecret,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Twilio token exchange failed with status ${response.status}. ${detail}`.trim(),
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new Error('Twilio token exchange did not return an access token.');
  }

  const expiresInMs = (payload.expires_in ?? 3600) * 1000;
  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + expiresInMs - TOKEN_EXPIRY_SAFETY_MARGIN_MS,
  };

  return cachedToken.accessToken;
}

function buildWelcomeEmailContent(productName: string) {
  const subject = `Welcome to ${productName} — your subscription is active`;

  const text = [
    `Thanks for subscribing to ${productName}!`,
    '',
    'Your subscription is now active and your workspace is ready.',
    'Sign in any time to pick up where you left off.',
    '',
    `— The ${productName} team`,
  ].join('\n');

  const html = [
    '<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">',
    `<h1 style="font-size: 22px; margin: 0 0 12px;">Welcome to ${productName}</h1>`,
    `<p style="margin: 0 0 12px;">Thanks for subscribing! Your subscription is now active and your workspace is ready.</p>`,
    `<p style="margin: 0 0 12px;">Sign in any time to pick up where you left off.</p>`,
    `<p style="margin: 24px 0 0; color: #64748b;">— The ${productName} team</p>`,
    '</div>',
  ].join('');

  return { subject, text, html };
}

/**
 * Send a "thank you for subscribing / access granted" welcome email after a
 * subscription starts.
 */
export async function sendSubscriptionWelcomeEmail({
  to,
  productName,
}: {
  to: string | null | undefined;
  productName: string;
}): Promise<boolean> {
  if (!twilioEmailConfigured) {
    console.warn('Skipping subscription welcome email: Twilio email is not configured.');
    return false;
  }

  if (!to) {
    console.warn('Skipping subscription welcome email: no recipient email address.');
    return false;
  }

  try {
    const accessToken = await getTwilioAccessToken();
    const { subject, text, html } = buildWelcomeEmailContent(productName);

    const response = await fetch(TWILIO_EMAIL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { address: twilioEmailFromAddress, name: twilioEmailFromName },
        to: [{ address: to }],
        content: { subject, html, text },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Twilio email send failed with status ${response.status}. ${detail}`.trim(),
      );
    }

    return true;
  } catch (error) {
    console.error('Failed to send subscription welcome email via Twilio:', error);
    return false;
  }
}

/**
 * Send the subscription welcome email exactly once, even though both the Stripe
 * webhook and the success page call this for the same subscription (and may race).
 */
export async function sendWelcomeEmailForSubscriptionOnce({
  stripeSubscriptionId,
  to,
  productName,
}: {
  stripeSubscriptionId: string | null | undefined;
  to: string | null | undefined;
  productName: string;
}): Promise<boolean> {
  if (!twilioEmailConfigured || !to) {
    return sendSubscriptionWelcomeEmail({ to, productName });
  }

  if (!databaseConfigured || !stripeSubscriptionId) {
    return sendSubscriptionWelcomeEmail({ to, productName });
  }

  let claimed = false;
  try {
    claimed = await claimSubscriptionWelcomeEmail(stripeSubscriptionId);
  } catch (error) {
    console.error('Failed to claim subscription welcome email; skipping send:', error);
    return false;
  }

  if (!claimed) {
    // Another caller already sent (or is sending) this welcome email.
    return false;
  }

  const sent = await sendSubscriptionWelcomeEmail({ to, productName });

  if (!sent) {
    try {
      await releaseSubscriptionWelcomeEmailClaim(stripeSubscriptionId);
    } catch (error) {
      console.error('Failed to release welcome email claim after send failure:', error);
    }
  }

  return sent;
}
