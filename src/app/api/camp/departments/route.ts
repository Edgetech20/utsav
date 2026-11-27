import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.campDepartment.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, name } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: "code required" }, { status: 400 });
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const last = await db.campDepartment.findFirst({ orderBy: { order: "desc" } });
  const row = await db.campDepartment.create({
    data: { code: code.trim().toUpperCase(), name: name.trim(), order: (last?.order ?? -1) + 1 },
  });
  await logChange(user.email, "create", `camp-dept:${row.id}`, { code: row.code, name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, code, name, isActive, order } = await req.json();
  const row = await db.campDepartment.update({
    where: { id },
    data: {
      ...(code !== undefined && { code: code.trim().toUpperCase() }),
      ...(name !== undefined && { name: name.trim() }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { order }),
    },
  });
  await logChange(user.email, "update", `camp-dept:${id}`, { name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  const count = await db.campPatient.count({ where: { departmentId: id } });
  if (count > 0) return NextResponse.json({ error: "Department has patients — deactivate instead of deleting" }, { status: 400 });

  await db.campDepartment.delete({ where: { id } });
  await logChange(user.email, "delete", `camp-dept:${id}`, undefined, getIp(req));
  return NextResponse.json({ ok: true });
}
