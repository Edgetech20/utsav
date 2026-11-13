import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

const ALLOWED_KEYS = [
  "social_facebook", "social_instagram", "social_youtube",
  "social_whatsapp", "social_twitter", "social_website",
  "event_honorific_line1", "event_honorific_line2",
  "event_title", "event_title_sub", "event_edition",
  "event_date", "event_date_iso", "event_venue",
  "event_maps_url", "event_maps_embed", "event_subtitle",
  "contact_organiser", "contact_phone", "contact_whatsapp", "contact_email",
  "session_timeout_hours",
  "rsvp_field_config",
];

export async function GET() {
  const rows = await db.setting.findMany({ where: { key: { in: ALLOWED_KEYS } } });
  const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "settings", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: Record<string, string> = await req.json();
  const keys = ALLOWED_KEYS.filter(k => k in body);

  // Gather old values for changelog
  const oldRows = await db.setting.findMany({ where: { key: { in: keys } } });
  const oldMap = Object.fromEntries(oldRows.map(r => [r.key, r.value]));

  await Promise.all(
    keys.map(k =>
      db.setting.upsert({
        where:  { key: k },
        update: { value: body[k]?.trim() ?? "" },
        create: { key: k, value: body[k]?.trim() ?? "" },
      })
    )
  );

  // Log each changed key
  const ip = getIp(req);
  await Promise.all(
    keys
      .filter(k => oldMap[k] !== (body[k]?.trim() ?? ""))
      .map(k => logChange(user.email, "update", `setting:${k}`, { from: oldMap[k] ?? "", to: body[k]?.trim() ?? "" }, ip))
  );

  return NextResponse.json({ ok: true });
}
