'use client';

import { useState } from 'react';
import { DeployCommand } from '@/components/deploy-command';

const productCommands = {
  claude: {
    command: 'claude "Help me turn this into a real product. Follow prompts/starter-to-product.md."',
    label: 'Claude',
  },
  codex: {
    command: 'codex "Help me turn this into a real product. Follow prompts/starter-to-product.md."',
    label: 'Codex',
  },
} as const;

type ProductCommandKey = keyof typeof productCommands;

export function BuildProductCommandsCard({
  variant = 'inline',
}: {
  variant?: 'inline' | 'modal';
}) {
  const [selectedCommand, setSelectedCommand] = useState<ProductCommandKey>('codex');
  const activeCommand = productCommands[selectedCommand];
  const surfaceClassName =
    variant === 'modal'
      ? 'border border-neutral-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]'
      : 'border border-white/80 bg-white/68 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.14)]';

  return (
    <section className={`w-fit max-w-full overflow-hidden rounded-[22px] ${surfaceClassName}`}>
      <div className="px-5 pt-4 sm:px-6">
        <p className="text-[10px] font-mono font-medium uppercase tracking-[0.18em] text-neutral-500">
          Build your product
        </p>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
          <div className="inline-flex rounded-md border border-neutral-200 bg-white/70 p-0.5">
            {(Object.keys(productCommands) as ProductCommandKey[]).map((key) => {
              const item = productCommands[key];
              const isActive = key === selectedCommand;

              return (
                <button
                  key={key}
                  className={`rounded-sm px-2.5 py-0.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  onClick={() => setSelectedCommand(key)}
                  type="button"
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="min-w-0">
            <DeployCommand command={activeCommand.command} />
          </div>
        </div>
      </div>
    </section>
  );
}
