import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const DEFAULTS: Record<string, { name: string; body: string }> = {
  rsvp_auto: {
    name: "RSVP Auto-Message",
    body:
      `Namaskar {name} 🙏\n\n` +
      `We have received your registration for Priyabodhi Mahotsav on 20 December.\n\n` +
      `Thank you for letting us know. We look forward to your presence.\n\n` +
      `Jai Guru!`,
  },
  accommodation_auto: {
    name: "Accommodation Auto-Message",
    body:
      `Namaskar {name} 🙏\n\n` +
      `Your accommodation registration for Priyabodhi Mahotsav has been received.\n\n` +
      `We will confirm your arrangements shortly. Thank you.\n\n` +
      `Jai Guru!`,
  },
  vehicle_auto: {
    name: "Vehicle / Parking Auto-Message",
    body:
      `Namaskar {name} 🙏\n\n` +
      `Your vehicle registration for Priyabodhi Mahotsav has been received.\n\n` +
      `Parking arrangements will be communicated closer to the event. Thank you.\n\n` +
      `Jai Guru!`,
  },
};

// GET — return all templates (seed missing ones)
export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const templates = await Promise.all(
    Object.entries(DEFAULTS).map(async ([key, def]) => {
      const existing = await db.waTemplate.findUnique({ where: { key } });
      if (existing) return existing;
      return db.waTemplate.create({ data: { key, name: def.name, body: def.body, enabled: true } });
    })
  );
  return NextResponse.json(templates);
}

// PUT — update body and/or enabled for a given key
export async function PUT(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { key, body, enabled } = await req.json();
  if (!key || !DEFAULTS[key]) return NextResponse.json({ error: "invalid key" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body    !== undefined) data.body    = body.trim();
  if (enabled !== undefined) data.enabled = enabled;

  const tpl = await db.waTemplate.upsert({
    where:  { key },
    update: data,
    create: { key, name: DEFAULTS[key].name, body: body?.trim() ?? DEFAULTS[key].body, enabled: enabled ?? true },
  });
  return NextResponse.json(tpl);
}
