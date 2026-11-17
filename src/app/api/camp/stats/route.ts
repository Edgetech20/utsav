import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const depts = await db.campDepartment.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const counts = await db.campPatient.groupBy({
    by: ["departmentId", "status"],
    _count: { id: true },
  });

  const byDept: Record<number, Record<string, number>> = {};
  for (const c of counts) {
    if (!byDept[c.departmentId]) byDept[c.departmentId] = {};
    byDept[c.departmentId][c.status] = c._count.id;
  }

  const departments = depts.map(d => {
    const s          = byDept[d.id] ?? {};
    const waiting    = s.waiting    ?? 0;
    const called     = s.called     ?? 0;
    const doctorDone = s.doctor_done ?? 0;
    const completed  = s.completed  ?? 0;
    return {
      id: d.id, code: d.code, name: d.name,
      waiting, called, doctorDone, completed,
      total: waiting + called + doctorDone + completed,
    };
  });

  const total      = departments.reduce((s, d) => s + d.total,       0);
  const waiting    = departments.reduce((s, d) => s + d.waiting,     0);
  const called     = departments.reduce((s, d) => s + d.called,      0);
  const doctorDone = departments.reduce((s, d) => s + d.doctorDone,  0);
  const completed  = departments.reduce((s, d) => s + d.completed,   0);

  return NextResponse.json({ total, waiting, called, doctorDone, completed, departments });
}
