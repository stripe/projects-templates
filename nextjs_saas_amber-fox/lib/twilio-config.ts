import { appConfig } from '@/lib/app-config';

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return '';
}

export const twilioAccountSid = firstNonEmpty(process.env.TWILIO_ACCOUNT_SID);
export const twilioOAuthClientId = firstNonEmpty(process.env.TWILIO_OAUTH_CLIENT_ID);
export const twilioOAuthClientSecret = firstNonEmpty(process.env.TWILIO_OAUTH_CLIENT_SECRET);

export const twilioEmailFromAddress = firstNonEmpty(process.env.TWILIO_EMAIL_FROM_ADDRESS);
export const twilioEmailFromName = firstNonEmpty(
  process.env.TWILIO_EMAIL_FROM_NAME,
  appConfig.name,
);

export const twilioEmailConfigured = Boolean(
  twilioOAuthClientId && twilioOAuthClientSecret && twilioEmailFromAddress,
);
