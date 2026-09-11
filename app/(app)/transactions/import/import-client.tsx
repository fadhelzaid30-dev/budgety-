"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Papa from "papaparse";
import { CheckCircle2, FileUp, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Label, Select } from "@/components/ui/input";
import {
  guessColumn,
  normalizeRows,
  type ColumnMapping,
  type RawRow,
  type TypeStrategy,
} from "@/lib/csv/mapping";
import { formatCurrency, formatDate } from "@/lib/utils";

type Stage = "upload" | "map" | "done";

export function CsvImport() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    duplicatesSkipped: number;
  } | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const [mapping, setMapping] = useState<ColumnMapping>({
    date: "",
    amount: "",
    description: "",
    typeStrategy: "sign",
    typeColumn: "",
    expenseIsNegative: true,
  });

  function onFile(file: File) {
    setError(null);
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = (res.meta.fields ?? []).filter(Boolean);
        if (hdrs.length === 0 || res.data.length === 0) {
          setError("Couldn't read any rows. Is this a CSV with a header row?");
          return;
        }
        setHeaders(hdrs);
        setRows(res.data);
        // Auto-detect a type/direction column (e.g. "Type", "Debit/Credit").
        // If present, default to reading direction from it rather than the amount sign,
        // so CSVs with all-positive amounts + a Type column import correctly.
        const typeCol = guessColumn(hdrs, ["type", "direction", "dr/cr", "debit/credit", "flow"]);
        setMapping((m) => ({
          ...m,
          date: guessColumn(hdrs, ["date", "posted", "time"]),
          amount: guessColumn(hdrs, ["amount", "debit", "value", "total"]),
          description: guessColumn(hdrs, ["description", "memo", "name", "detail", "payee"]),
          typeStrategy: typeCol ? "column" : m.typeStrategy,
          typeColumn: typeCol,
        }));
        setStage("map");
      },
      error: (err) => setError(err.message),
    });
  }

  const preview = useMemo(() => {
    if (!mapping.date || !mapping.amount) return null;
    return normalizeRows(rows.slice(0, 200), mapping);
  }, [rows, mapping]);

  async function doImport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, mapping, skipDuplicates }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setResult({
        imported: data.imported,
        skipped: data.skipped,
        duplicatesSkipped: data.duplicatesSkipped ?? 0,
      });
      setStage("done");
    } catch {
      setError("Network error during import.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "done" && result) {
    const nothing = result.imported === 0;
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              nothing ? "bg-warning/10" : "bg-success/10"
            }`}
          >
            {nothing ? (
              <TriangleAlert className="h-6 w-6 text-warning" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-success" />
            )}
          </div>
          <p className="text-lg font-semibold text-foreground">
            {nothing
              ? "Nothing new to import"
              : `Imported ${result.imported} transaction${result.imported === 1 ? "" : "s"}`}
          </p>
          <div className="space-y-1 text-sm text-muted">
            {result.duplicatesSkipped > 0 ? (
              <p>
                {result.duplicatesSkipped} row
                {result.duplicatesSkipped === 1 ? " was" : "s were"} already in your
                transactions and {result.duplicatesSkipped === 1 ? "was" : "were"} skipped.
              </p>
            ) : null}
            {result.skipped > 0 ? (
              <p>{result.skipped} row(s) skipped — invalid date or amount.</p>
            ) : null}
          </div>
          <Button className="mt-2" onClick={() => router.push("/transactions")}>
            View transactions
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stage === "upload") {
    return (
      <Card>
        <CardContent className="py-8">
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center hover:bg-accent"
          >
            <FileUp className="h-8 w-8 text-muted" />
            <span className="text-sm font-medium text-foreground">Choose a CSV file</span>
            <span className="text-xs text-muted">Most bank exports work. We&apos;ll map the columns next.</span>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>
          {error ? <Alert tone="danger" className="mt-3">{error}</Alert> : null}
        </CardContent>
      </Card>
    );
  }

  // stage === "map"
  return (
    <div className="space-y-4">
      {error ? (
        <Alert tone="danger">{error}</Alert>
      ) : null}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <h2 className="font-semibold text-foreground">Map your columns</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <MapField label="Date column" value={mapping.date} headers={headers}
              onChange={(v) => setMapping({ ...mapping, date: v })} />
            <MapField label="Amount column" value={mapping.amount} headers={headers}
              onChange={(v) => setMapping({ ...mapping, amount: v })} />
            <MapField label="Description column" value={mapping.description} headers={headers}
              onChange={(v) => setMapping({ ...mapping, description: v })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="type-strategy">How is income vs. expense determined?</Label>
              <Select
                id="type-strategy"
                value={mapping.typeStrategy}
                onChange={(e) =>
                  setMapping({ ...mapping, typeStrategy: e.target.value as TypeStrategy })
                }
              >
                <option value="sign">By amount sign (+/−)</option>
                <option value="column">A separate column says so</option>
                <option value="all-expense">All rows are expenses</option>
                <option value="all-revenue">All rows are revenue</option>
              </Select>
            </div>
            {mapping.typeStrategy === "sign" ? (
              <div>
                <Label htmlFor="sign-conv">Negative amounts are…</Label>
                <Select
                  id="sign-conv"
                  value={mapping.expenseIsNegative ? "expense" : "revenue"}
                  onChange={(e) =>
                    setMapping({ ...mapping, expenseIsNegative: e.target.value === "expense" })
                  }
                >
                  <option value="expense">Expenses (money out)</option>
                  <option value="revenue">Revenue (money in)</option>
                </Select>
              </div>
            ) : null}
            {mapping.typeStrategy === "column" ? (
              <MapField label="Type column" value={mapping.typeColumn ?? ""} headers={headers}
                onChange={(v) => setMapping({ ...mapping, typeColumn: v })} />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Preview</h2>
              <span className="text-sm text-muted">
                {preview.valid.length} valid · {preview.errors.length} skipped (of {Math.min(rows.length, 200)} shown)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.valid.slice(0, 8).map((t, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-muted">{formatDate(t.occurred_on)}</td>
                      <td className="px-3 py-2">{t.description || "—"}</td>
                      <td className="px-3 py-2">{t.type}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted">Select at least the date and amount columns to preview.</p>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-sm border-border accent-[var(--primary)]"
            />
            <span>
              <span className="font-medium text-foreground">Skip rows I already have</span>
              <span className="mt-0.5 block text-xs text-muted">
                Matches on date, amount, type and description. Leave this on unless
                you&apos;re deliberately importing genuine repeat transactions.
              </span>
            </span>
          </label>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStage("upload")}>
              Choose another file
            </Button>
            <Button
              onClick={doImport}
              loading={busy}
              disabled={!mapping.date || !mapping.amount || (preview?.valid.length ?? 0) === 0}
            >
              Import {rows.length} row{rows.length === 1 ? "" : "s"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MapField({
  label,
  value,
  headers,
  onChange,
}: {
  label: string;
  value: string;
  headers: string[];
  onChange: (v: string) => void;
}) {
  const id = `map-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {headers.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </Select>
    </div>
  );
}
