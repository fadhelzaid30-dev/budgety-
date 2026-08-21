import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/nextjs";

/**
 * Clerk's `localization` is a ClerkProvider-level (not per-page) option, so
 * both sign-in and sign-up subtitle overrides live here together even
 * though each only ever renders on its own page.
 */
export const clerkLocalization: ComponentProps<typeof ClerkProvider>["localization"] = {
  signIn: {
    start: {
      subtitle: "Pick up where your numbers left off.",
      subtitleCombined: "Pick up where your numbers left off.",
    },
  },
  signUp: {
    start: {
      subtitle: "Free while you import your first month.",
      subtitleCombined: "Free while you import your first month.",
    },
  },
};
