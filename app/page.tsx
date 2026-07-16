import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, LineChart, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <span className="text-lg font-semibold text-primary">Budgety</span>
        <nav className="flex items-center gap-2">
          {userId ? (
            <Link href="/dashboard">
              <Button size="sm">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pt-16 text-center md:pt-24">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" /> Your AI CFO for small business
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          Know exactly what to do next with your money.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Budgety turns your transactions into a clear financial picture — then tells
          you what to do about it. &ldquo;Can I afford to hire?&rdquo; &ldquo;Can I
          afford a $5,000 truck?&rdquo; Get answers grounded in your real numbers.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/sign-up">
            <Button size="lg">
              Start free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="lg">I already have an account</Button>
          </Link>
        </div>

        <div className="mt-20 grid w-full gap-6 pb-20 text-left sm:grid-cols-3">
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
        </div>
      </main>
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
    <div className="rounded-xl border border-border bg-card p-6">
      <Icon className="mb-3 h-6 w-6 text-primary" />
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}
