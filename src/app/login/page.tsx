import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserByToken } from "@/lib/auth";
import { userModules } from "@/lib/modules";
import ModuleLogin from "./ModuleLogin";
import Launcher from "./Launcher";

// One sign-in for every module. Signed out → OTP form. Signed in → the only module
// they have, or a launcher to pick one.
export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp    = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const [user, rows] = await Promise.all([
    getUserByToken((await cookies()).get("admin_session")?.value),
    db.setting.findMany({ where: { key: { in: ["event_title", "event_title_sub", "event_subtitle", "event_date", "event_venue"] } } }),
  ]);
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const event = [s.event_title, s.event_title_sub].filter(Boolean).join(" ") || "Admin";

  if (!user) return (
    <ModuleLogin home="/login" brand={{
      title: s.event_title || "Admin", titleSub: s.event_title_sub ?? null,
      subtitle: s.event_subtitle ?? null, date: s.event_date ?? null, venue: s.event_venue ?? null,
    }} />
  );

  const modules = await userModules(user);
  // after an access error, stay here so a mismatch can't bounce back and forth
  if (!error && modules.length === 1) redirect(modules[0].href);
  return <Launcher event={event} name={user.name || user.email.split("@")[0]} email={user.email} modules={modules} error={error} />;
}
