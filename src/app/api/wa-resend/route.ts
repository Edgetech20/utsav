import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "whatsapp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { type, whatsapp } = await req.json();
  if (!type || !whatsapp) return NextResponse.json({ error: "type and whatsapp required" }, { status: 400 });

  if (type === "rsvp_auto") {
    const updated = await db.rsvp.updateMany({ where: { whatsapp }, data: { waSent: false } });
    if (updated.count === 0) return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    return NextResponse.json({ ok: true, queued: "rsvp" });
  }

  if (type === "broadcast") {
    const updated = await db.waQueue.updateMany({
      where: { whatsapp, status: "failed" },
      data:  { status: "pending", error: null, sentAt: null },
    });
    if (updated.count === 0) return NextResponse.json({ error: "No failed queue entry found" }, { status: 404 });
    return NextResponse.json({ ok: true, queued: "broadcast" });
  }

  return NextResponse.json({ error: "unknown type" }, { status: 400 });
}
