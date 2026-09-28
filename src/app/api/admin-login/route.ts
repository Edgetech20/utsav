import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.ADMIN_SECRET ?? "admin123";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== SECRET)
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_auth", SECRET, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_auth");
  return res;
}
