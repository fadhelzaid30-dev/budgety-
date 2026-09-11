"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Alert } from "@/components/ui/alert";
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
        <Alert tone="danger">
          {error}
        </Alert>
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
      <CardContent className="flex gap-4 pt-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-alt text-muted">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                Week of {formatDate(report.period_start)} – {formatDate(report.period_end)}
              </p>
              <p className="text-sm text-muted line-clamp-1">{c.summary}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={emailTone}>
                <Mail className="mr-1 h-3 w-3" /> {report.email_status}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-label={open ? "Collapse report" : "Expand report"}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>

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
        </div>
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
