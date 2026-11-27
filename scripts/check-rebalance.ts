// Self-check for the caller rebalance planner.   npx jiti scripts/check-rebalance.ts
import assert from "node:assert/strict";
import { planRebalance } from "../src/lib/rsvpAssign";

const called = JSON.stringify([{ type: "call1", text: "spoke" }]);
const mk = (n: number, who: string | null, calledCount = 0, start = 0) =>
  Array.from({ length: n }, (_, i) => ({ id: start + i, assignedTo: who, notes: i < calledCount ? called : null }));
const tally = (rows: ReturnType<typeof mk>, plan: Map<number, string | null>) => {
  const t: Record<string, number> = {};
  for (const r of rows) { const w = plan.has(r.id) ? plan.get(r.id) : r.assignedTo; t[w ?? "-"] = (t[w ?? "-"] ?? 0) + 1; }
  return t;
};

// C joins: A 150 (100 called), B 150 (60 called) → 100 each, no called RSVP moves
{
  const rows = [...mk(150, "a", 100, 0), ...mk(150, "b", 60, 1000)];
  const plan = planRebalance(["a", "b", "c"], rows);
  assert.deepEqual(tally(rows, plan), { a: 100, b: 100, c: 100 });
  for (const id of plan.keys()) assert.equal(rows.find(r => r.id === id)!.notes, null, "called RSVP moved");
}

// C leaves: their 100 (incl. called ones) split between A and B
{
  const rows = [...mk(100, "a", 0, 0), ...mk(100, "b", 0, 1000), ...mk(100, "c", 30, 2000)];
  assert.deepEqual(tally(rows, planRebalance(["a", "b"], rows)), { a: 150, b: 150 });
}

// Unassigned RSVPs + uneven count → differ by at most 1
{
  const rows = mk(7, null);
  const t = tally(rows, planRebalance(["a", "b", "c"], rows));
  assert.deepEqual(Object.values(t).sort(), [2, 2, 3]);
}

// Empty pool → everything unassigned
{
  const rows = mk(5, "a");
  assert.deepEqual(tally(rows, planRebalance([], rows)), { "-": 5 });
}

// Already balanced → nothing moves
{
  const rows = [...mk(10, "a", 0, 0), ...mk(10, "b", 0, 100)];
  assert.equal(planRebalance(["a", "b"], rows).size, 0);
}

console.log("rebalance checks passed");
