import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const entries = await db.rsvp.findMany({ orderBy: { submittedAt: "desc" } });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const { name, whatsapp, village, postOffice, district, pinCode, totalAttending } = await req.json();
  if (!name?.trim() || !whatsapp?.trim() || !village?.trim() || !pinCode?.trim() || !totalAttending)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const attending = parseInt(totalAttending, 10);
  try {
    await db.rsvp.create({
      data: {
        name: name.trim(), whatsapp: whatsapp.trim(), address: "",
        village: village.trim(), postOffice: postOffice?.trim() || null,
        district: district?.trim() || null, pinCode: pinCode.trim(),
        totalAttending: attending,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return NextResponse.json({ error: "This WhatsApp number is already registered." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { id } = await req.json();
  await db.rsvp.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
