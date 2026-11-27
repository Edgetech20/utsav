import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "changelog", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url   = new URL(req.url);
  const take  = Math.min(100, parseInt(url.searchParams.get("take") ?? "50", 10));
  const page  = Math.max(1,   parseInt(url.searchParams.get("page") ?? "1",  10));
  const q     = url.searchParams.get("q")?.trim().toLowerCase() || undefined;
  const skip  = (page - 1) * take;

  // Super sees all; members see only their own actions
  const base = user.role === "super" ? {} : { email: user.email };
  const where = q
    ? { ...base, OR: [
        { email:    { contains: q } },
        { action:   { contains: q } },
        { resource: { contains: q } },
        { detail:   { contains: q } },
      ]}
    : base;

  const [logs, total] = await Promise.all([
    db.changeLog.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    db.changeLog.count({ where }),
  ]);

  const emails  = [...new Set(logs.map(l => l.email))];
  const admins  = await db.adminUser.findMany({ where: { email: { in: emails } }, select: { email: true, name: true } });
  const nameMap = Object.fromEntries(admins.map(u => [u.email, u.name]));

  return NextResponse.json({ logs: logs.map(l => ({ ...l, name: nameMap[l.email] ?? null })), total });
}
