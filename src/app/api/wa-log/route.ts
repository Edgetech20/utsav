import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "data", "wa_log.json");

export async function GET() {
  if (!existsSync(LOG_FILE)) return NextResponse.json([]);
  try { return NextResponse.json(JSON.parse(readFileSync(LOG_FILE, "utf-8"))); }
  catch { return NextResponse.json([]); }
}
