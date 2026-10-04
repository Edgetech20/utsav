import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.ADMIN_SECRET;

export function proxy(req: NextRequest) {
  const auth = req.cookies.get("admin_auth")?.value;

  if (!SECRET || !auth || auth !== SECRET) {
    const login = new URL("/admin/login", req.url);
    login.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard", "/admin/dashboard/:path*"],
};
