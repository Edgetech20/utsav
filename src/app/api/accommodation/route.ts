import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const entries = await db.accommodationRegistration.findMany({ orderBy: { submittedAt: "desc" } });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const {
    primaryName, mobile, comingFrom, totalPersons,
    maleMem, femaleMem, children, seniorCitizens,
    arrivalDate, arrivalTime, departureDate, departureTime,
    needsAssistance, assistanceDetails,
    hasVehicle, vehicleType, vehicleNo,
    additionalInfo,
  } = await req.json();

  if (!primaryName?.trim() || !mobile?.trim() || !comingFrom?.trim() || !totalPersons ||
      !arrivalDate || !arrivalTime || !departureDate || !departureTime ||
      needsAssistance === undefined || hasVehicle === undefined)
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });

  if (needsAssistance && !assistanceDetails?.trim())
    return NextResponse.json({ error: "Please provide special assistance details" }, { status: 400 });

  if (hasVehicle && (!vehicleType || !vehicleNo?.trim()))
    return NextResponse.json({ error: "Please provide vehicle type and number" }, { status: 400 });

  await db.accommodationRegistration.create({
    data: {
      primaryName: primaryName.trim(),
      mobile: mobile.trim(),
      comingFrom: comingFrom.trim(),
      totalPersons: Number(totalPersons),
      maleMem: Number(maleMem) || 0,
      femaleMem: Number(femaleMem) || 0,
      children: Number(children) || 0,
      seniorCitizens: Number(seniorCitizens) || 0,
      arrivalAt: new Date(`${arrivalDate}T${arrivalTime}`),
      departureAt: new Date(`${departureDate}T${departureTime}`),
      needsAssistance: Boolean(needsAssistance),
      assistanceDetails: needsAssistance ? assistanceDetails?.trim() : null,
      hasVehicle: Boolean(hasVehicle),
      vehicleType: hasVehicle ? vehicleType : null,
      vehicleNo: hasVehicle ? vehicleNo?.trim().toUpperCase() : null,
      additionalInfo: additionalInfo?.trim() || null,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { id } = await req.json();
  await db.accommodationRegistration.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
