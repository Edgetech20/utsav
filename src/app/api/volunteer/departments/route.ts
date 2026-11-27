import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePerm, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

const guard = (req: NextRequest, a: "view" | "edit") => requirePerm(req, "volunteer", a);

export async function GET(req: NextRequest) {
  const { err } = await guard(req, "view");
  if (err) return err;
  return NextResponse.json(await db.volDepartment.findMany({ orderBy: { order: "asc" } }));
}

export async function POST(req: NextRequest) {
  const { user, err } = await guard(req, "edit");
  if (err) return err;
  const { code, name, cardBg, cardText } = await req.json();
  if (!code?.trim() || !name?.trim()) return NextResponse.json({ error: "code and name required" }, { status: 400 });
  const last = await db.volDepartment.findFirst({ orderBy: { order: "desc" } });
  const row = await db.volDepartment.create({
    data: { code: code.trim().toUpperCase(), name: name.trim(), order: (last?.order ?? -1) + 1, cardBg: cardBg || null, cardText: cardText || null },
  }).catch(() => null);
  if (!row) return NextResponse.json({ error: "Code already in use" }, { status: 400 });
  await logChange(user.email, "create", `vol-dept:${row.id}`, { code: row.code, name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const { user, err } = await guard(req, "edit");
  if (err) return err;
  const { id, code, name, isActive, order, cardBg, cardText } = await req.json();
  const row = await db.volDepartment.update({
    where: { id },
    data: {
      ...(code !== undefined && { code: code.trim().toUpperCase() }),
      ...(name !== undefined && { name: name.trim() }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { order }),
      ...(cardBg !== undefined && { cardBg: cardBg || null }),
      ...(cardText !== undefined && { cardText: cardText || null }),
    },
  }).catch(() => null);
  if (!row) return NextResponse.json({ error: "Code already in use" }, { status: 400 });
  await logChange(user.email, "update", `vol-dept:${id}`, { name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const { user, err } = await guard(req, "edit");
  if (err) return err;
  const { id } = await req.json();
  if (await db.volunteer.count({ where: { departmentId: id } }))
    return NextResponse.json({ error: "Department has volunteers — deactivate instead of deleting" }, { status: 400 });
  await db.volDepartment.delete({ where: { id } });
  await logChange(user.email, "delete", `vol-dept:${id}`, undefined, getIp(req));
  return NextResponse.json({ ok: true });
}
