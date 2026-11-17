import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const all = new URL(req.url).searchParams.get("all") === "1";
  const [rows, dispensedAgg] = await Promise.all([
    db.medicine.findMany({
      where: all ? undefined : { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.patientMedicine.groupBy({
      by: ["medicineId"],
      _sum: { quantity: true },
    }),
  ]);
  const dispensedMap = Object.fromEntries(dispensedAgg.map(d => [d.medicineId, d._sum.quantity ?? 0]));
  return NextResponse.json(rows.map(r => ({ ...r, dispensedTotal: dispensedMap[r.id] ?? 0 })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const ip = getIp(req);

  // Bulk import: { items: [{ name, unit, stock }] }
  if (Array.isArray(body.items)) {
    const rows = await db.$transaction(
      body.items.map((item: { name: string; unit?: string; stock?: number }) =>
        db.medicine.create({
          data: { name: item.name.trim(), unit: item.unit?.trim() || "tablet", stock: parseInt(String(item.stock)) || 0 },
        })
      )
    );
    await logChange(user.email, "create", "medicine:bulk", { count: rows.length }, ip);
    return NextResponse.json(rows);
  }

  const { name, unit, stock } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const row = await db.medicine.create({
    data: { name: name.trim(), unit: unit?.trim() || "tablet", stock: parseInt(stock) || 0 },
  });
  await logChange(user.email, "create", `medicine:${row.id}`, { name: row.name }, ip);
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, unit, stock, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const row = await db.medicine.update({
    where: { id },
    data: {
      ...(name     !== undefined && { name: name.trim() }),
      ...(unit     !== undefined && { unit: unit.trim() }),
      ...(stock    !== undefined && { stock: parseInt(stock) }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  await logChange(user.email, "update", `medicine:${id}`, { name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Soft delete
  const row = await db.medicine.update({ where: { id }, data: { isActive: false } });
  await logChange(user.email, "delete", `medicine:${id}`, { name: row.name }, getIp(req));
  return NextResponse.json({ ok: true });
}
