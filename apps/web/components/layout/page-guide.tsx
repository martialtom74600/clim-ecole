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
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-line bg-surface-sunken px-4 py-3 text-left transition-colors hover:bg-surface-muted md:hidden"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-ink-soft">
          <Lightbulb className="h-4 w-4 text-ink" />
          Guide · {steps.length} étapes
        </span>
        <ChevronDown className={cn('h-4 w-4 text-ink-subtle transition-transform', open && 'rotate-180')} />
      </button>

      <div className={cn('grid gap-4 sm:grid-cols-3', !open && 'hidden md:grid')}>
        {steps.map(({ step, title, description }) => (
          <div key={step} className="panel panel-hover p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink/10 text-sm font-bold tabular-nums text-ink">
                {step}
              </span>
              <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
