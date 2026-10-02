import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { id } = await req.json();
  await db.rsvp.update({ where: { id }, data: { waSent: false } });
  return NextResponse.json({ ok: true });
}
