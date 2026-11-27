import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";

// `next start` only serves public/ files present at startup; uploads made later 404 without this.
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(req: NextRequest) {
  const filename = basename(req.nextUrl.pathname);
  try {
    const buffer = await readFile(join(process.cwd(), "public", "form-uploads", filename));
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
