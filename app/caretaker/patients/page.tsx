import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMedications, getPatients } from "@/lib/queries";
import { toDateKey } from "@/lib/utils";
import { computePatientSummary, STATUS_META } from "@/lib/caretaker";
import type { MedicationWithRelations } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav, CARETAKER_NAV } from "@/components/BottomNav";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/Icon";
import { AddPatient } from "@/components/caretaker/AddPatient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Patients" };

export default async function PatientsPage() {
  const { member } = await requireMember("caretaker");
  const supabase = createClient();
  const now = new Date();
  const today = toDateKey(now);

  const [patients, meds] = await Promise.all([
    getPatients(member.family_group_id),
    getMedications(member.family_group_id),
  ]);

  const patientIds = patients.map((p) => p.id);
  let logs: { schedule_id: string; status: string; patient_id: string }[] = [];
  if (patientIds.length) {
    const { data } = await supabase
      .from("mt_logs")
      .select("schedule_id,status,patient_id")
      .eq("log_date", today)
      .in("patient_id", patientIds);
    logs = data ?? [];
  }

  const logsByPatient: Record<string, Record<string, { status: string }>> = {};
  for (const l of logs) (logsByPatient[l.patient_id] ??= {})[l.schedule_id] = { status: l.status };
  const medsByPatient: Record<string, MedicationWithRelations[]> = {};
  for (const m of meds) (medsByPatient[m.patient_id] ??= []).push(m);

  return (
    <AppShell
      header={<AppHeader right={<Avatar name={member.display_name} size={40} />} />}
      nav={<BottomNav items={CARETAKER_NAV} />}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Patients</h2>
      </div>

      <div className="space-y-4">
        {patients.map((patient) => {
          const summary = computePatientSummary(
            patient,
            medsByPatient[patient.id] ?? [],
            logsByPatient[patient.id] ?? {},
            now,
          );
          const meta = STATUS_META[summary.status];
          const medCount = (medsByPatient[patient.id] ?? []).length;
          return (
            <Link
              key={patient.id}
              href={`/caretaker/patients/${patient.id}`}
              className="flex items-center gap-4 rounded-xl bg-surface-container-lowest p-4 soft-elevation transition-transform active:scale-[0.98]"
            >
              <Avatar name={patient.display_name} size={56} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-button-text text-button-text text-on-surface">
                  {patient.display_name}
                </h3>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  {medCount} medication{medCount === 1 ? "" : "s"} · {summary.taken}/{summary.due}{" "}
                  today
                </p>
              </div>
              <Chip tone={meta.tone} icon={meta.icon}>
                {meta.label}
              </Chip>
              <Icon name="chevron_right" className="text-on-surface-variant" />
            </Link>
          );
        })}

        {patients.length === 0 && (
          <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest/50 px-6 py-8 text-center font-body-md text-body-md text-on-surface-variant">
            No patients yet. Add one below, or share your invite code from Settings so they can
            join.
          </p>
        )}

        <div className="pt-2">
          <AddPatient />
        </div>
      </div>
    </AppShell>
  );
}
