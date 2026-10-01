import Link from "next/link";
import { WordMark } from "@/components/wordmark";
import { Ripple } from "@/components/ui/ripple";
import { FinanceOrbitDisplay } from "@/components/ui/finance-orbit-display";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 md:flex"
        style={{ background: "var(--gradient-auth-panel)" }}
      >
        <Link href="/" className="relative z-10">
          <WordMark variant="light" size={22} />
        </Link>

        <div className="relative z-10 flex-1">
          <div className="relative h-full w-full">
            <Ripple mainCircleOpacity={0.22} />
            <FinanceOrbitDisplay />
          </div>
        </div>

        <div className="relative z-10 flex max-w-[34ch] flex-col gap-6">
          <div className="flex flex-col gap-5">
            <span className="text-2xl font-bold leading-snug text-white">
              Two minutes of setup, then Budgety works from your real numbers.
            </span>
            <span className="text-sm leading-relaxed text-on-dark-secondary">
              Import a CSV or add transactions by hand. Your health score,
              recommendations, and weekly report follow from there.
            </span>
          </div>

          <span className="text-xs text-on-dark-muted">
            Your data is private and isolated per account.
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
