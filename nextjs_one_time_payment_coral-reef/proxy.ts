import { NextResponse } from 'next/server';
import { clerkConfigured } from '@/lib/clerk-config';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/checkout(.*)',
]);

const middleware = clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : function unconfiguredClerkMiddleware() {
      return NextResponse.next();
    };

export default middleware;

export const config = {
  matcher: ['/((?!_next|ingest|.*\\..*).*)', '/'],
};
