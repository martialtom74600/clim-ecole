'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface SegmentedTab<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-lg border border-radar-border bg-radar-elevated p-1',
        className,
      )}
      role="tablist"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
              active ? 'bg-radar-surface text-radar-text shadow-panel' : 'text-radar-muted hover:text-radar-text',
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
