import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "clicks.json");

type Bucket = { ips: string[]; total: number; hits: number };
type Data = { views: Bucket; attending: Bucket; mapClicks: Bucket };

const empty = (): Data => ({
  views: { ips: [], total: 0, hits: 0 },
  attending: { ips: [], total: 0, hits: 0 },
  mapClicks: { ips: [], total: 0, hits: 0 },
});

function read(): Data {
  if (!existsSync(DATA_FILE)) {
    mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    return empty();
  }
  try {
    const d = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
    // back-fill hits for existing data that pre-dates this field
    d.views.hits ??= d.views.total;
    d.attending.hits ??= d.attending.total;
    d.mapClicks ??= { ips: [], total: 0, hits: 0 };
    d.mapClicks.hits ??= d.mapClicks.total;
    return d;
  } catch {
    return empty();
  }
}

function save(data: Data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

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
  const type = t === "attend" ? "attending" : t === "map" ? "mapClicks" : "views";
  const ip = getIp(req);

  const data = read();
  const bucket = data[type];
  const isNew = !bucket.ips.includes(ip);
  if (isNew) {
    bucket.ips.push(ip);
    bucket.total = bucket.ips.length;
  }
  bucket.hits += 1;
  save(data);

  return NextResponse.json({ unique: bucket.total, hits: bucket.hits, isNew });
}

export async function GET() {
  const data = read();
  return NextResponse.json({
    views: data.views.total,
    viewHits: data.views.hits,
    attending: data.attending.total,
    mapClicks: data.mapClicks.total,
    mapHits: data.mapClicks.hits,
  });
}
