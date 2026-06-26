import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, count, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-zen-muted">
          {breadcrumb.map((item, i) => (
            <span key={item.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />}
              {item.href ? (
                <Link href={item.href} className="transition-colors hover:text-zen-teal">
                  {item.label}
                </Link>
              ) : (
                <span className="text-zinc-300">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 lg:text-3xl">{title}</h1>
          {description && <p className="mt-2 text-base text-zen-muted">{description}</p>}
        </div>
        {count != null && (
          <span className="shrink-0 rounded-xl border border-white/[0.08] bg-zen-panel px-4 py-2 text-sm tabular-nums text-zen-muted">
            {count} entrées
          </span>
        )}
      </div>
    </div>
  );
}
