'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { PromptCopyButton } from '@/components/prompt-copy-button';

const CopyContext = createContext<{ copied: boolean; onCopy: () => void } | null>(null);

type DeployCommandProps = {
  command?: string;
  label?: string;
};

export function DeployCommand({
  command = 'npm run deploy',
  label = 'Deploy',
}: DeployCommandProps) {
  const ctx = useContext(CopyContext);

  return (
    <div aria-label={label} className="flex h-full w-full items-center justify-between pl-3 pr-2 text-[0.8125rem]" title={label}>
      <div className="absolute inset-0 flex items-center justify-center px-1 py-1">
        <div className="h-full w-full rounded-md border border-neutral-950/6 bg-neutral-950/4" />
      </div>
      <div className="relative flex items-center gap-2">
        <span aria-hidden="true" className="font-mono text-neutral-600">
          $
        </span>
        <code className="-translate-y-0.25 whitespace-nowrap font-mono font-medium text-neutral-600">
          {command}
        </code>
      </div>
      <PromptCopyButton prompt={command} copied={ctx?.copied} onCopy={ctx?.onCopy} />
    </div>
  );
}

type DeployCardProps = {
  children: ReactNode;
  className?: string;
  command?: string;
};

export function DeployCard({
  children,
  className = '',
  command = 'npm run deploy',
}: DeployCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {}
  }, [command]);

  const copyContextValue = {
    copied,
    onCopy: handleCopy,
  };

  return (
    <CopyContext.Provider value={copyContextValue}>
      <div
        role="button"
        tabIndex={0}
        className={`${className} cursor-pointer`}
        onClick={handleCopy}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            void handleCopy();
          }
        }}
      >
        {children}
      </div>
    </CopyContext.Provider>
  );
}
