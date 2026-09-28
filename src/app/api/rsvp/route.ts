import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "rsvp.json");
const SENT_FILE = path.join(process.cwd(), "data", "rsvp_sent.json");

type Entry = { name: string; whatsapp: string; address: string; submittedAt: string };

function readJSON<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback;
  try { return JSON.parse(readFileSync(file, "utf-8")); } catch { return fallback; }
}

function saveJSON(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}

export async function GET() {
  const entries = readJSON<Entry[]>(DATA_FILE, []);
  const sent = readJSON<string[]>(SENT_FILE, []);
  return NextResponse.json({ entries, sent });
}

export async function POST(req: NextRequest) {
  const { name, whatsapp, address } = await req.json();
  if (!name?.trim() || !whatsapp?.trim() || !address?.trim())
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const entries = readJSON<Entry[]>(DATA_FILE, []);
  entries.push({ name: name.trim(), whatsapp: whatsapp.trim(), address: address.trim(), submittedAt: new Date().toISOString() });
  saveJSON(DATA_FILE, entries);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { key } = await req.json(); // key = "whatsapp|submittedAt"
  const entries = readJSON<Entry[]>(DATA_FILE, []);
  const sent = readJSON<string[]>(SENT_FILE, []);

  const filtered = entries.filter(e => `${e.whatsapp}|${e.submittedAt}` !== key);
  const filteredSent = sent.filter(k => k !== key);

  saveJSON(DATA_FILE, filtered);
  saveJSON(SENT_FILE, filteredSent);
  return NextResponse.json({ ok: true });
}
