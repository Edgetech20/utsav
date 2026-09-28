import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

const STATUS_FILE = path.join(process.cwd(), "data", "wa_status.json");

export async function GET() {
  if (!existsSync(STATUS_FILE))
    return NextResponse.json({ status: "not_started" });
  try {
    return NextResponse.json(JSON.parse(readFileSync(STATUS_FILE, "utf-8")));
  } catch {
    return NextResponse.json({ status: "not_started" });
  }
}
