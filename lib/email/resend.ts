import "server-only";
import { Resend } from "resend";
import type { Business, ReportContent } from "@/types";

const FROM = process.env.RESEND_FROM_EMAIL ?? "Budgety <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function list(items: string[]): string {
  if (items.length === 0) return "<li>None</li>";
  return items.map((i) => `<li style="margin-bottom:6px">${escapeHtml(i)}</li>`).join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderReportEmail(business: Business, report: ReportContent, appUrl: string): string {
  return `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#0d9488;padding:20px 24px;color:#fff">
      <h1 style="margin:0;font-size:18px">Budgety — Weekly Report</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:.9">${escapeHtml(business.name)}</p>
    </div>
    <div style="padding:24px">
      <h2 style="font-size:15px;margin:0 0 8px">Summary</h2>
      <p style="font-size:14px;line-height:1.5;margin:0 0 16px">${escapeHtml(report.summary)}</p>

      <h2 style="font-size:15px;margin:16px 0 8px">Cash flow</h2>
      <p style="font-size:14px;line-height:1.5;margin:0 0 16px">${escapeHtml(report.cashFlow)}</p>

      <h2 style="font-size:15px;margin:16px 0 8px">Flagged risks</h2>
      <ul style="font-size:14px;line-height:1.5;padding-left:18px;margin:0 0 16px">${list(report.risks)}</ul>

      <h2 style="font-size:15px;margin:16px 0 8px">Growth opportunities</h2>
      <ul style="font-size:14px;line-height:1.5;padding-left:18px;margin:0 0 16px">${list(report.opportunities)}</ul>

      <h2 style="font-size:15px;margin:16px 0 8px">Recommended actions</h2>
      <ul style="font-size:14px;line-height:1.5;padding-left:18px;margin:0 0 16px">${list(report.actions)}</ul>

      <a href="${appUrl}/dashboard" style="display:inline-block;margin-top:8px;background:#0d9488;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px">Open dashboard</a>
    </div>
  </div>
</body></html>`;
}

/** Send a weekly report email. Returns true on success. */
export async function sendReportEmail(
  to: string,
  business: Business,
  report: ReportContent,
): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Your weekly financial report — ${business.name}`,
    html: renderReportEmail(business, report, appUrl),
  });
  return !error;
}
