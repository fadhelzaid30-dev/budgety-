import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, LineChart, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WordMark } from "@/components/wordmark";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="bg-hero-gradient flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-6 md:px-12">
        <Link href="/">
          <WordMark variant="dark" size={22} />
        </Link>
        <nav className="flex items-center gap-3">
          {userId ? (
            <Link href="/dashboard">
              <Button size="sm">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-muted-strong">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <button
                  type="button"
                  className="h-10 rounded-lg px-4.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: "var(--gradient-sidebar)" }}
                >
                  Start free
                </button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-18 px-6 pb-24 pt-8 md:px-12">
        <section className="grid items-center gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              An affordable CFO for your business
            </span>
            <h1 className="text-balance font-display text-[38px] font-bold leading-[1.05] tracking-tight text-foreground-secondary md:text-[60px]">
              Know what your numbers mean, and what to do next.
            </h1>
            <p className="max-w-[46ch] text-base leading-relaxed text-muted-strong">
              Add transactions by hand or import a bank CSV. Budgety categorizes them,
              scores your business health out of 100, and answers questions using your
              real figures.
            </p>
            <div className="flex gap-3">
              <Link href="/sign-up">
                <button
                  type="button"
                  className="h-11 rounded-lg px-6 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: "var(--gradient-sidebar)" }}
                >
                  Start free
                </button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>

          <div
            className="flex flex-col gap-5 rounded-[20px] p-7 shadow-[0_18px_40px_rgba(35,35,95,0.18)]"
            style={{ background: "var(--gradient-sidebar)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Business health</span>
              <span className="inline-flex h-6 items-center rounded-full bg-[rgba(45,157,120,0.20)] px-2.5 text-xs font-semibold text-[#6EE7B7]">
                +6.3%
              </span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-6xl font-bold tracking-tight text-white">72</span>
              <span className="text-sm text-white/60">out of 100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-[72%] rounded-full bg-[#6EE7B7]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.06] p-4">
                <div className="text-xs text-white/60">Cash on hand</div>
                <div className="text-2xl font-bold text-white">$15,700</div>
              </div>
              <div className="rounded-xl bg-white/[0.06] p-4">
                <div className="text-xs text-white/60">Runway</div>
                <div className="text-2xl font-bold text-white">4.2 mo</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              &ldquo;You can afford the $5,000 truck this quarter — it drops runway from
              4.2 to 3.6 months.&rdquo;
            </p>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          <Feature
            icon={LineChart}
            title="Real financial picture"
            body="Import transactions or upload a CSV. Budgety auto-categorizes and scores your business health 0–100."
          />
          <Feature
            icon={MessageSquare}
            title="An AI CFO on call"
            body="Ask about any purchase or decision. Every answer uses your actual cash, burn, and runway — never generic advice."
          />
          <Feature
            icon={ShieldCheck}
            title="Private by design"
            body="Your data is isolated per account with row-level security and encrypted in transit and at rest."
          />
        </section>
      </main>

      <footer className="border-t border-border-strong px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between text-xs text-muted">
          <WordMark variant="dark" size={14} />
          <span>Figures shown in the preview above are sample data.</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card className="group flex flex-col gap-3 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-[linear-gradient(135deg,rgba(240,153,123,0.32)_0%,rgba(216,90,48,0.26)_100%)] group-hover:text-[#D85A30]">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold text-foreground-secondary">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-strong">{body}</p>
    </Card>
  );
}
