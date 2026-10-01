import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif",
};

export async function GET(req: NextRequest) {
  const filename = basename(req.nextUrl.pathname);
  const ext = extname(filename).toLowerCase();
  const mime = MIME[ext] ?? "image/jpeg";
  const filePath = join(process.cwd(), "public", "attractions", filename);
  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[attractions] file not found:", filePath, err);
    return new NextResponse("Not found", { status: 404 });
  }
}
