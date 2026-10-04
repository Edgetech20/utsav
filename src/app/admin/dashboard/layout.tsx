import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

const SECRET = process.env.ADMIN_SECRET ?? "";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const auth = jar.get("admin_auth")?.value;

  if (!auth || auth !== SECRET) {
    redirect("/admin/login?from=/admin/dashboard");
  }

  return <Sidebar>{children}</Sidebar>;
}
