import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

const DEFAULTS: Record<string, { name: string; body: string }> = {
  rsvp_auto: {
    name: "RSVP Auto-Message",
    body:
      `Namaskar {name} 🙏\n\n` +
      `We have received your registration for Priyabodhi Mahotsav on 20 December.\n\n` +
      `Thank you for letting us know. We look forward to your presence.\n\n` +
      `Jai Guru!`,
  },
};

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "templates", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const fixed = await Promise.all(
    Object.entries(DEFAULTS).map(async ([key, def]) => {
      const existing = await db.waTemplate.findUnique({ where: { key } });
      if (existing) return existing;
      return db.waTemplate.create({ data: { key, name: def.name, body: def.body, enabled: true } });
    })
  );

  const forms = await db.dynamicForm.findMany({ select: { name: true, slug: true } });
  await Promise.all(
    forms.map(f =>
      db.waTemplate.upsert({
        where:  { key: `form_${f.slug}` },
        create: {
          key: `form_${f.slug}`, name: `${f.name} Auto-Message`,
          body: `Namaskar {name} 🙏\n\nYour ${f.name} registration has been received.\n\nThank you!\n\nJai Guru!`,
          enabled: false,
        },
        update: {},
      })
    )
  );

  const formTpls = await db.waTemplate.findMany({
    where: { key: { startsWith: "form_" } },
    orderBy: { key: "asc" },
  });

  return NextResponse.json([...fixed, ...formTpls]);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "templates", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  await logChange(user.email, "update", `template:${key}`, { enabled: tpl.enabled }, getIp(req));
  return NextResponse.json(tpl);
}
