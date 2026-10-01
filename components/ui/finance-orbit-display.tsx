import {
  DollarSign,
  Receipt,
  PieChart,
  Wallet,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { LogoMark } from "@/components/wordmark";

const INNER_RING = [DollarSign, Receipt, PieChart];
const OUTER_RING = [Wallet, TrendingUp, CreditCard];

function OrbitIcon({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-on-dark-border bg-on-dark-surface text-on-dark-secondary backdrop-blur-sm"
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

/** Decorative orbit animation for the auth panel: finance icons in two rings around the Budgety mark. */
export function FinanceOrbitDisplay() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-on-dark-surface shadow-glow backdrop-blur-sm">
        <LogoMark variant="light" size={30} />
      </div>

      {INNER_RING.map((Icon, i) => (
        <OrbitingCircles
          key={`inner-${i}`}
          radius={90}
          duration={22}
          delay={(22 / INNER_RING.length) * i}
          showPath={i === 0}
        >
          <OrbitIcon icon={Icon} />
        </OrbitingCircles>
      ))}

      {OUTER_RING.map((Icon, i) => (
        <OrbitingCircles
          key={`outer-${i}`}
          radius={150}
          duration={30}
          delay={(30 / OUTER_RING.length) * i}
          showPath={i === 0}
          reverse
        >
          <OrbitIcon icon={Icon} />
        </OrbitingCircles>
      ))}
    </div>
  );
}
