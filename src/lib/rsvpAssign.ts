// Automatic RSVP → caller assignment.
// Pool = non-super users whose roles include "rsvp:caller".
// Relative imports only: also run from scripts/migrate-roles.ts outside Next.
import { db } from "./db";
import { callCount } from "./permissions";

// ponytail: in-process lock — correct for the single PM2 process per site; needs a DB lock if ever clustered
let chain: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

export async function callerPool(): Promise<string[]> {
  const users = await db.adminUser.findMany({
    where: { role: { not: "super" }, roles: { some: { role: { permissions: { some: { perm: "rsvp:caller" } } } } } },
    select: { email: true },
    orderBy: { email: "asc" },
  });
  return users.map(u => u.email);
}

/** Give one new RSVP to the caller with the fewest assigned. Returns the email or null. */
export function assignNew(rsvpId: number): Promise<string | null> {
  return locked(async () => {
    const pool = await callerPool();
    if (!pool.length) return null;
    const counts = await db.rsvp.groupBy({ by: ["assignedTo"], where: { assignedTo: { in: pool } }, _count: true });
    const load = new Map(counts.map(c => [c.assignedTo!, c._count]));
    const email = pool.reduce((best, e) => ((load.get(e) ?? 0) < (load.get(best) ?? 0) ? e : best), pool[0]);
    await db.rsvp.update({ where: { id: rsvpId }, data: { assignedTo: email } });
    return email;
  });
}

export type RebalanceResult = { pool: number; moved: number; moves: Record<string, number> };
type Row = { id: number; assignedTo: string | null; notes: string | null };

/**
 * Pure planner: which RSVPs move where. Returns id → new caller (null = unassign).
 * - RSVPs of people who left the pool (and unassigned ones) are redistributed.
 * - Over-target callers give away only NOT-yet-called RSVPs; anything with a call logged stays put.
 * - Empty pool → everything becomes unassigned.
 */
export function planRebalance(pool: string[], rows: Row[]): Map<number, string | null> {
  const next = new Map<number, string | null>();
  if (!pool.length) {
    for (const r of rows) if (r.assignedTo) next.set(r.id, null);
    return next;
  }

  const lists = new Map(pool.map(e => [e, [] as Row[]]));
  const free: Row[] = [];
  for (const r of rows) (r.assignedTo && lists.has(r.assignedTo) ? lists.get(r.assignedTo)! : free).push(r);

  // Targets differ by at most 1; the +1s go to whoever already has most, to move less.
  const base = Math.floor(rows.length / pool.length), extra = rows.length % pool.length;
  const target = new Map([...pool].sort((a, b) => lists.get(b)!.length - lists.get(a)!.length)
    .map((e, i) => [e, base + (i < extra ? 1 : 0)]));

  for (const [email, list] of lists) {
    let excess = list.length - target.get(email)!;
    // give away the newest not-called RSVPs first
    for (let i = list.length - 1; i >= 0 && excess > 0; i--) {
      if (callCount(list[i].notes) === 0) { free.push(...list.splice(i, 1)); excess--; }
    }
  }

  const gap = (x: string) => lists.get(x)!.length - target.get(x)!;
  for (const r of free) {
    // furthest below target first; ties → fewest assigned
    const email = pool.reduce((best, e) =>
      gap(e) < gap(best) || (gap(e) === gap(best) && lists.get(e)!.length < lists.get(best)!.length) ? e : best, pool[0]);
    lists.get(email)!.push(r);
    if (r.assignedTo !== email) next.set(r.id, email);
  }
  return next;
}

/** Even out RSVPs across the caller pool (see planRebalance) and write the moves. */
export function rebalance(): Promise<RebalanceResult> {
  return locked(async () => {
    const pool = await callerPool();
    const rows = await db.rsvp.findMany({ select: { id: true, assignedTo: true, notes: true }, orderBy: { submittedAt: "asc" } });
    const next = planRebalance(pool, rows);

    const byTarget = new Map<string | null, number[]>();
    for (const [id, email] of next) byTarget.set(email, [...(byTarget.get(email) ?? []), id]);
    await db.$transaction([...byTarget].map(([email, ids]) =>
      db.rsvp.updateMany({ where: { id: { in: ids } }, data: { assignedTo: email } })));

    const moves: Record<string, number> = {};
    for (const [email, ids] of byTarget) moves[email ?? "unassigned"] = ids.length;
    return { pool: pool.length, moved: next.size, moves };
  });
}
