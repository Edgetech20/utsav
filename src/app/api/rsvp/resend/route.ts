import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  await db.rsvp.update({ where: { id }, data: { waSent: false } });
  return NextResponse.json({ ok: true });
}
