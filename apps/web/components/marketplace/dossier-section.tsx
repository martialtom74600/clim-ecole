import { cn } from '@/lib/utils';

export function DossierSection({
  id,
  number,
  title,
  description,
  children,
  className,
  bleed,
}: {
  id: string;
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <section id={id} className={cn('scroll-mt-32', className)}>
      <div className={cn('mb-6 flex items-start gap-4', bleed && 'px-0')}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
          {number}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
