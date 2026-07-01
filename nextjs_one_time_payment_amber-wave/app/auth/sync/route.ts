import { NextResponse } from 'next/server';
import { databaseConfigured } from '@/lib/database-config';
import { upsertUserFromClerk } from '@/lib/data';
import { identifyUser, trackEvent } from '@/lib/mixpanel-server';

import { getServerAuthContext, getServerCurrentUser } from '@/lib/server-auth';

function resolveRedirectTarget(request: Request) {
  const currentURL = new URL(request.url);
  const redirectTarget = currentURL.searchParams.get('redirect_to');

  if (!redirectTarget || !redirectTarget.startsWith('/')) {
    return new URL('/', currentURL);
  }

  return new URL(redirectTarget, currentURL);
}

function buildSignInURL(request: Request) {
  const currentURL = new URL(request.url);
  const redirectTarget = resolveRedirectTarget(request);
  const signInURL = new URL('/sign-in', currentURL);
  signInURL.searchParams.set('redirect_to', redirectTarget.pathname + redirectTarget.search);
  return signInURL;
}

async function syncSignedInUser() {
  const authContext = await getServerAuthContext();
  const user = await getServerCurrentUser();

  if (!authContext.userId) {
    return {
      signedIn: false as const,
      synced: false as const,
    };
  }

  if (!databaseConfigured) {
    return {
      signedIn: true as const,
      synced: false as const,
    };
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? authContext.email;
  const record = await upsertUserFromClerk({
    clerkUserId: authContext.userId,
    email,
  });

  const isNewUser = record.createdAt === record.updatedAt;
  identifyUser(record.id, {
    clerk_user_id: record.clerkUserId,
    email: record.email,
  });
  if (isNewUser) {
    trackEvent(record.id, 'user_signed_up', {
      clerk_user_id: record.clerkUserId,
      email: record.email,
    });
  }

  return {
    signedIn: true as const,
    synced: true as const,
    userId: record.id,
  };
}

export async function GET(request: Request) {
  let result:
    | {
        signedIn: boolean;
        synced: boolean;
        userId?: string;
      }
    | undefined;

  try {
    result = await syncSignedInUser();
  } catch {
    // Keep auth completion best-effort so users can still land in the app.
  }

  if (!result?.signedIn) {
    return NextResponse.redirect(buildSignInURL(request));
  }

  return NextResponse.redirect(resolveRedirectTarget(request));
}

export async function POST() {
  try {
    const result = await syncSignedInUser();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sync the signed-in user.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
