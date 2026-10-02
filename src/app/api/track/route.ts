import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const t = searchParams.get("type");
  const type = t === "attend" ? "attend" : t === "map" ? "map" : "view";
  const ip = getIp(req);

  const existing = await db.clickEvent.findFirst({ where: { type, ip } });
  await db.clickEvent.create({ data: { type, ip } });

  const [unique, hits] = await Promise.all([
    db.clickEvent.groupBy({ by: ["ip"], where: { type } }).then(r => r.length),
    db.clickEvent.count({ where: { type } }),
  ]);

  return NextResponse.json({ unique, hits, isNew: !existing });
}

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const [views, viewHits, attending, mapClicks, mapHits] = await Promise.all([
    db.clickEvent.groupBy({ by: ["ip"], where: { type: "view" } }).then(r => r.length),
    db.clickEvent.count({ where: { type: "view" } }),
    db.clickEvent.groupBy({ by: ["ip"], where: { type: "attend" } }).then(r => r.length),
    db.clickEvent.groupBy({ by: ["ip"], where: { type: "map" } }).then(r => r.length),
    db.clickEvent.count({ where: { type: "map" } }),
  ]);
  return NextResponse.json({ views, viewHits, attending, mapClicks, mapHits });
}
