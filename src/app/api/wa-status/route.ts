import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "whatsapp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const row = await db.waStatus.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!row) return NextResponse.json({ status: "not_started" });
  return NextResponse.json(row);
}
