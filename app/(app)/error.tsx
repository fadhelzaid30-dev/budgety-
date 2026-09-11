"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Error boundary for every signed-in route. Without this, a thrown error in a
 * server component (e.g. the non-null assertion on getCurrentBusiness) rendered
 * Next's unstyled default error page.
 *
 * The sidebar and header stay mounted, so the user is never stranded — they can
 * navigate away even if this one route is broken.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10">
            <TriangleAlert className="h-6 w-6 text-danger" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            This page didn&apos;t load
          </h1>
          <p className="mt-1.5 max-w-sm text-sm text-muted">
            Something went wrong fetching your data. Your transactions are safe —
            this is a display problem, not a data problem.
          </p>

          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-muted">
              Reference: {error.digest}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>
              <RotateCw className="h-4 w-4" /> Try again
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
