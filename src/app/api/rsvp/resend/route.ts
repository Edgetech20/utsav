import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const SENT_FILE = path.join(process.cwd(), "data", "rsvp_sent.json");

function readSent(): string[] {
  if (!existsSync(SENT_FILE)) return [];
  try { return JSON.parse(readFileSync(SENT_FILE, "utf-8")); } catch { return []; }
}

export async function POST(req: NextRequest) {
  const { key } = await req.json();
  const sent = readSent().filter(k => k !== key);
  mkdirSync(path.dirname(SENT_FILE), { recursive: true });
  writeFileSync(SENT_FILE, JSON.stringify(sent, null, 2));
  return NextResponse.json({ ok: true });
}
