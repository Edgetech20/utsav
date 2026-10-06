import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const entries = await db.rsvp.findMany({
    select: { village: true, district: true, totalAttending: true },
  });

  const map = new Map<string, { village: string; district: string; rsvps: number; attending: number }>();
  for (const e of entries) {
    const village  = e.village?.trim() || "Unknown";
    const district = e.district?.trim() || "";
    const key      = village.toLowerCase();
    const row      = map.get(key);
    if (row) { row.rsvps++; row.attending += e.totalAttending ?? 0; }
    else map.set(key, { village, district, rsvps: 1, attending: e.totalAttending ?? 0 });
  }

  const villages = Array.from(map.values()).sort((a, b) => b.rsvps - a.rsvps);
  return NextResponse.json({ villages, total: entries.length });
}
