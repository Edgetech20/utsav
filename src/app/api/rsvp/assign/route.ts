import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePerm, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";
import { callCount } from "@/lib/permissions";
import { callerPool, rebalance } from "@/lib/rsvpAssign";

// GET — per-caller summary: { callers: [{ email, name, total, calls: [notCalled, 1, 2, 3+] }], unassigned }
export async function GET(req: NextRequest) {
  const { err } = await requirePerm(req, "rsvp", "assign");
  if (err) return err;

  const [pool, rows] = await Promise.all([
    callerPool(),
    db.rsvp.findMany({ select: { assignedTo: true, notes: true } }),
  ]);
  const users = await db.adminUser.findMany({ where: { email: { in: pool } }, select: { email: true, name: true } });
  const name = new Map(users.map(u => [u.email, u.name]));

  const stats = new Map(pool.map(e => [e, { email: e, name: name.get(e) ?? null, total: 0, calls: [0, 0, 0, 0] }]));
  let unassigned = 0;
  for (const r of rows) {
    const s = r.assignedTo ? stats.get(r.assignedTo) : undefined;
    if (!s) { unassigned++; continue; }
    s.total++;
    s.calls[Math.min(callCount(r.notes), 3)]++;
  }
  return NextResponse.json({ callers: [...stats.values()], unassigned });
}

// POST — { action: "rebalance" } | { ids: number[], email: string | null }  (manual assign / unassign)
export async function POST(req: NextRequest) {
  const { user, err } = await requirePerm(req, "rsvp", "assign");
  if (err) return err;
  const body = await req.json();

  if (body.action === "rebalance") {
    const result = await rebalance();
    await logChange(user.email, "update", "rsvp-assign:rebalance", result, getIp(req));
    return NextResponse.json(result);
  }

  const ids: unknown = body.ids;
  const email: unknown = body.email;
  if (!Array.isArray(ids) || !ids.length || !ids.every(n => Number.isInteger(n)))
    return NextResponse.json({ error: "ids must be a non-empty array of RSVP ids" }, { status: 400 });
  if (email !== null && (typeof email !== "string" || !(await callerPool()).includes(email)))
    return NextResponse.json({ error: "That user is not in the caller pool" }, { status: 400 });

  const { count } = await db.rsvp.updateMany({ where: { id: { in: ids as number[] } }, data: { assignedTo: email as string | null } });
  await logChange(user.email, "update", "rsvp-assign:manual", { ids, to: email ?? "unassigned" }, getIp(req));
  return NextResponse.json({ updated: count });
}
