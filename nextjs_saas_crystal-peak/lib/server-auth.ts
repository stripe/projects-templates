import { clerkConfigured } from '@/lib/clerk-config';
import { auth, currentUser } from '@clerk/nextjs/server';

type SessionClaims = Record<string, unknown>;

function getStringClaim(claims: SessionClaims, key: string) {
  const value = claims[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export async function getServerAuthContext() {
  void clerkConfigured;
  const authState = await auth();
  const sessionClaims = (authState.sessionClaims ?? {}) as SessionClaims;
  const claimedUserId = getStringClaim(sessionClaims, 'sub');

  return {
    authState,
    email: getStringClaim(sessionClaims, 'email'),
    firstName: getStringClaim(sessionClaims, 'first_name'),
    fullName: getStringClaim(sessionClaims, 'full_name'),
    sessionClaims,
    userId: authState.userId ?? claimedUserId,
  };
}

export async function getServerCurrentUser() {
  void clerkConfigured;
  return currentUser();
}
