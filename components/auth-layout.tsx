import Link from "next/link";
import { WordMark } from "@/components/wordmark";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div
        className="hidden flex-col justify-between p-12 md:flex"
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <Link href="/">
          <WordMark variant="light" size={22} />
        </Link>

        <div className="flex max-w-[34ch] flex-col gap-5">
          <span className="text-2xl font-bold leading-snug text-white">
            Two minutes of setup, then Budgety works from your real numbers.
          </span>
          <span className="text-sm leading-relaxed text-white/70">
            Import a CSV or add transactions by hand. Your health score,
            recommendations, and weekly report follow from there.
          </span>
        </div>

        <span className="text-xs text-white/50">
          Your data is private and isolated per account.
        </span>
      </div>

      <div className="flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
