import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

// Camp-scoped settings — readable by camp:view, writable by camp:edit
const CAMP_KEYS = ["camp_form_slug"] as const;

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db.setting.findMany({ where: { key: { in: [...CAMP_KEYS] } } });
  return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: Record<string, string> = await req.json();

  await Promise.all(
    CAMP_KEYS.filter(k => k in body).map(k =>
      db.setting.upsert({
        where:  { key: k },
        update: { value: body[k] ?? "" },
        create: { key: k, value: body[k] ?? "" },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
