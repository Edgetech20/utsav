import { db } from "@/lib/db";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await db.setting.findMany();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return <HomeClient initialSettings={settings} />;
}
