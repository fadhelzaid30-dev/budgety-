import type { NormalizedTx } from "./mapping";
import type { Transaction } from "@/types";

/**
 * Duplicate detection for CSV import.
 *
 * Re-uploading the same bank export used to insert every row a second time,
 * silently doubling revenue, expenses, the health score, and every figure the
 * AI reasons over. There's no database constraint that can fix this, because
 * genuine duplicates are legal — two $4.50 coffees on the same day with the
 * same description is a real thing that happens. So the import detects overlap
 * and lets the user decide, defaulting to skipping them.
 *
 * A transaction is "the same" if date, signed amount, type, and normalized
 * description all match. Description is lowercased and whitespace-collapsed so
 * trivial formatting differences between two exports of the same data don't
 * defeat the check.
 */
export function fingerprint(tx: {
  occurred_on: string;
  amount: number;
  type: string;
  description: string;
}): string {
  const desc = tx.description.trim().toLowerCase().replace(/\s+/g, " ");
  // Fixed 2dp so 12.5 and 12.50 collapse to the same key.
  return `${tx.occurred_on}|${tx.amount.toFixed(2)}|${tx.type}|${desc}`;
}

export interface DuplicateScan {
  /** Indices into the input array that match something already stored. */
  duplicateIndexes: number[];
  /** Rows with no match — safe to import. */
  unique: NormalizedTx[];
  /** Rows that matched. */
  duplicates: NormalizedTx[];
}

/**
 * Compares incoming rows against transactions already in the database.
 *
 * Counts repeats *within* the same file too: if a file legitimately contains
 * the same transaction twice and the database already holds one copy, the
 * first is a duplicate and the second is still importable, so the stored
 * multiplicity is tracked rather than treated as a boolean.
 */
export function scanForDuplicates(
  incoming: NormalizedTx[],
  existing: Pick<Transaction, "occurred_on" | "amount" | "type" | "description">[],
): DuplicateScan {
  const remaining = new Map<string, number>();
  for (const e of existing) {
    const key = fingerprint({
      occurred_on: e.occurred_on,
      amount: Number(e.amount),
      type: e.type,
      description: e.description ?? "",
    });
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }

  const duplicateIndexes: number[] = [];
  const unique: NormalizedTx[] = [];
  const duplicates: NormalizedTx[] = [];

  incoming.forEach((tx, i) => {
    const key = fingerprint(tx);
    const left = remaining.get(key) ?? 0;
    if (left > 0) {
      remaining.set(key, left - 1);
      duplicateIndexes.push(i);
      duplicates.push(tx);
    } else {
      unique.push(tx);
    }
  });

  return { duplicateIndexes, unique, duplicates };
}

/** Inclusive date range covering the rows, for scoping the existing-rows query. */
export function dateRange(rows: NormalizedTx[]): { from: string; to: string } | null {
  if (rows.length === 0) return null;
  let from = rows[0].occurred_on;
  let to = rows[0].occurred_on;
  for (const r of rows) {
    if (r.occurred_on < from) from = r.occurred_on;
    if (r.occurred_on > to) to = r.occurred_on;
  }
  return { from, to };
}
