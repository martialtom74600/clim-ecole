import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="page-content space-y-6">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-5 w-96 max-w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </main>
  );
}
