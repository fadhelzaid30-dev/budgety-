import { Card } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonPageHeader,
  SkeletonRows,
  SkeletonStat,
} from "@/components/ui/skeleton";

/** Mirrors app/(app)/transactions/page.tsx. */
export default function TransactionsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SkeletonPageHeader />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 flex-1 min-w-[200px] rounded-md" />
          <Skeleton className="h-10 w-40 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <SkeletonRows rows={8} />
      </Card>
    </div>
  );
}
