import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const rows = await db.programme.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { title, time, description, venue } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!time?.trim())  return NextResponse.json({ error: "time required" },  { status: 400 });
  const last = await db.programme.findFirst({ orderBy: { order: "desc" } });
  const row = await db.programme.create({
    data: { title: title.trim(), time: time.trim(), description: description?.trim() || null, venue: venue?.trim() || null, order: (last?.order ?? -1) + 1 },
  });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const body = await req.json();
  // reorder: [{ id, order }]
  if (Array.isArray(body)) {
    await Promise.all(body.map(({ id, order }: { id: number; order: number }) =>
      db.programme.update({ where: { id }, data: { order } })
    ));
    return NextResponse.json({ ok: true });
  }
  const { id, title, time, description, venue } = body;
  const row = await db.programme.update({
    where: { id },
    data: { title: title?.trim(), time: time?.trim(), description: description?.trim() || null, venue: venue?.trim() || null },
  });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { id } = await req.json();
  await db.programme.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
