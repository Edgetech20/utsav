import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, getUserByToken } from "@/lib/auth";
import CampNav from "./CampNav";

export default async function CampAuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserByToken((await cookies()).get("admin_session")?.value);
  if (!user) redirect("/login");

  // Camp must be enabled — super admin bypasses
  if (user.role !== "super") {
    const setting = await db.setting.findUnique({ where: { key: "camp_enabled" } });
    if (setting?.value !== "true") redirect("/login?error=disabled");
  }

  // Must have at least camp:view
  if (!can(user, "camp", "view")) redirect("/login?error=access");

  const rows = await db.setting.findMany({ where: { key: { in: ["event_title", "event_title_sub"] } } });
  const s    = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const eventTitle = s.event_title || "UTSAV SEVA";

  return <CampNav user={user} eventTitle={eventTitle}>{children}</CampNav>;
}
