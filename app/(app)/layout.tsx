import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { AppNav } from "@/components/app-nav";
import { ensureProfile, getCurrentBusiness } from "@/lib/data/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware guarantees an authenticated user here. Ensure their profile exists
  // and that onboarding is complete before showing the app.
  await ensureProfile();
  const business = await getCurrentBusiness();
  if (!business || !business.onboarding_complete) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <Link href="/dashboard" className="mb-6 px-2 text-lg font-semibold text-primary">
          Budgety
        </Link>
        <AppNav />
        <div className="mt-auto flex items-center gap-3 border-t border-border px-2 pt-4">
          <UserButton />
          <span className="truncate text-sm text-muted">{business.name}</span>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <Link href="/dashboard" className="text-lg font-semibold text-primary">
            Budgety
          </Link>
          <UserButton />
        </header>
        <div className="border-b border-border bg-card px-2 py-2 md:hidden">
          <AppNav />
        </div>

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
