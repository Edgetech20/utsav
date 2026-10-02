import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const entries = await db.vehicleRegistration.findMany({ orderBy: { submittedAt: "desc" } });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const { contactName, mobile, vehicleType, vehicleNo, totalPassengers, comingFrom, arrivalAt, departureAt, remark } = await req.json();
  if (!contactName?.trim() || !mobile?.trim() || !vehicleType || !vehicleNo?.trim() || !totalPassengers || !comingFrom?.trim() || !arrivalAt || !departureAt || !remark?.trim())
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });

  await db.vehicleRegistration.create({
    data: {
      contactName: contactName.trim(),
      mobile: mobile.trim(),
      vehicleType,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      totalPassengers: Number(totalPassengers),
      comingFrom: comingFrom.trim(),
      arrivalAt: new Date(arrivalAt),
      departureAt: new Date(departureAt),
      remark: remark.trim(),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { id } = await req.json();
  await db.vehicleRegistration.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
