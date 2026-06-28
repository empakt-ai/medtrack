import { createClient } from "@/lib/supabase/server";
import type { MedicationWithRelations, Member } from "@/lib/types";

/** Patients (role = patient) in a family group, alphabetical. */
export async function getPatients(groupId: string): Promise<Member[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("mt_members")
    .select("*")
    .eq("family_group_id", groupId)
    .eq("role", "patient")
    .order("display_name");
  return (data ?? []) as Member[];
}

/** All members of a family group (patients + caretakers). */
export async function getMembers(groupId: string): Promise<Member[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("mt_members")
    .select("*")
    .eq("family_group_id", groupId)
    .order("role")
    .order("display_name");
  return (data ?? []) as Member[];
}

/** Active medications (with schedules + inventory), optionally for one patient. */
export async function getMedications(
  groupId: string,
  patientId?: string,
): Promise<MedicationWithRelations[]> {
  const supabase = createClient();
  let query = supabase
    .from("mt_medications")
    .select("*, mt_schedules(*), mt_inventory(*)")
    .eq("family_group_id", groupId)
    .eq("is_active", true);
  if (patientId) query = query.eq("patient_id", patientId);
  const { data } = await query.order("name");
  return (data ?? []) as MedicationWithRelations[];
}
