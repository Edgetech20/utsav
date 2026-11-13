import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getSessionUser, can } from "@/lib/auth";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "attractions", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const attractionId = Number(form.get("attractionId"));
  const file = form.get("file") as File | null;

  if (!attractionId || !file)
    return NextResponse.json({ error: "attractionId and file required" }, { status: 400 });

  if (!ALLOWED_MIME.has(file.type))
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF allowed" }, { status: 415 });

  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });

  const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
  const ext = EXT_MAP[file.type];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = join(process.cwd(), "public", "attractions");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const row = await db.attractionImage.create({
    data: { attractionId, imageUrl: `/attractions/${filename}` },
  });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "attractions", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await db.attractionImage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
