import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

export const WA_CONFIG_DEFAULTS: Record<string, string> = {
  wa_interval_min: "90",
  wa_interval_max: "120",
  wa_daily_cap:    "50",
  wa_hours_from:   "9",
  wa_hours_to:     "20",
};

const KEYS = Object.keys(WA_CONFIG_DEFAULTS);

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const rows = await db.setting.findMany({ where: { key: { in: KEYS } } });
  const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return NextResponse.json(
    Object.fromEntries(KEYS.map(k => [k, map[k] ?? WA_CONFIG_DEFAULTS[k]]))
  );
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "whatsapp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: Record<string, string> = await req.json();
  const keys = KEYS.filter(k => k in body);

  await Promise.all(keys.map(k =>
    db.setting.upsert({
      where:  { key: k },
      update: { value: String(body[k]) },
      create: { key: k, value: String(body[k]) },
    })
  ));

  return NextResponse.json({ ok: true });
}
