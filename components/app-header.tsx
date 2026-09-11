import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { HeaderSearch } from "@/components/header-search";
import type { Business } from "@/types";

/**
 * "Owner" is a static label — the data model has no per-user role concept
 * (single owner per business in this version). The avatar is Clerk's own
 * UserButton, styled to match, so account management stays reachable.
 *
 * The notification bell that used to sit here was permanently disabled with no
 * feature behind it; a control that can never be pressed is worse than no
 * control. Search was disabled too and is now wired to the transactions page.
 */
export async function AppHeader({ business }: { business: Business }) {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You";

  return (
    <header className="flex items-center gap-5 border-b border-border bg-card px-4 py-4 md:px-8 md:py-5">
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* Plain foreground, not the warm gradient: the brand rules cap the
            coral/orange at accent use, and a greeting on every page is the most
            prominent text in the app. */}
        <span className="truncate text-lg font-semibold text-foreground">
          Welcome back, {firstName}
        </span>
        <span className="truncate text-xs text-muted">{business.name}</span>
      </div>

      <HeaderSearch />

      <div className="ml-auto flex shrink-0 items-center gap-2.5 border-border pl-4 lg:ml-0 lg:border-l">
        <UserButton
          appearance={{
            ...clerkAppearance,
            elements: { ...clerkAppearance?.elements, avatarBox: "h-10 w-10" },
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
