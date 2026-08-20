import { getCurrentBusiness, getCategories, getTransactions } from "@/lib/data/queries";
import { AddTransactionPanel } from "./panel";
import { TransactionFilters, TransactionList, TransactionStats } from "./ui";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; type?: string; frequency?: string; year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const business = (await getCurrentBusiness())!; // layout guarantees it exists
  const categories = await getCategories(business.id);

  // "Month" filter: translate a Year + Month selection into a from/to date range.
  const year = sp.year ? Number(sp.year) : undefined;
  const month = sp.month ? Number(sp.month) : undefined; // 1-12
  let from: string | undefined;
  let to: string | undefined;
  if (year && month) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();
    from = `${year}-${pad(month)}-01`;
    to = `${year}-${pad(month)}-${pad(lastDay)}`;
  } else if (year) {
    from = `${year}-01-01`;
    to = `${year}-12-31`;
  }

  const transactions = await getTransactions(business.id, {
    search: sp.q,
    categoryId: sp.category,
    type: sp.type === "revenue" || sp.type === "expense" ? sp.type : undefined,
    frequency:
      sp.frequency === "one-time" || sp.frequency === "monthly" || sp.frequency === "biweekly"
        ? sp.frequency
        : undefined,
    from,
    to,
    limit: 1000,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted">
            Add income and expenses, or import a bank CSV.
          </p>
        </div>
        <AddTransactionPanel categories={categories} />
      </div>

      <TransactionStats transactions={transactions} />

      <TransactionFilters categories={categories} current={sp} />
      <TransactionList transactions={transactions} categories={categories} />
    </div>
  );
}
