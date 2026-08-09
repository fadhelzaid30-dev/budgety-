// Pure date-generation for recurring transactions. Given a frequency, a target
// year, and an anchor date, returns every occurrence date (yyyy-mm-dd) that
// falls within that year — used to auto-fill a monthly or biweekly transaction
// across Jan–Dec so a business doesn't have to enter it 12–26 times by hand.

export type RecurrenceFrequency = "monthly" | "biweekly";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a yyyy-mm-dd string as a local date (avoids UTC off-by-one issues). */
function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Generate the occurrence dates for a recurring transaction within `year`.
 *
 * - "monthly": one date per calendar month (Jan–Dec), reusing the anchor's
 *   day-of-month, clamped to the last day of shorter months (e.g. an anchor
 *   of the 31st becomes the 28th/29th in February, the 30th in April, etc.).
 * - "biweekly": every 14 days, anchored so the cadence (which day of the
 *   14-day cycle) matches `anchorDate`, covering the full year — not just
 *   forward from the anchor. Produces ~26 dates per year.
 */
export function generateRecurrenceDates(
  frequency: RecurrenceFrequency,
  year: number,
  anchorDate: string,
): string[] {
  const anchor = parseIsoLocal(anchorDate);

  if (frequency === "monthly") {
    const day = anchor.getDate();
    const dates: string[] = [];
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      dates.push(toIso(new Date(year, month, Math.min(day, daysInMonth))));
    }
    return dates;
  }

  // biweekly: walk the anchor backward in 14-day steps until it's on or before
  // Jan 1 of `year`, then walk forward collecting every date through Dec 31.
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  const cursor = new Date(anchor);
  while (cursor > jan1) cursor.setDate(cursor.getDate() - 14);

  const dates: string[] = [];
  while (cursor <= dec31) {
    if (cursor >= jan1) dates.push(toIso(cursor));
    cursor.setDate(cursor.getDate() + 14);
  }
  return dates;
}
