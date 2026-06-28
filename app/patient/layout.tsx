import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav, PATIENT_NAV } from "@/components/BottomNav";
import { Avatar } from "@/components/ui/Avatar";
import { PwaManager } from "@/components/pwa/PwaManager";

export const dynamic = "force-dynamic";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const { member } = await requireMember("patient");

  return (
    <AppShell
      header={<AppHeader right={<Avatar name={member.display_name} size={40} />} />}
      nav={<BottomNav items={PATIENT_NAV} />}
    >
      {children}
      <PwaManager memberId={member.id} />
    </AppShell>
  );
}
