# Budgety — Project Log

A plain-language history of what's been built, in order. See `README.md` for
the technical setup/architecture reference — this file is the story of how
we got here and what's still open.

## The MVP (original build)

Budgety started as a full working app: Clerk authentication, a two-step
onboarding wizard, transactions (manual entry + CSV import with automatic
column mapping, recurring monthly/biweekly transactions, splitting a
transaction across categories), a dashboard with a 0–100 Business Health
Score, AI-generated weekly recommendations, a streaming "AI CFO" chat, and
weekly report emails. All 5 required environment keys (Clerk × 2, Supabase
× 3) were verified working. This was the original teal/slate-colored design.

## The purple rebrand (2026-08-18 to 2026-08-20)

You had a prototype built in Claude Design (a purple/indigo look with
gradients and DM Sans typography) and wanted the live app to match it
exactly. While pulling the prototype in, we found its actual colors
contradicted that same Claude Design project's own documented tokens
(teal, "no gradients") — you confirmed the purple direction was the real,
intentional decision, and the old docs were just stale.

We rebuilt the whole app in 10 phases, each its own commit, each checked by
screenshot before moving to the next:

| Phase | What changed |
|---|---|
| 0 | Color/font/radius tokens in `app/globals.css` — the foundation everything else builds on |
| 1 | Decoupled chart colors from the token system (`lib/chart-colors.ts`) so Recharts/SVG stay in sync |
| 2 | Rebuilt the app shell: dark gradient sidebar, new wordmark, new top header with your real name |
| 3 | Dashboard — removed a redundant heading now that the new header shows your business name |
| 4 | Transactions — new stat-row (money in/out/net/uncategorized), segmented filters, extracted reusable `Tabs`/`ToggleGroup` components |
| 5 | Recommendations + Reports — icon badges, fixed an accessibility issue (Reports expanded on whole-card click, now matches Recommendations' chevron-only pattern) |
| 6 | AI CFO chat — merged the input box and send button into one pill-shaped composer |
| 7 | Marketing landing page — full rebuild with a gradient hero and a business-health preview card |
| 8 | Sign-in / sign-up — new two-column layout, Clerk's real form themed purple via its `appearance` API |
| 9 | Onboarding wizard — added a visual progress bar, added the wordmark (previously had no branding at all) |

## Design QA pass (2026-08-21)

Ran two design-review tools against the finished rebrand:

**Impeccable audit** found and fixed three real issues:
- The weekly report **email template** (`lib/email/resend.ts`) had been
  missed across all 10 phases and was still sending emails in the old teal
  colors — fixed.
- The warning/danger/success text colors (amber/red/green) failed standard
  accessibility contrast requirements on white backgrounds — darkened all
  three slightly so real text stays legible, even though the prototype's
  exact colors were slightly lighter. You approved this trade-off.
- A new "soft muted" text color had accidentally been used on real data
  (transaction dates, stat counts) instead of just decorative icons — fixed
  to use the more legible existing muted color instead.

**UI UX Pro Max** cross-checked the color palette, typography, and chart
choices against its design database — mostly validated what was already
built (purple/indigo is a recognized, legitimate pattern for this kind of
product). One open, unresolved suggestion: the "Expenses by category" donut
chart on the dashboard can show up to 8 slices, and general chart-design
guidance says pie/donut charts get hard to read past 5 — not fixed yet,
your call whether it's worth doing.

## Animated sign-in / sign-up panel (2026-08-28)

You provided a pre-built animated component (ripple background + orbiting
icons) to integrate into the auth pages. Important catch before building:
the component as given had **no real login logic** — its form just logged
to the browser console instead of actually signing anyone in. Rather than
swap out your real Clerk authentication for a non-functional demo form, we
kept Clerk's real sign-in/sign-up handling exactly as-is and used only the
decorative parts (the ripple animation, orbiting icons) as visual chrome
around it. Icons were swapped from generic tech-stack logos to
finance-relevant ones (dollar sign, receipt, pie chart, wallet, trending-up,
credit card), arranged in two rings around the Budgety "B" mark.

## Known open items

- **"Continue with Google" isn't completing.** Clicking it does correctly
  redirect to Google's real sign-in page, but Google's server logs are
  showing a recurring warning: `Clerk: Refreshing the session token
  resulted in an infinite redirect loop. This usually means your Clerk
  instance keys do not match.` This predates the rebrand — it's a Clerk
  dashboard/API-key configuration issue, not something in the app's code.
  Next step: try a private/incognito browser window first (rules out stale
  login cookies); if that doesn't fix it, the Publishable/Secret key pair
  in `.env.local` likely needs to be refreshed from the Clerk dashboard
  (instance name **"improved-dingo-83"**).
- **The Claude Design project's own token files are still stale.** They
  show the old teal palette even though the app itself is now purple —
  worth syncing back at some point so a future prototype pull doesn't
  reintroduce the same confusion this rebrand started with.
- **21st.dev Magic MCP connection** was never resolved in an earlier
  session — installed and confirmed working in VSCode's own MCP client, but
  Claude Code's `/mcp` command still doesn't see it. Not investigated since.

## Where things stand

The app is fully rebranded and working end-to-end except for Google OAuth
login (see above). All 10 rebrand phases plus the audit fixes and the auth
panel animation are committed to `main`. Screenshots have confirmed: the
marketing page, sign-in, sign-up, dashboard, and transactions (including the
add-transaction panel). Not yet independently screenshot-checked:
recommendations, reports, and the AI CFO chat — worth a look next time
you're testing.
