import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentBusiness, getCategories, getTransactions } from "@/lib/data/queries";
import { AddTransaction, TransactionFilters, TransactionList } from "./ui";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const business = (await getCurrentBusiness())!; // layout guarantees it exists
  const categories = await getCategories(business.id);
  const transactions = await getTransactions(business.id, {
    search: sp.q,
    categoryId: sp.category,
    type: sp.type === "revenue" || sp.type === "expense" ? sp.type : undefined,
    limit: 500,
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
        <Link href="/transactions/import">
          <Button variant="outline">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
        </Link>
      </div>

      <AddTransaction categories={categories} />
      <TransactionFilters categories={categories} current={sp} />
      <TransactionList transactions={transactions} categories={categories} />
    </div>
  );
}
