'use client';

import { useCallback, useEffect, useState } from 'react';
import { secondaryButton } from '@/lib/ui';

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
      : 'group relative flex h-full w-full cursor-pointer items-center justify-center';

  return (
    <button className={buttonClassName} onClick={fetchData} type="button">
      {variant === 'status' ? (
        <>
          <div className="absolute inset-0 flex items-center justify-center py-1">
            <div className="h-[calc(100%-0.25rem)] w-[calc(100%-0.5rem)] rounded-md border border-neutral-950/6 bg-neutral-950/4 opacity-0 transition-all duration-200 ease-out group-hover:h-full group-hover:w-full group-hover:opacity-100" />
          </div>
          <span className="relative">{buttonLabel}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="relative size-3.75 translate-y-0.125 transition-transform duration-200 ease-out group-hover:translate-x-0.5">
            <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </>
      ) : (
        buttonLabel
      )}
    </button>
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
              <div className="grid grid-cols-3 border-b border-neutral-950/6 bg-neutral-950/2 *:flex *:items-center *:px-3 *:font-medium">
                <div className="border-r border-neutral-950/6">Table</div>
                <div className="border-r border-neutral-950/6">Name</div>
                <div>Rows</div>
              </div>
              {payload.tables.map((table) => (
                <div
                  className="grid grid-cols-3 border-b border-neutral-950/6 *:flex *:items-center *:px-3"
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
                  className="grid grid-cols-3 border-b border-neutral-950/6 last:border-b-0"
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
