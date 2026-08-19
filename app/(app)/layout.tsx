import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { AppHeader } from "@/components/app-header";
import { WordMark } from "@/components/wordmark";
import { SignOutButton } from "@/components/sign-out-button";
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
      <aside
        className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-7 p-4 md:flex"
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <Link href="/dashboard" className="flex flex-col gap-0.5 px-3 pt-2">
          <WordMark variant="light" size={20} />
          <span className="truncate text-xs text-white/50">{business.name}</span>
        </Link>

        <div className="flex flex-col gap-2">
          <span className="px-3 text-xs font-medium uppercase tracking-wide text-white/40">
            Main menu
          </span>
          <AppNav variant="sidebar" />
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <span className="px-3 text-xs font-medium uppercase tracking-wide text-white/40">
            Help &amp; support
          </span>
          <Link
            href="/dashboard"
            className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between px-4 py-3 md:hidden"
          style={{ background: "var(--gradient-sidebar)" }}
        >
          <Link href="/dashboard">
            <WordMark variant="light" size={18} />
          </Link>
          <SignOutButton className="w-auto" />
        </header>
        <div className="border-b border-border bg-card px-2 py-2 md:hidden">
          <AppNav variant="mobile" />
        </div>

        <AppHeader business={business} />

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
