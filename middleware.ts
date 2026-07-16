import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Note: Next.js 16 renamed the `middleware` convention to `proxy`, but Clerk 7's
// `clerkMiddleware` still ships against the `middleware.ts` filename. This works on
// v16 (with a deprecation notice); revisit once Clerk supports the `proxy` runtime.

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/cron(.*)", // guarded by CRON_SECRET, not Clerk
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|webp|woff2?|ttf|otf|map)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
