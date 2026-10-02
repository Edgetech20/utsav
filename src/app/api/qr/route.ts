import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const links = await db.qrLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { scans: true } }, scans: { select: { ip: true } } },
  });
  return NextResponse.json(links.map(({ scans: scanList, _count, ...l }) => ({
    ...l,
    scans: _count.scans,
    uniqueScans: new Set(scanList.map(s => s.ip)).size,
  })));
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { name, targetUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!targetUrl?.trim()) return NextResponse.json({ error: "url required" }, { status: 400 });
  const slug = randomBytes(4).toString("hex");
  const { _count, ...link } = await db.qrLink.create({
    data: { name: name.trim(), slug, targetUrl: targetUrl.trim() },
    include: { _count: { select: { scans: true } } },
  });
  return NextResponse.json({ ...link, scans: _count.scans, uniqueScans: 0 });
}

export async function DELETE(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { id } = await req.json();
  await db.qrLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
