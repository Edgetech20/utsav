import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error("ADMIN_SECRET env var is not set");
  return s;
}

/** Use in API route handlers: `const deny = requireAdmin(req); if (deny) return deny;` */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const cookie = req.cookies.get("admin_auth")?.value;
  if (cookie && cookie === secret()) return null;
  return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}
