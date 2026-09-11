import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WordMark } from "@/components/wordmark";

/** Root 404. Renders outside the app shell, so it carries its own branding. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="mb-10">
        <WordMark size={22} />
      </Link>

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Compass className="h-6 w-6 text-primary" />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        That link doesn&apos;t point anywhere in Budgety. It may have been moved,
        or the address may have a typo.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    </main>
  );
}
