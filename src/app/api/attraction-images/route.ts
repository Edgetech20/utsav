import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const attractionId = Number(form.get("attractionId"));
  const file = form.get("file") as File | null;

  if (!attractionId || !file)
    return NextResponse.json({ error: "attractionId and file required" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = join(process.cwd(), "public", "attractions");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);

  const row = await db.attractionImage.create({
    data: { attractionId, imageUrl: `/attractions/${filename}` },
  });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.attractionImage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
