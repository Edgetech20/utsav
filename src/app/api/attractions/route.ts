import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const rows = await db.attraction.findMany({
    orderBy: { order: "asc" },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { name, url, navigateToVenue, formSlug } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const last = await db.attraction.findFirst({ orderBy: { order: "desc" } });
  const row = await db.attraction.create({
    data: { name: name.trim(), url: url || null, navigateToVenue: !!navigateToVenue, formSlug: formSlug || null, order: (last?.order ?? -1) + 1 },
    include: { images: true },
  });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const body = await req.json();
  // reorder: [{ id, order }]
  if (Array.isArray(body)) {
    await Promise.all(body.map(({ id, order }: { id: number; order: number }) =>
      db.attraction.update({ where: { id }, data: { order } })
    ));
    return NextResponse.json({ ok: true });
  }
  // update single
  const { id, name, url, navigateToVenue, formSlug } = body;
  const row = await db.attraction.update({
    where: { id },
    data: { name: name?.trim(), url: url || null, navigateToVenue: !!navigateToVenue, formSlug: formSlug || null },
    include: { images: true },
  });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { id } = await req.json();
  const row = await db.attraction.findUnique({ where: { id } });
  if (row && ["Accommodation", "Bus & Car Parking"].includes(row.name))
    return NextResponse.json({ error: "Cannot delete protected attraction" }, { status: 403 });
  await db.attraction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
