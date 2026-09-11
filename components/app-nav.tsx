"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Lightbulb,
  MessageSquare,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/assistant", label: "AI CFO", icon: MessageSquare },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function AppNav({
  variant = "mobile",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              variant === "sidebar"
                ? active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
                : active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
