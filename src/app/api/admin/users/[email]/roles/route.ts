import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getIp } from "@/lib/auth";
import { rebalance } from "@/lib/rsvpAssign";
import { logChange } from "@/lib/changelog";

type Params = { params: Promise<{ email: string }> };

// PUT — replace the full role set for a user: { roleIds: number[] }
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await params;
  const { roleIds } = await req.json();
  if (!Array.isArray(roleIds) || !roleIds.every(n => Number.isInteger(n)))
    return NextResponse.json({ error: "roleIds must be an array of ids" }, { status: 400 });

  const roles = await db.role.findMany({ where: { id: { in: roleIds } }, select: { id: true, name: true } });
  await db.$transaction([
    db.userRole.deleteMany({ where: { email } }),
    db.userRole.createMany({ data: roles.map(r => ({ email, roleId: r.id })) }),
  ]);

  await logChange(user.email, "grant", `roles:${email}`, { roles: roles.map(r => r.name) }, getIp(req));
  // caller pool may have changed → even out RSVP assignments (never fails the request)
  await rebalance().then(r => { if (r.moved) return logChange(user.email, "update", "rsvp-assign:rebalance", { ...r, reason: `roles changed: ${email}` }, getIp(req)); })
    .catch(e => console.error("[rsvp] rebalance failed:", e));
  return NextResponse.json(roles);
}
