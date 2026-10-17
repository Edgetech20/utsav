import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  // Bot runs inline via utsav-start.js in production.
  // For local dev, run: node whatsapp-bot.js in a separate terminal.
  return NextResponse.json({ ok: true });
}
