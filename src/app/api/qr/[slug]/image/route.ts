import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require("qrcode");

export async function GET(req: NextRequest, ctx: RouteContext<"/api/qr/[slug]/image">) {
  const { slug } = await ctx.params;
  const origin = process.env.BASE_URL ?? new URL(req.url).origin;
  // QR encodes the tracking URL; /qr/[slug] logs the scan then redirects to targetUrl
  const url = `${origin}/qr/${slug}`;
  const buffer: Buffer = await QRCode.toBuffer(url, { width: 400, margin: 2, color: { dark: "#1a1a2e", light: "#fff" } });
  return new Response(buffer as unknown as BodyInit, {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
