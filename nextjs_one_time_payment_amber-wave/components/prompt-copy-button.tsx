'use client';

import { useCallback, useState } from 'react';

type PromptCopyButtonProps = {
  prompt: string;
  copied?: boolean;
  onCopy?: () => void;
};

export function PromptCopyButton({
  prompt,
  copied: externalCopied,
  onCopy,
}: PromptCopyButtonProps) {
  const [internalCopied, setInternalCopied] = useState(false);
  const copied = externalCopied ?? internalCopied;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      if (onCopy) {
        onCopy();
      } else {
        setInternalCopied(true);
        window.setTimeout(() => setInternalCopied(false), 2500);
      }
    } catch {
      setInternalCopied(false);
    }
  }, [prompt, onCopy]);

  return (
    <button
      aria-label={copied ? 'Text copied' : 'Copy text to clipboard'}
      className={`relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm px-2 py-1 text-xs font-semibold transition duration-200 ease-out ${
        copied
          ? 'bg-emerald-600 text-white'
          : 'bg-neutral-950 text-white hover:bg-neutral-950/70'
      }`}
      onClick={(event) => {
        event.stopPropagation();
        void handleCopy();
      }}
      title={copied ? 'Copied' : 'Copy to clipboard'}
      type="button"
    >
      <span aria-hidden="true" className="-translate-y-0.25">
        {copied ? 'copied' : 'copy'}
      </span>
      <span className="sr-only">
        {copied ? 'Copied' : 'Copy text to clipboard'}
      </span>
    </button>
  );
}
