import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const deptId  = searchParams.get("departmentId");
  const status  = searchParams.get("status");
  const q       = searchParams.get("q")?.trim();

  const rows = await db.campPatient.findMany({
    where: {
      ...(deptId  && { departmentId: parseInt(deptId) }),
      ...(status  && { status }),
      ...(q && {
        OR: [
          { name:  { contains: q } },
          { token: { contains: q } },
          { mobile:{ contains: q } },
        ],
      }),
    },
    include: { department: true },
    orderBy: { registeredAt: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, age, gender, mobile, address, problem, departmentId, doctorName } = await req.json();
  if (!name?.trim())   return NextResponse.json({ error: "name required" },         { status: 400 });
  if (!age)            return NextResponse.json({ error: "age required" },           { status: 400 });
  if (!gender?.trim()) return NextResponse.json({ error: "gender required" },        { status: 400 });
  if (!mobile?.trim()) return NextResponse.json({ error: "mobile required" },        { status: 400 });
  if (!departmentId)   return NextResponse.json({ error: "department required" },    { status: 400 });

  const dept = await db.campDepartment.findUnique({ where: { id: departmentId } });
  if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 400 });

  // ponytail: count-based token gen; unique constraint catches rare race, retry once
  let token = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await db.campPatient.count({ where: { departmentId } });
    token = `${dept.code}-${String(count + 1).padStart(3, "0")}`;
    const existing = await db.campPatient.findUnique({ where: { token } });
    if (!existing) break;
  }

  const row = await db.campPatient.create({
    data: {
      token,
      name: name.trim(),
      age: parseInt(age),
      gender: gender.trim(),
      mobile: mobile.trim(),
      address: address?.trim() || null,
      problem: problem?.trim() || null,
      departmentId,
      doctorName: doctorName?.trim() || null,
    },
    include: { department: true },
  });
  await logChange(user.email, "create", `camp-patient:${row.id}`, { token: row.token, name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, age, gender, mobile, address, problem, departmentId, doctorName } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const row = await db.campPatient.update({
    where: { id },
    data: {
      ...(name       && { name: name.trim() }),
      ...(age        && { age: parseInt(age) }),
      ...(gender     && { gender }),
      ...(mobile     && { mobile: mobile.trim() }),
      address: address?.trim() || null,
      problem: problem?.trim() || null,
      ...(departmentId && { departmentId }),
      ...(doctorName !== undefined && { doctorName: doctorName?.trim() || null }),
    },
    include: { department: true },
  });
  await logChange(user.email, "update", `camp-patient:${id}`, { token: row.token, name: row.name }, getIp(req));
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patient = await db.campPatient.findUnique({ where: { id } });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.campPatient.delete({ where: { id } });
  await logChange(user.email, "delete", `camp-patient:${id}`, { token: patient.token, name: patient.name }, getIp(req));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  if (!id)     return NextResponse.json({ error: "id required" },     { status: 400 });
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  const patient = await db.campPatient.findUnique({ where: { id } });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Validate transitions: waiting → called → doctor_done → completed
  if (status === "called") {
    if (patient.status !== "waiting") return NextResponse.json({ error: "Patient is not waiting" }, { status: 400 });
    const alreadyCalled = await db.campPatient.findFirst({
      where: { departmentId: patient.departmentId, status: "called" },
    });
    if (alreadyCalled) return NextResponse.json({ error: "Another patient is currently being seen — complete them first" }, { status: 400 });
  }
  if (status === "doctor_done" && patient.status !== "called") {
    return NextResponse.json({ error: "Patient is not currently being seen" }, { status: 400 });
  }
  if (status === "completed" && patient.status !== "doctor_done") {
    return NextResponse.json({ error: "Patient has not been seen by doctor yet" }, { status: 400 });
  }

  let doctorName: string | undefined;
  if (status === "doctor_done") {
    const doctor = await db.campDoctor.findFirst({ where: { email: user.email, isActive: true } });
    doctorName = doctor?.name ?? user.name ?? user.email;
  }

  const row = await db.campPatient.update({
    where: { id },
    data: {
      status,
      ...(status === "called"       && { calledAt: new Date() }),
      ...(status === "doctor_done"  && { doctorDoneAt: new Date(), doctorName }),
      ...(status === "completed"    && { completedAt: new Date() }),
    },
    include: { department: true },
  });
  await logChange(user.email, "update", `camp-patient:${id}`, { token: row.token, status }, getIp(req));
  return NextResponse.json(row);
}
