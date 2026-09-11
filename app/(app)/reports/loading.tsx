import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonPageHeader, SkeletonText } from "@/components/ui/skeleton";

/** Mirrors app/(app)/reports/page.tsx. */
export default function ReportsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SkeletonPageHeader />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonText className="w-56" />
                  <SkeletonText className="w-32" />
                </div>
                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
