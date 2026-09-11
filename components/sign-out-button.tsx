"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-on-dark-secondary transition-colors hover:bg-on-dark-surface hover:text-on-dark",
        className,
      )}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Log out
    </button>
  );
}
