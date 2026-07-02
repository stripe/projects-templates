'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BuildProductCommandsCard } from '@/components/build-product-commands-card';
import { primaryButton } from '@/lib/ui';

function CloseIcon() {
  return (
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
  );
}

export function BuildProductCommandsModalTrigger({
  buttonLabel = 'Start Customizing',
}: {
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={`${primaryButton} max-sm:w-full`} onClick={() => setOpen(true)} type="button">
        {buttonLabel}
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/28 px-4 py-6 backdrop-blur-sm">
              <div className="relative max-w-full">
                <button
                  aria-label="Close build your product commands"
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <CloseIcon />
                </button>
                <BuildProductCommandsCard variant="modal" />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
