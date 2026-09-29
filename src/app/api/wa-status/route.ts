import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const row = await db.waStatus.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!row) return NextResponse.json({ status: "not_started" });
  return NextResponse.json(row);
}
