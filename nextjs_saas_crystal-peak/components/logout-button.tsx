'use client';

import { useClerk } from '@clerk/nextjs';
import { track, reset } from '@/lib/mixpanel';

function LogOutIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3M13 14l4-4-4-4M17 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <button
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      onClick={() => {
        track('user_logged_out');
        reset();
        signOut({ redirectUrl: '/' });
      }}
    >
      <LogOutIcon className="h-4 w-4" />
      Log out
    </button>
  );
}
