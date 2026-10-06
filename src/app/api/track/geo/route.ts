import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Unique IPs from view events
  const rows = await db.clickEvent.groupBy({ by: ["ip"], where: { type: "view" } });
  const ips = rows.map(r => r.ip).filter(ip => ip && ip !== "unknown");

  if (!ips.length) return NextResponse.json({ locations: [], total: 0 });

  // Total view count per IP
  const viewRows = await db.clickEvent.groupBy({
    by: ["ip"], where: { type: "view" }, _count: { id: true },
  });
  const viewCounts = Object.fromEntries(viewRows.map(r => [r.ip, r._count.id]));

  // Batch geo lookup — ip-api.com free tier, 100 IPs/request
  const chunks: string[][] = [];
  for (let i = 0; i < ips.length; i += 100) chunks.push(ips.slice(i, i + 100));

  const geoResults: { status: string; city: string; regionName: string; country: string; query: string }[] = [];
  for (const chunk of chunks) {
    try {
      const res = await fetch("http://ip-api.com/batch?fields=status,city,regionName,country,query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map(ip => ({ query: ip }))),
      });
      const data = await res.json();
      geoResults.push(...data);
    } catch { /* skip failed chunk */ }
  }

  // Aggregate by city
  type LocationEntry = { city: string; region: string; country: string; unique: number; views: number };
  const cityMap = new Map<string, LocationEntry>();

  for (const r of geoResults) {
    if (r.status !== "success") continue;
    const key = `${r.city}||${r.regionName}||${r.country}`;
    const views = viewCounts[r.query] ?? 1;
    const entry = cityMap.get(key);
    if (entry) { entry.unique++; entry.views += views; }
    else cityMap.set(key, { city: r.city, region: r.regionName, country: r.country, unique: 1, views });
  }

  const locations = Array.from(cityMap.values()).sort((a, b) => b.unique - a.unique);
  return NextResponse.json({ locations, total: ips.length, resolved: geoResults.filter(r => r.status === "success").length });
}
