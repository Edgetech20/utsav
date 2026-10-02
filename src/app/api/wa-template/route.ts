import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_BODY =
  `Namaskar {name} 🙏\n\n` +
  `We have received your registration for Priyabodhi Mahotsav on 20 December.\n\n` +
  `Thank you for letting us know. We look forward to your presence.\n\n` +
  `Jai Guru!`;

export async function GET() {
  let tpl = await db.waTemplate.findUnique({ where: { key: "rsvp_auto" } });
  if (!tpl) {
    tpl = await db.waTemplate.create({
      data: { key: "rsvp_auto", name: "RSVP Auto-message", body: DEFAULT_BODY },
    });
  }
  return NextResponse.json(tpl);
}

export async function PUT(req: NextRequest) {
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "body required" }, { status: 400 });
  const tpl = await db.waTemplate.upsert({
    where: { key: "rsvp_auto" },
    update: { body: body.trim() },
    create: { key: "rsvp_auto", name: "RSVP Auto-message", body: body.trim() },
  });
  return NextResponse.json(tpl);
}
