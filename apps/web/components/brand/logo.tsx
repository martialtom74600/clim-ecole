import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';

export function BrandLogo({ size = 'md', showWordmark = true, className }: {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}) {
  const text = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('font-semibold tracking-tight', text)}>{BRAND.name}</span>
      {showWordmark && size !== 'sm' && (
        <span className="hidden text-xs text-ink-muted sm:inline">{BRAND.descriptor}</span>
      )}
    </div>
  );
}
