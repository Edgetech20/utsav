import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const row = await db.waStatus.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!row) return NextResponse.json({ status: "not_started" });
  return NextResponse.json(row);
}
