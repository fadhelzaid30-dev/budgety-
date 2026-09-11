"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/**
 * Global search. Previously a permanently `disabled` input that looked like a
 * feature and wasn't one — it now runs a real description search by handing
 * the query to the transactions page, which already supports `?q=`.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (term) router.push(`/transactions?q=${encodeURIComponent(term)}`);
      }}
      className="ml-auto hidden h-10 w-[300px] items-center gap-2 rounded-full border border-border bg-background-alt px-3.5 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 lg:flex"
    >
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search transactions…"
        aria-label="Search transactions"
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
      />
    </form>
  );
}
