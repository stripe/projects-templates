import Link from 'next/link';
import { appConfig } from '@/lib/app-config';

export function AppTopbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center border-b border-neutral-950/8 bg-neutral-50/50 px-6 backdrop-blur-md">
      <div className="flex h-16 w-full max-w-6xl items-center justify-between">
        <div className="flex h-8 gap-3">
          <Link className="flex items-center gap-2 whitespace-nowrap px-0" href="/">
            <div className="relative flex h-5 w-5 items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="h-auto w-full">
                <path d="M15.75 0c.14 0 .25.11.25.25v2.17q-.01.2-.2.25L8.2 4.35a.25.25 0 0 0-.2.24v1.49c0 .16.15.28.3.24l7.4-1.63c.15-.04.3.08.3.24v7.1q-.01.2-.2.24l-7.6 1.69a.25.25 0 0 0-.2.24v1.55c0 .14-.11.25-.25.25H.25a.25.25 0 0 1-.25-.25v-2.17q.01-.2.2-.24l7.6-1.69q.19-.04.2-.24V9.92a.25.25 0 0 0-.3-.24L.3 11.3a.25.25 0 0 1-.3-.24v-7.1q.01-.2.2-.24l7.6-1.69Q8 2 8 1.8V.25q.02-.23.25-.25z" />
              </svg>
            </div>
            <span className="text-md font-semibold tracking-tight">{appConfig.name}</span>
          </Link>
          <div className="hidden items-center sm:flex">
            <div className="translate-y-0.125 rounded-sm border border-neutral-950/10 bg-neutral-200 px-1.5 py-1.25 font-mono text-[0.625rem]/[100%] uppercase text-neutral-600">
              Subscription SaaS Template
            </div>
          </div>
        </div>

        <nav className="text-sm/[100%] font-medium">
          <ul className="relative flex">
            <li className="flex">
              <Link href="/checkout" className="flex items-center px-1.5 transition-opacity duration-200 ease-out hover:opacity-70 sm:px-2">
                Pricing
              </Link>
            </li>
            <li className="flex">
              <Link href="/sign-in" className="flex items-center px-1.5 transition-opacity duration-200 ease-out hover:opacity-70 sm:px-2">
                Login
              </Link>
            </li>
            <li className="ml-1.5 sm:ml-2">
              <Link href="/sign-up" className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 text-neutral-900 transition-all duration-250 ease-out hover:border-neutral-400">
                Sign Up
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
