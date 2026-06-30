import { Skeleton } from '@/components/ui/skeleton';

export function QuickTriageSkeleton() {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-line p-5">
        <Skeleton className="mb-2 h-3 w-28" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="hidden space-y-2 text-right sm:block">
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="ml-auto h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
