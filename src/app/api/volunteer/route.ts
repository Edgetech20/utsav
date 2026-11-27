import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePerm, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

const guard = (req: NextRequest, a: "view" | "edit") => requirePerm(req, "volunteer", a);

// Next free "SEC-007" for a department (max existing + 1, so deletes never cause reuse collisions)
async function nextCode(deptCode: string) {
  const rows = await db.volunteer.findMany({ where: { code: { startsWith: `${deptCode}-` } }, select: { code: true } });
  const max = Math.max(0, ...rows.map(r => parseInt(r.code.slice(deptCode.length + 1)) || 0));
  return `${deptCode}-${String(max + 1).padStart(3, "0")}`;
}

// Create/update with a fresh code; retry if two admins grab the same number at once (unique constraint)
async function withCode<T>(deptCode: string, write: (code: string) => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await write(await nextCode(deptCode)); }
    catch (e) { if (i >= 2 || (e as { code?: string }).code !== "P2002") throw e; }
  }
}

export async function GET(req: NextRequest) {
  const { err } = await guard(req, "view");
  if (err) return err;
  const rows = await db.volunteer.findMany({ include: { department: true }, orderBy: [{ departmentId: "asc" }, { code: "asc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { user, err } = await guard(req, "edit");
  if (err) return err;
  const { name, mobile, address, departmentId, responseId } = await req.json();
  if (!name?.trim() || !mobile?.trim() || !departmentId)
    return NextResponse.json({ error: "Name, mobile and department are required" }, { status: 400 });
  const dept = await db.volDepartment.findUnique({ where: { id: departmentId } });
  if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 400 });
  if (responseId && await db.volunteer.findUnique({ where: { responseId } }))
    return NextResponse.json({ error: "Already registered from this form entry" }, { status: 400 });

  const row = await withCode(dept.code, code => db.volunteer.create({
    data: { code, name: name.trim(), mobile: mobile.trim(), address: address?.trim() || null, departmentId, responseId: responseId || null },
    include: { department: true },
  }));
  await logChange(user.email, "create", `volunteer:${row.id}`, { code: row.code, name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const { user, err } = await guard(req, "edit");
  if (err) return err;
  const { id, name, mobile, address, departmentId } = await req.json();
  const cur = await db.volunteer.findUnique({ where: { id } });
  if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = {
    ...(name !== undefined && { name: name.trim() }),
    ...(mobile !== undefined && { mobile: mobile.trim() }),
    ...(address !== undefined && { address: address?.trim() || null }),
  };
  // Moving to another department gives a new ID with that department's prefix
  const dept = departmentId && departmentId !== cur.departmentId ? await db.volDepartment.findUnique({ where: { id: departmentId } }) : null;
  const row = dept
    ? await withCode(dept.code, code => db.volunteer.update({ where: { id }, data: { ...data, code, departmentId }, include: { department: true } }))
    : await db.volunteer.update({ where: { id }, data, include: { department: true } });
  await logChange(user.email, "update", `volunteer:${id}`, { code: row.code, name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const { user, err } = await guard(req, "edit");
  if (err) return err;
  const { id } = await req.json();
  const row = await db.volunteer.delete({ where: { id } }).catch(() => null);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logChange(user.email, "delete", `volunteer:${id}`, { code: row.code, name: row.name }, getIp(req));
  return NextResponse.json({ ok: true });
}
