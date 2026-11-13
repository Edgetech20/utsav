import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get("admin_session")?.value;

  if (!token) redirect("/admin/login?from=/admin/dashboard");

  const session = await db.adminSession.findUnique({
    where: { token },
    include: { user: { include: { permissions: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await db.adminSession.delete({ where: { token } }).catch(() => {});
    redirect("/admin/login?from=/admin/dashboard");
  }

  const user: SessionUser = {
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    permissions: session.user.permissions,
  };

  const rows = await db.setting.findMany({ where: { key: { in: ["event_title", "event_title_sub"] } } });
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const eventTitle = `${s.event_title || "প্ৰিয়বোধী"} ${s.event_title_sub || "মহোৎসব"}`;

  return <Sidebar eventTitle={eventTitle} user={user}>{children}</Sidebar>;
}
