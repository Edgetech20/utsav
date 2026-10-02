import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET() {
  const links = await db.qrLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { scans: true } } },
  });
  return NextResponse.json(links.map(l => ({ ...l, scans: l._count.scans })));
}

export async function POST(req: NextRequest) {
  const { name, targetUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!targetUrl?.trim()) return NextResponse.json({ error: "url required" }, { status: 400 });
  const slug = randomBytes(4).toString("hex");
  const link = await db.qrLink.create({
    data: { name: name.trim(), slug, targetUrl: targetUrl.trim() },
    include: { _count: { select: { scans: true } } },
  });
  return NextResponse.json({ ...link, scans: link._count.scans });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.qrLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
