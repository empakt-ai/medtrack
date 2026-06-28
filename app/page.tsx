import { redirect } from "next/navigation";
import { getMemberContext, homeForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Entry point — route to the right place based on session + membership. */
export default async function RootPage() {
  const ctx = await getMemberContext();
  if (!ctx) redirect("/auth/sign-in");
  redirect(homeForRole(ctx.member?.role));
}
