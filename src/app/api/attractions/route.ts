import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

export async function GET() {
  const rows = await db.attraction.findMany({
    orderBy: { order: "asc" },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "attractions", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, url, navigateToVenue, formSlug } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const last = await db.attraction.findFirst({ orderBy: { order: "desc" } });
  const row = await db.attraction.create({
    data: { name: name.trim(), description: description?.trim() || null, url: url || null, navigateToVenue: !!navigateToVenue, formSlug: formSlug || null, order: (last?.order ?? -1) + 1 },
    include: { images: true },
  });
  await logChange(user.email, "create", `attraction:${row.id}`, { name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "attractions", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (Array.isArray(body)) {
    await Promise.all(body.map(({ id, order }: { id: number; order: number }) =>
      db.attraction.update({ where: { id }, data: { order } })
    ));
    return NextResponse.json({ ok: true });
  }
  const { id, name, description, url, navigateToVenue, formSlug } = body;
  const row = await db.attraction.update({
    where: { id },
    data: { name: name?.trim(), description: description?.trim() || null, url: url || null, navigateToVenue: !!navigateToVenue, formSlug: formSlug || null },
    include: { images: true },
  });
  await logChange(user.email, "update", `attraction:${id}`, { name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "attractions", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  const row = await db.attraction.findUnique({ where: { id } });
  if (row && ["Accommodation", "Bus & Car Parking"].includes(row.name))
    return NextResponse.json({ error: "Cannot delete protected attraction" }, { status: 403 });
  await db.attraction.delete({ where: { id } });
  await logChange(user.email, "delete", `attraction:${id}`, { name: row?.name }, getIp(req));
  return NextResponse.json({ ok: true });
}
