import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(req: NextRequest, ctx: RouteContext<"/qr/[slug]">) {
  const { slug } = await ctx.params;
  const link = await db.qrLink.findUnique({ where: { slug } });
  if (link) {
    await db.qrScan.create({ data: { qrLinkId: link.id, ip: getIp(req) } });
    return NextResponse.redirect(link.targetUrl.startsWith("http") ? link.targetUrl : new URL(link.targetUrl, req.url).href);
  }
  return NextResponse.redirect(new URL("/", req.url));
}
