// Pure helpers for turning arbitrary bank-CSV rows into normalized transactions.
// Shared by the client preview and the server import route so both agree exactly.

export type TypeStrategy = "sign" | "column" | "all-expense" | "all-revenue";

export interface ColumnMapping {
  date: string; // source header
  amount: string;
  description: string;
  typeStrategy: TypeStrategy;
  typeColumn?: string; // when typeStrategy === "column"
  expenseIsNegative: boolean; // when typeStrategy === "sign"
}

export type RawRow = Record<string, string>;

export interface NormalizedTx {
  amount: number; // always positive; `type` carries direction
  occurred_on: string; // yyyy-mm-dd
  description: string;
  type: "revenue" | "expense";
  sourceIndex: number; // index into the original rows array (for raw_import provenance)
}

export interface NormalizeResult {
  valid: NormalizedTx[];
  errors: { row: number; message: string }[];
}

/** Parse a currency-ish string to a signed number. Handles $, commas, (123) negatives. */
export function parseAmount(input: string): number | null {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$,\s]/g, "");
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Flexible date parser → yyyy-mm-dd. Supports ISO, mm/dd/yyyy, dd-mm-yyyy, etc. */
export function parseDateFlexible(input: string): string | null {
  if (!input) return null;
  const s = String(input).trim();

  // Already ISO yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // mm/dd/yyyy or dd/mm/yyyy (assume US mm/dd) with / or -
  const parts = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const [, a, b, y] = parts;
    let year = Number(y);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    const month = Number(a);
    const day = Number(b);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // Fallback to Date parsing (e.g. "Jan 5, 2026")
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  }
  return null;
}

function deriveType(
  row: RawRow,
  signedAmount: number,
  mapping: ColumnMapping,
): "revenue" | "expense" {
  switch (mapping.typeStrategy) {
    case "all-revenue":
      return "revenue";
    case "all-expense":
      return "expense";
    case "column": {
      const val = (row[mapping.typeColumn ?? ""] ?? "").toLowerCase();
      if (/credit|deposit|income|revenue|in\b/.test(val)) return "revenue";
      return "expense";
    }
    case "sign":
    default: {
      const isNegative = signedAmount < 0;
      // If expenses are entered as negatives, a negative row is an expense.
      return isNegative === mapping.expenseIsNegative ? "expense" : "revenue";
    }
  }
}

/** Normalize raw rows using the mapping, collecting per-row errors. */
export function normalizeRows(rows: RawRow[], mapping: ColumnMapping): NormalizeResult {
  const valid: NormalizedTx[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, i) => {
    const rowNo = i + 1;
    const signed = parseAmount(row[mapping.amount]);
    if (signed == null || signed === 0) {
      errors.push({ row: rowNo, message: "Missing or invalid amount" });
      return;
    }
    const date = parseDateFlexible(row[mapping.date]);
    if (!date) {
      errors.push({ row: rowNo, message: "Unrecognized date" });
      return;
    }
    const type = deriveType(row, signed, mapping);
    valid.push({
      amount: Math.abs(signed),
      occurred_on: date,
      description: (row[mapping.description] ?? "").trim().slice(0, 300),
      type,
      sourceIndex: i,
    });
  });

  return { valid, errors };
}
