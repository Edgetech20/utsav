import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!file.type.startsWith("audio/")) return NextResponse.json({ error: "Must be an audio file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  await writeFile(join(process.cwd(), "public", "music.mp3"), Buffer.from(bytes));
  return NextResponse.json({ ok: true, name: file.name });
}
