import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname } from "path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const ext = extname(filename).toLowerCase();
  const mime = MIME[ext] ?? "application/octet-stream";
  try {
    const buffer = await readFile(join(process.cwd(), "public", "attractions", filename));
    return new NextResponse(buffer, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
