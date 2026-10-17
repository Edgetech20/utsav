import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  // Trigger bot initialization (no-op if already started)
  (globalThis as any).__waStart?.().catch(console.error);
  return NextResponse.json({ ok: true });
}
