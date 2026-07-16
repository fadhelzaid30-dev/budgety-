import { getCurrentBusiness } from "@/lib/data/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { ReportsView } from "./ui";
import type { Report } from "@/types";

export default async function ReportsPage() {
  const business = (await getCurrentBusiness())!;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Weekly reports</h1>
        <p className="text-sm text-muted">
          Auto-generated every Monday and emailed to you. Generate one anytime below.
        </p>
      </div>
      <ReportsView reports={(data as Report[]) ?? []} />
    </div>
  );
}
