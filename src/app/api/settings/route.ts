import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED_KEYS = [
  "social_facebook", "social_instagram", "social_youtube",
  "social_whatsapp", "social_twitter", "social_website",
  "event_date", "event_date_iso", "event_venue",
  "event_maps_url", "event_maps_embed",
  "contact_organiser", "contact_phone", "contact_whatsapp", "contact_email",
];

export async function GET() {
  const rows = await db.setting.findMany({ where: { key: { in: ALLOWED_KEYS } } });
  const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const body: Record<string, string> = await req.json();
  await Promise.all(
    ALLOWED_KEYS
      .filter(k => k in body)
      .map(k =>
        db.setting.upsert({
          where:  { key: k },
          update: { value: body[k]?.trim() ?? "" },
          create: { key: k, value: body[k]?.trim() ?? "" },
        })
      )
  );
  return NextResponse.json({ ok: true });
}
