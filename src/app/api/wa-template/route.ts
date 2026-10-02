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

// GET — return all templates: seeded defaults + any dynamic form templates
export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;

  // seed the 3 fixed templates if missing
  const fixed = await Promise.all(
    Object.entries(DEFAULTS).map(async ([key, def]) => {
      const existing = await db.waTemplate.findUnique({ where: { key } });
      if (existing) return existing;
      return db.waTemplate.create({ data: { key, name: def.name, body: def.body, enabled: true } });
    })
  );

  // seed missing WaTemplates for any existing dynamic forms
  const forms = await db.dynamicForm.findMany({ select: { name: true, slug: true } });
  await Promise.all(
    forms.map(f =>
      db.waTemplate.upsert({
        where:  { key: `form_${f.slug}` },
        create: {
          key:     `form_${f.slug}`,
          name:    `${f.name} Auto-Message`,
          body:    `Namaskar {name} 🙏\n\nYour ${f.name} registration has been received.\n\nThank you!\n\nJai Guru!`,
          enabled: false,
        },
        update: {},
      })
    )
  );

  // return all form_ templates
  const formTpls = await db.waTemplate.findMany({
    where: { key: { startsWith: "form_" } },
    orderBy: { key: "asc" },
  });

  return NextResponse.json([...fixed, ...formTpls]);
}

// PUT — update body and/or enabled; allows both fixed keys and form_ keys
export async function PUT(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { key, body, enabled } = await req.json();
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const isFixed = key in DEFAULTS;
  const isDynamic = typeof key === "string" && key.startsWith("form_");
  if (!isFixed && !isDynamic) return NextResponse.json({ error: "invalid key" }, { status: 400 });

  const existing = await db.waTemplate.findUnique({ where: { key } });
  if (!existing) return NextResponse.json({ error: "template not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body    !== undefined) data.body    = body.trim();
  if (enabled !== undefined) data.enabled = enabled;

  const tpl = await db.waTemplate.update({ where: { key }, data });
  return NextResponse.json(tpl);
}
