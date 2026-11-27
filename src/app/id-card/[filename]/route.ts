import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";

// `next start` only serves public/ files present at startup; designs uploaded later 404 without this.
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(req: NextRequest) {
  const filename = basename(req.nextUrl.pathname);
  try {
    const buffer = await readFile(join(process.cwd(), "public", "id-card", filename));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME[extname(filename).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
