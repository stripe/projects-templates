'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useState } from 'react';
import { primaryButton, secondaryButton } from '@/lib/ui';

type DatabaseTableSummary = {
  label: string;
  name: string;
  rowCount: number;
};

type DatabaseSummaryResponse = {
  configured: boolean;
  connected: boolean;
  currentTime: string | null;
  dashboardUrl: string | null;
  message: string;
  ok: boolean;
  tables: DatabaseTableSummary[];
  version: string | null;
};

function formatRowCount(count: number) {
  return `${count} row${count === 1 ? '' : 's'}`;
}

export function DatabaseStatusButton({
  buttonLabel = 'View Database',
  variant = 'status',
}: {
  buttonLabel?: string;
  variant?: 'secondary' | 'status' | 'inline';
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<DatabaseSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (fetched) return;
    setFetched(true);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/db', { method: 'GET' });
      const nextPayload = (await response.json()) as DatabaseSummaryResponse & { error?: string };

      if (!response.ok || !nextPayload.ok) {
        throw new Error(nextPayload.error ?? 'Unable to load the starter database summary.');
      }

      setPayload(nextPayload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load the starter database summary.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  if (variant === 'inline') {
    return (
      <DatabaseStatusInline
        error={error}
        loading={loading}
        onLoad={fetchData}
        payload={payload}
      />
    );
  }

  const buttonClassName =
    variant === 'secondary'
      ? secondaryButton
      : 'group inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-[15px] font-medium text-neutral-700 shadow-sm transition-all duration-200 ease-out hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950';
  const indicatorTone =
    payload?.connected && payload.configured ? 'configured' : payload?.configured ? 'pending' : 'pending';
  const statusLabel =
    payload?.connected && payload.configured
      ? 'Connected'
      : payload?.configured
        ? 'Unavailable'
        : 'Needs config';
  const statusTextClass = indicatorTone === 'configured' ? 'text-emerald-700' : 'text-amber-700';
  const statusDotClass = indicatorTone === 'configured' ? 'bg-emerald-500' : 'bg-amber-500';
  const message =
    error ?? payload?.message ?? 'Inspect the starter tables created for auth and payment syncing.';

  return (
    <>
      <button
        className={buttonClassName}
        onClick={() => {
          setOpen(true);
          void fetchData();
        }}
        type="button"
      >
        {variant === 'status' ? (
          <>
            <span>{buttonLabel}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.75 translate-y-0.125 transition-transform duration-200 ease-out group-hover:translate-x-0.5">
              <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </>
        ) : (
          buttonLabel
        )}
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/28 px-4 py-6 backdrop-blur-sm">
              <div className="w-full max-w-xl overflow-hidden rounded-[22px] border border-black/[0.05] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-4 border-b border-black/[0.05] px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-[10px] font-mono font-medium uppercase tracking-[0.18em] text-neutral-500">
                      Starter database
                    </p>
                    <p className="mt-2 text-sm text-neutral-600">
                      {loading ? 'Loading the latest database summary...' : message}
                    </p>
                  </div>

                  <button
                    aria-label="Close database status"
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16">
                      <path
                        d="M4 4l8 8m0-8-8 8"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                </div>

                <div className="divide-y divide-black/[0.05]">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-6">
                    <div className={`inline-flex items-center gap-2 text-sm font-medium ${statusTextClass}`}>
                      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                        <span className={`relative h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
                      </span>
                      {statusLabel}
                    </div>
                    <span className="text-sm font-semibold text-neutral-950">Neon Postgres</span>
                  </div>

                  {payload?.tables?.map((table) => (
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-6"
                      key={table.name}
                    >
                      <div>
                        <p className="text-sm font-semibold text-neutral-950">{table.label}</p>
                        <p className="text-xs text-neutral-500">{table.name}</p>
                      </div>
                      <p className="text-sm text-neutral-600">{formatRowCount(table.rowCount)}</p>
                    </div>
                  ))}

                  {!loading && !error && payload && payload.tables.length === 0 ? (
                    <div className="px-5 py-4 sm:px-6">
                      <p className="text-sm text-neutral-500">No starter tables were returned yet.</p>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 border-t border-black/[0.05] px-5 py-4 sm:px-6">
                  {payload?.dashboardUrl ? (
                    <a
                      className={primaryButton}
                      href={payload.dashboardUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View on Neon
                    </a>
                  ) : null}

                  <button className={secondaryButton} onClick={() => setOpen(false)} type="button">
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function DatabaseStatusInline({
  loading,
  payload,
  error,
  onLoad,
}: {
  loading: boolean;
  payload: DatabaseSummaryResponse | null;
  error: string | null;
  onLoad: () => void;
}) {
  useEffect(() => {
    onLoad();
  }, [onLoad]);

  const statusNote = loading
    ? 'Loading...'
    : error
      ? error
      : payload?.connected
        ? 'Your app is connected and starter tables are ready to inspect.'
        : 'Not connected yet.';

  return (
    <>
      {error ? (
        <span className="text-red-600">{statusNote}</span>
      ) : loading ? (
        <span className="text-neutral-500">{statusNote}</span>
      ) : (
        <>
          {payload && payload.tables.length > 0 ? (
            <div className="h-full overflow-hidden rounded-tl-md border-l border-t border-neutral-950/6 bg-white text-sm shadow-2xl">
              <div className="grid grid-cols-3 border-b border-neutral-950/6 bg-neutral-950/2 *:flex *:items-center *:px-3 *:py-2 *:font-medium">
                <div className="border-r border-neutral-950/6">Table</div>
                <div className="border-r border-neutral-950/6">Name</div>
                <div>Rows</div>
              </div>
              {payload.tables.map((table) => (
                <div
                  className="grid grid-cols-3 border-b border-neutral-950/6 *:flex *:items-center *:px-3 *:py-2"
                  key={table.name}
                >
                  <span className="border-r border-neutral-950/6 font-medium text-neutral-950">
                    {table.label}
                  </span>
                  <span className="border-r border-neutral-950/6 text-neutral-600">
                    {table.name}
                  </span>
                  <span className="text-neutral-600">{formatRowCount(table.rowCount)}</span>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 5 - payload.tables.length) }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="grid min-h-10 grid-cols-3 border-b border-neutral-950/6 last:border-b-0"
                >
                  <div className="border-r border-neutral-950/6" />
                  <div className="border-r border-neutral-950/6" />
                  <div />
                </div>
              ))}
            </div>
          ) : payload ? (
            <span className="text-neutral-500">No starter tables were returned yet.</span>
          ) : null}
        </>
      )}
    </>
  );
}
