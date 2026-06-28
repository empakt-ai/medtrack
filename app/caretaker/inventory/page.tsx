import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { getMedications, getPatients } from "@/lib/queries";
import { dailyConsumption } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav, CARETAKER_NAV } from "@/components/BottomNav";
import { Avatar } from "@/components/ui/Avatar";
import { InventoryClient, type InventoryRow } from "@/components/caretaker/InventoryClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const { member } = await requireMember("caretaker");
  const [patients, meds] = await Promise.all([
    getPatients(member.family_group_id),
    getMedications(member.family_group_id),
  ]);
  const nameById = Object.fromEntries(patients.map((p) => [p.id, p.display_name]));

  const rows: InventoryRow[] = meds.map((med) => {
    const inv = med.mt_inventory?.[0];
    return {
      medicationId: med.id,
      name: med.name,
      patientName: nameById[med.patient_id] ?? "—",
      quantityRemaining: inv?.quantity_remaining ?? 0,
      lowStockThresholdDays: inv?.low_stock_threshold_days ?? 7,
      unit: inv?.unit ?? med.dosage_unit ?? "",
      perDay: dailyConsumption(med.mt_schedules ?? []),
    };
  });

  return (
    <AppShell
      header={<AppHeader right={<Avatar name={member.display_name} size={40} />} />}
      nav={<BottomNav items={CARETAKER_NAV} />}
    >
      <h2 className="mb-6 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
        Inventory
      </h2>
      <InventoryClient initialRows={rows} />
    </AppShell>
  );
}
