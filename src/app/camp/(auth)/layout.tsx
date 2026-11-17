import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import CampNav from "./CampNav";

export default async function CampAuthLayout({ children }: { children: React.ReactNode }) {
  const jar   = await cookies();
  const token = jar.get("admin_session")?.value;
  if (!token) redirect("/camp/login");

  const session = await db.adminSession.findUnique({
    where: { token },
    include: { user: { include: { permissions: true } } },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await db.adminSession.delete({ where: { token } }).catch(() => {});
    redirect("/camp/login");
  }

  const user: SessionUser = {
    email:       session.user.email,
    name:        session.user.name,
    role:        session.user.role,
    permissions: session.user.permissions,
  };

  // Camp must be enabled — super admin bypasses
  if (user.role !== "super") {
    const setting = await db.setting.findUnique({ where: { key: "camp_enabled" } });
    if (setting?.value !== "true") redirect("/camp/login?error=disabled");
  }

  // Must have at least camp:view
  if (!can(user, "camp", "view")) redirect("/camp/login?error=access");

  const rows = await db.setting.findMany({ where: { key: { in: ["event_title", "event_title_sub"] } } });
  const s    = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const eventTitle = s.event_title || "UTSAV SEVA";

  return <CampNav user={user} eventTitle={eventTitle}>{children}</CampNav>;
}
