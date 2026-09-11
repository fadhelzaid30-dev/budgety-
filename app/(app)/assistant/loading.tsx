import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/** Mirrors app/(app)/assistant/page.tsx — a full-height chat column. */
export default function AssistantLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <SkeletonText className="w-72" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card">
        <div className="min-h-0 flex-1 space-y-5 overflow-hidden p-5">
          {[
            { mine: false, w: "w-3/5" },
            { mine: true, w: "w-2/5" },
            { mine: false, w: "w-4/5" },
          ].map((m, i) => (
            <div key={i} className={m.mine ? "flex justify-end" : "flex justify-start"}>
              <Skeleton className={`h-16 rounded-2xl ${m.w}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-border p-4">
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
