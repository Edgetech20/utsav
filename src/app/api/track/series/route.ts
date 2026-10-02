import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const events = await db.clickEvent.findMany({
    where: { type: "view", createdAt: { gte: since } },
    select: { ip: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Build day buckets for last 14 days
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  // For each day, count total hits and unique IPs
  // "Unique" = first time this IP appears across ALL days up to that day
  const seenIPs = new Set<string>();
  const result = days.map(day => {
    const dayEvents = events.filter(e => e.createdAt.toISOString().slice(0, 10) === day);
    const total     = dayEvents.length;
    let unique = 0, repeat = 0;
    dayEvents.forEach(e => {
      if (!seenIPs.has(e.ip)) { seenIPs.add(e.ip); unique++; }
      else repeat++;
    });
    return { day, total, unique, repeat };
  });

  return NextResponse.json(result);
}
