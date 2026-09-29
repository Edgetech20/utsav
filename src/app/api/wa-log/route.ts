import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const logs = await db.waLog.findMany({ orderBy: { sentAt: "desc" }, take: 500 });
  return NextResponse.json(logs);
}
