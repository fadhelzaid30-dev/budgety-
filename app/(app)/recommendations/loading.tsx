import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonPageHeader, SkeletonText } from "@/components/ui/skeleton";

/** Mirrors app/(app)/recommendations/page.tsx. */
export default function RecommendationsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SkeletonPageHeader />
        <Skeleton className="h-10 w-44 rounded-md" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent>
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonText className="w-2/3" />
                  <SkeletonText className="w-full" />
                  <SkeletonText className="w-4/5" />
                </div>
                <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
