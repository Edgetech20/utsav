import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

// GET ?patientId= — patient-specific records
// GET (no params) — full dispensing report
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const patientId = parseInt(searchParams.get("patientId") ?? "");

  if (patientId) {
    const rows = await db.patientMedicine.findMany({
      where: { patientId },
      include: { medicine: true },
      orderBy: { dispensedAt: "asc" },
    });
    return NextResponse.json(rows);
  }

  // Full report — all records with patient + medicine details
  const rows = await db.patientMedicine.findMany({
    include: {
      medicine: { select: { id: true, name: true, unit: true } },
      patient: {
        select: {
          id: true, token: true, name: true, age: true, gender: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { dispensedAt: "desc" },
  });
  return NextResponse.json(rows);
}

// POST — dispense medicines to a patient
// body: { patientId, items: [{ medicineId, quantity, dosage }] }
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { patientId, items, noMedicine } = await req.json();
  if (!patientId) return NextResponse.json({ error: "patientId required" }, { status: 400 });
  if (!noMedicine && (!Array.isArray(items) || items.length === 0))
    return NextResponse.json({ error: "items required" }, { status: 400 });

  const patient = await db.campPatient.findUnique({ where: { id: patientId } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const ip = getIp(req);

  if (noMedicine) {
    // No medicine — just complete the patient, dispensedAt marks the visit
    await db.campPatient.update({
      where: { id: patientId },
      data: { status: "completed", dispensedAt: new Date(), completedAt: new Date() },
    });
  } else {
    // Validate stock for all items first
    for (const item of items) {
      const med = await db.medicine.findUnique({ where: { id: item.medicineId } });
      if (!med) return NextResponse.json({ error: `Medicine ${item.medicineId} not found` }, { status: 404 });
      if (med.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${med.name} (available: ${med.stock} ${med.unit})` }, { status: 400 });
      }
    }

    // Create dispensing records + deduct stock in a transaction
    await db.$transaction([
      ...items.map((item: { medicineId: number; quantity: number; dosage?: string }) =>
        db.patientMedicine.create({
          data: {
            patientId,
            medicineId: item.medicineId,
            quantity: item.quantity,
            dosage: item.dosage?.trim() || null,
            dispensedBy: user.email,
          },
        })
      ),
      ...items.map((item: { medicineId: number; quantity: number }) =>
        db.medicine.update({
          where: { id: item.medicineId },
          data: { stock: { decrement: item.quantity } },
        })
      ),
      db.campPatient.update({
        where: { id: patientId },
        data: { status: "completed", dispensedAt: new Date(), completedAt: new Date() },
      }),
    ]);
  }

  await logChange(user.email, "update", `camp-patient:${patientId}`, {
    token: patient.token, status: "completed", medicines: noMedicine ? 0 : items.length, noMedicine: !!noMedicine,
  }, ip);

  const updated = await db.campPatient.findUnique({
    where: { id: patientId },
    include: { department: true },
  });
  return NextResponse.json(updated);
}
