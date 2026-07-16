"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/misc";
import { generateReportNow } from "@/lib/actions/reports";
import { formatDate } from "@/lib/utils";
import type { Report } from "@/types";

export function ReportsView({ reports }: { reports: Report[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    start(async () => {
      const res = await generateReportNow();
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={generate} disabled={pending}>
          <FileText className="h-4 w-4" />
          {pending ? "Generating…" : "Generate report now"}
        </Button>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Your first report will appear here — generate one now or wait for Monday."
        />
      ) : (
        reports.map((r) => <ReportCard key={r.id} report={r} />)
      )}
    </div>
  );
}

function ReportCard({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);
  const c = report.content;
  const emailTone =
    report.email_status === "sent" ? "success" : report.email_status === "failed" ? "danger" : "default";

  return (
    <Card>
      <CardContent className="pt-5">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <div>
            <p className="font-semibold text-foreground">
              Week of {formatDate(report.period_start)} – {formatDate(report.period_end)}
            </p>
            <p className="text-sm text-muted line-clamp-1">{c.summary}</p>
          </div>
          <Badge tone={emailTone}>
            <Mail className="mr-1 h-3 w-3" /> {report.email_status}
          </Badge>
        </button>

        {open ? (
          <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm">
            <Section title="Summary">
              <p>{c.summary}</p>
            </Section>
            <Section title="Cash flow">
              <p>{c.cashFlow}</p>
            </Section>
            <Section title="Flagged risks">
              <List items={c.risks} />
            </Section>
            <Section title="Growth opportunities">
              <List items={c.opportunities} />
            </Section>
            <Section title="Recommended actions">
              <List items={c.actions} />
            </Section>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase text-muted">{title}</p>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p className="text-muted">None</p>;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((i, idx) => (
        <li key={idx}>{i}</li>
      ))}
    </ul>
  );
}
