import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Max file size is 10 MB" }, { status: 413 });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = join(process.cwd(), "public", "form-uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/form-uploads/${filename}`, name: file.name });
}
