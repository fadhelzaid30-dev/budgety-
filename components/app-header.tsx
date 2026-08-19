import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";
import type { Business } from "@/types";

/**
 * Search and notifications are presentational only — neither feature
 * exists in the backend yet. "Owner" is a static label since the data
 * model has no per-user role concept (single-owner-per-business MVP).
 * The avatar is Clerk's own UserButton (styled to match) so account
 * management (email, security, etc.) stays reachable — it moved here
 * from the old sidebar position rather than being removed.
 */
export async function AppHeader({ business }: { business: Business }) {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You";

  return (
    <header className="flex items-center gap-5 border-b border-border bg-card px-8 py-5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className="text-lg font-semibold"
          style={{
            background: "var(--gradient-warm)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Welcome back, {firstName}
        </span>
        <span className="truncate text-xs text-muted">{business.name}</span>
      </div>

      <div className="ml-auto flex h-10 w-[300px] items-center gap-2 rounded-full border border-border bg-background-alt px-3.5 text-muted-soft">
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search anything…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-soft"
          disabled
        />
      </div>

      <button
        type="button"
        aria-label="Notifications"
        disabled
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted hover:bg-background-alt disabled:cursor-default"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex shrink-0 items-center gap-2.5 border-l border-border pl-4">
        <UserButton
          appearance={{
            variables: { colorPrimary: "#4d44b5" },
            elements: { avatarBox: "h-10 w-10" },
          }}
        />
        <div className="hidden flex-col sm:flex">
          <span className="text-sm font-medium text-foreground-secondary">{fullName}</span>
          <span className="text-xs text-muted">Owner</span>
        </div>
      </div>
    </header>
  );
}
