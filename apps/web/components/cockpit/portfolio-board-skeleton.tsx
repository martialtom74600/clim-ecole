import { Skeleton } from '@/components/ui/skeleton';

export function PortfolioBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, col) => (
        <div key={col} className="panel w-80 shrink-0 p-3">
          <Skeleton className="mb-3 h-4 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-24 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
