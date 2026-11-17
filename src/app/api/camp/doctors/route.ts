import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

export async function GET() {
  const rows = await db.campDoctor.findMany({
    include: { department: { select: { id: true, code: true, name: true } } },
    orderBy: [{ departmentId: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, departmentId } = await req.json();
  if (!name?.trim())   return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!departmentId)   return NextResponse.json({ error: "department required" }, { status: 400 });

  const row = await db.campDoctor.create({
    data: { name: name.trim(), departmentId: Number(departmentId) },
    include: { department: { select: { id: true, code: true, name: true } } },
  });
  await logChange(user.email, "create", `camp-doctor:${row.id}`, { name: row.name, dept: row.department.name }, getIp(req));
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, departmentId, isActive } = await req.json();
  const row = await db.campDoctor.update({
    where: { id },
    data: {
      ...(name         !== undefined && { name: name.trim() }),
      ...(departmentId !== undefined && { departmentId: Number(departmentId) }),
      ...(isActive     !== undefined && { isActive }),
    },
    include: { department: { select: { id: true, code: true, name: true } } },
  });
  await logChange(user.email, "update", `camp-doctor:${id}`, { name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await db.campDoctor.delete({ where: { id } });
  await logChange(user.email, "delete", `camp-doctor:${id}`, undefined, getIp(req));
  return NextResponse.json({ ok: true });
}
