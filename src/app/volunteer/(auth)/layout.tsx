import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, getUserByToken } from "@/lib/auth";
import VolNav from "./VolNav";

export default async function VolunteerAuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserByToken((await cookies()).get("admin_session")?.value);
  if (!user) redirect("/login");
  if (!can(user, "volunteer", "view")) redirect("/login?error=access");

  const title = await db.setting.findUnique({ where: { key: "event_title" } });
  return <VolNav user={user} eventTitle={title?.value || "UTSAV SEVA"}>{children}</VolNav>;
}
