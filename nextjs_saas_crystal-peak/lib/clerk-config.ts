type ClerkEnvironmentPayload = {
  development?: {
    publishable_key?: string;
    secret_key?: string;
  };
  production?: {
    publishable_key?: string;
    secret_key?: string;
  };
};

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return '';
}

function parseClerkEnvironments(): ClerkEnvironmentPayload | null {
  const rawValue = process.env.CLERK_ENVIRONMENTS;
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as ClerkEnvironmentPayload;
  } catch {
    return null;
  }
}

const parsedEnvironments = parseClerkEnvironments();
const derivedEnvironment =
  parsedEnvironments?.development ??
  parsedEnvironments?.production ??
  null;

export const clerkPublishableKey = firstNonEmpty(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  derivedEnvironment?.publishable_key,
);

export const clerkSecretKey = firstNonEmpty(
  process.env.CLERK_SECRET_KEY,
  derivedEnvironment?.secret_key,
);

if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && clerkPublishableKey) {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = clerkPublishableKey;
}

if (!process.env.CLERK_SECRET_KEY && clerkSecretKey) {
  process.env.CLERK_SECRET_KEY = clerkSecretKey;
}

if (!process.env.CLERK_ENCRYPTION_KEY && clerkSecretKey) {
  process.env.CLERK_ENCRYPTION_KEY = clerkSecretKey;
}

export const clerkConfigured = Boolean(clerkPublishableKey && clerkSecretKey);
