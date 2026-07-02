'use client';

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { buttonRow, secondaryButton } from '@/lib/ui';

export function UserControls() {
  return (
    <>
      <SignedOut>
        <div className={buttonRow}>
          <SignInButton mode="modal">
            <button className={secondaryButton}>Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className={secondaryButton}>Create account</button>
          </SignUpButton>
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
