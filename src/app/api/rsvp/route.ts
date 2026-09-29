import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const entries = await db.rsvp.findMany({ orderBy: { submittedAt: "desc" } });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const { name, whatsapp, address } = await req.json();
  if (!name?.trim() || !whatsapp?.trim() || !address?.trim())
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  await db.rsvp.create({
    data: { name: name.trim(), whatsapp: whatsapp.trim(), address: address.trim() },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.rsvp.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
