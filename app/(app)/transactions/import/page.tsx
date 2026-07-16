import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CsvImport } from "./import-client";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/transactions"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to transactions
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Import from CSV</h1>
        <p className="text-sm text-muted">
          Export transactions from your bank, upload the file, then map the columns.
        </p>
      </div>
      <CsvImport />
    </div>
  );
}
