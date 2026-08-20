import type { SignIn } from "@clerk/nextjs";

/**
 * Themes Clerk's hosted sign-in/sign-up UI to match the app's purple
 * design tokens. `variables` is Clerk's supported theming surface and
 * covers color/radius/font; `elements` is kept minimal since Clerk's
 * internal class names shift more across versions than variable keys do.
 */
export const clerkAppearance: React.ComponentProps<typeof SignIn>["appearance"] = {
  variables: {
    colorPrimary: "#4d44b5",
    colorForeground: "#1b1b3a",
    colorMutedForeground: "#6b6b8a",
    colorBackground: "#ffffff",
    colorInput: "#f4f4fb",
    colorInputForeground: "#1b1b3a",
    colorBorder: "#e9e9f4",
    colorDanger: "#ef4444",
    colorSuccess: "#2d9d78",
    colorWarning: "#f59e0b",
    borderRadius: "8px",
    fontFamily: "var(--font-dm-sans), var(--font-geist-sans), sans-serif",
  },
  elements: {
    card: "shadow-none border-0",
  },
};
