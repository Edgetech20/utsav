import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, can } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "whatsapp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  (globalThis as any).__waStart?.().catch(console.error);
  return NextResponse.json({ ok: true });
}
