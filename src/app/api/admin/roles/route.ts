import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getIp } from "@/lib/auth";
import { rebalance } from "@/lib/rsvpAssign";
import { logChange } from "@/lib/changelog";
import { PERMISSIONS } from "@/lib/permissions";

const CATALOG = new Set(PERMISSIONS.flatMap(g => g.perms.map(p => p.key)));
const validPerm = (k: unknown) =>
  typeof k === "string" && (CATALOG.has(k) || /^form:[^:]+:(view|edit|delete)$/.test(k));

async function superOnly(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return { err: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  if (user.role !== "super") return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

/** Validates the body; returns cleaned fields or an error message. */
function parse(body: { name?: unknown; description?: unknown; perms?: unknown }) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return { error: "Role name is required" };
  if (!Array.isArray(body.perms) || !body.perms.every(validPerm)) return { error: "Invalid permissions" };
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  return { name, description, perms: [...new Set(body.perms as string[])] };
}

const shape = (r: { id: number; name: string; description: string | null; permissions: { perm: string }[]; users: { email: string }[] }) => ({
  id: r.id, name: r.name, description: r.description,
  perms: r.permissions.map(p => p.perm), users: r.users.map(u => u.email),
});
const include = { permissions: true, users: { select: { email: true } } } as const;

export async function GET(req: NextRequest) {
  const { err } = await superOnly(req);
  if (err) return err;
  const roles = await db.role.findMany({ orderBy: { name: "asc" }, include });
  return NextResponse.json(roles.map(shape));
}

export async function POST(req: NextRequest) {
  const { user, err } = await superOnly(req);
  if (err) return err;
  const p = parse(await req.json());
  if ("error" in p) return NextResponse.json({ error: p.error }, { status: 400 });

  if (await db.role.findUnique({ where: { name: p.name } }))
    return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });

  const role = await db.role.create({
    data: { name: p.name, description: p.description, permissions: { create: p.perms.map(perm => ({ perm })) } },
    include,
  });
  await logChange(user.email, "create", `role:${p.name}`, { perms: p.perms }, getIp(req));
  return NextResponse.json(shape(role));
}

export async function PUT(req: NextRequest) {
  const { user, err } = await superOnly(req);
  if (err) return err;
  const body = await req.json();
  const id = Number(body.id);
  const p = parse(body);
  if ("error" in p) return NextResponse.json({ error: p.error }, { status: 400 });

  const clash = await db.role.findUnique({ where: { name: p.name } });
  if (clash && clash.id !== id)
    return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });

  const [, , role] = await db.$transaction([
    db.rolePermission.deleteMany({ where: { roleId: id } }),
    db.rolePermission.createMany({ data: p.perms.map(perm => ({ roleId: id, perm })) }),
    db.role.update({ where: { id }, data: { name: p.name, description: p.description }, include }),
  ]);
  await logChange(user.email, "update", `role:${p.name}`, { perms: p.perms }, getIp(req));
  // caller pool may have changed → even out RSVP assignments (never fails the request)
  await rebalance().then(r => { if (r.moved) return logChange(user.email, "update", "rsvp-assign:rebalance", { ...r, reason: `role edited: ${p.name}` }, getIp(req)); })
    .catch(e => console.error("[rsvp] rebalance failed:", e));
  return NextResponse.json(shape(role));
}

export async function DELETE(req: NextRequest) {
  const { user, err } = await superOnly(req);
  if (err) return err;
  const id = Number((await req.json()).id);

  const role = await db.role.findUnique({ where: { id }, include });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  if (role.users.length)
    return NextResponse.json({ error: `Still assigned to: ${role.users.map(u => u.email).join(", ")}` }, { status: 409 });

  await db.role.delete({ where: { id } });
  await logChange(user.email, "delete", `role:${role.name}`, {}, getIp(req));
  // caller pool may have changed → even out RSVP assignments (never fails the request)
  await rebalance().then(r => { if (r.moved) return logChange(user.email, "update", "rsvp-assign:rebalance", { ...r, reason: `role deleted: ${role.name}` }, getIp(req)); })
    .catch(e => console.error("[rsvp] rebalance failed:", e));
  return NextResponse.json({ ok: true });
}
