import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { email } = await req.json();
  const clean = email?.trim().toLowerCase();
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  try {
    const user = await db.adminUser.create({ data: { email: clean } });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { email } = await req.json();
  const clean = email?.trim().toLowerCase();
  if (!clean) return NextResponse.json({ error: "Email required" }, { status: 400 });
  await db.adminUser.delete({ where: { email: clean } });
  return NextResponse.json({ ok: true });
}
