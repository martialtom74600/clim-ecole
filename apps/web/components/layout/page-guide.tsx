'use client';

import { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GuideStep {
  step: number;
  title: string;
  description: string;
}

export function PageGuide({ steps, className }: { steps: GuideStep[]; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('mb-8', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-zen-panel/60 px-4 py-3 text-left transition-colors hover:bg-zen-elevated md:hidden"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Lightbulb className="h-4 w-4 text-zen-teal" />
          Guide · {steps.length} étapes
        </span>
        <ChevronDown className={cn('h-4 w-4 text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>

      <div className={cn('grid gap-4 sm:grid-cols-3', !open && 'hidden md:grid')}>
        {steps.map(({ step, title, description }) => (
          <div key={step} className="panel panel-hover p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zen-teal/15 text-sm font-bold tabular-nums text-zen-teal">
                {step}
              </span>
              <h2 className="text-[15px] font-semibold text-zinc-100">{title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-zen-muted">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
