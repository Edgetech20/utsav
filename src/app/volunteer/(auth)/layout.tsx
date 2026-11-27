import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import VolNav from "./VolNav";

export default async function VolunteerAuthLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("admin_session")?.value;
  if (!token) redirect("/volunteer/login");

  const session = await db.adminSession.findUnique({
    where: { token },
    include: { user: { include: { permissions: true } } },
  });
  if (!session || session.expiresAt < new Date()) redirect("/volunteer/login");

  const user: SessionUser = {
    email: session.user.email, name: session.user.name,
    role: session.user.role, permissions: session.user.permissions,
  };
  if (!can(user, "volunteer", "view")) redirect("/volunteer/login?error=access");

  const title = await db.setting.findUnique({ where: { key: "event_title" } });
  return <VolNav user={user} eventTitle={title?.value || "UTSAV SEVA"}>{children}</VolNav>;
}
