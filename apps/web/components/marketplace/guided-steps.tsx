'use client';

import { useState } from 'react';
import { ChevronDown, Compass } from 'lucide-react';
import type { GuideStep } from '@/lib/site-guide';
import { cn } from '@/lib/utils';

export function GuidedSteps({
  title = 'Comment avancer',
  steps,
  className,
  collapsibleOnMobile = true,
}: {
  title?: string;
  steps: GuideStep[];
  className?: string;
  collapsibleOnMobile?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('card overflow-hidden', className)}>
      {collapsibleOnMobile ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between border-b border-radar-border px-5 py-4 text-left md:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-radar-text">
            <Compass className="h-4 w-4 text-radar-signal" />
            {title} · {steps.length} étapes
          </span>
          <ChevronDown className={cn('h-4 w-4 text-radar-muted transition-transform', open && 'rotate-180')} />
        </button>
      ) : null}

      <div className={cn('border-b border-radar-border px-5 py-4', collapsibleOnMobile && 'hidden md:block')}>
        <p className="flex items-center gap-2 text-sm font-semibold text-radar-text">
          <Compass className="h-4 w-4 text-radar-signal" />
          {title}
        </p>
      </div>

      <ol
        className={cn(
          'grid gap-0 divide-y divide-radar-border sm:grid-cols-2 lg:grid-cols-4 sm:divide-y-0 lg:divide-x',
          collapsibleOnMobile && !open && 'hidden md:grid',
          collapsibleOnMobile && open && 'grid md:grid',
        )}
      >
        {steps.map(({ step, title: stepTitle, description }) => (
          <li key={step} className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-radar-signal/10 text-xs font-bold text-radar-signal">
                {step}
              </span>
              <div>
                <p className="text-sm font-semibold text-radar-text">{stepTitle}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-radar-muted">{description}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
