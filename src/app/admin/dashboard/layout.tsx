import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserByToken } from "@/lib/auth";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get("admin_session")?.value;

  const user = await getUserByToken(token);
  if (!user) redirect("/login");

  const rows = await db.setting.findMany({ where: { key: { in: ["event_title", "event_title_sub"] } } });
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const eventTitle = `${s.event_title || "প্ৰিয়বোধী"} ${s.event_title_sub || "মহোৎসব"}`;

  return <Sidebar eventTitle={eventTitle} user={user}>{children}</Sidebar>;
}
