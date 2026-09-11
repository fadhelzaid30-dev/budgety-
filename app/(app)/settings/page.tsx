import type { Metadata } from "next";
import { getCurrentBusiness } from "@/lib/data/queries";
import { SettingsForm } from "./ui";

export const metadata: Metadata = { title: "Settings — Budgety" };

/**
 * Business profile settings.
 *
 * These fields were previously only editable during onboarding, and the
 * sidebar's "Settings" link pointed at /dashboard — so a typo in the cash
 * balance (which drives runway, the health score, and every AI answer) was
 * permanent.
 */
export default async function SettingsPage() {
  const business = (await getCurrentBusiness())!;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted">
          Your business profile. These numbers drive your health score and
          everything the AI CFO tells you.
        </p>
      </div>

      <SettingsForm business={business} />
    </div>
  );
}
