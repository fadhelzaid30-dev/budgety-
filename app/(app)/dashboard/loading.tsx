import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonCard,
  SkeletonPageHeader,
  SkeletonStat,
  SkeletonText,
} from "@/components/ui/skeleton";

/** Mirrors app/(app)/dashboard/page.tsx so nothing shifts when data arrives. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SkeletonPageHeader />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <Skeleton className="h-[140px] w-[140px] shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-3">
                  <SkeletonText className="w-48" />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <SkeletonText className="w-28" />
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <SkeletonText className="w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <SkeletonText className="w-32" />
                <SkeletonText className="w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
