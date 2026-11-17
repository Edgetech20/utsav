import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public endpoint — no auth. Polled every 5s by the TV display screen.
// Returns active departments with their currently-called patient token.
export async function GET() {
  const depts = await db.campDepartment.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const result = await Promise.all(
    depts.map(async (dept) => {
      const called = await db.campPatient.findFirst({
        where: { departmentId: dept.id, status: "called" },
        orderBy: { calledAt: "desc" },
      });
      return {
        id:      dept.id,
        code:    dept.code,
        name:    dept.name,
        current: called?.token ?? null,
      };
    })
  );

  return NextResponse.json(result);
}
