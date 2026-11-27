import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { rebalance } from "@/lib/rsvpAssign";
import { logChange, } from "@/lib/changelog";
import { getIp } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/welcomeEmail";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    include: { roles: { include: { role: { select: { id: true, name: true } } } } },
  });
  return NextResponse.json(users.map(u => ({ ...u, roles: u.roles.map(r => r.role) })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, name, role, roleIds } = await req.json();
  const clean = email?.trim().toLowerCase();
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (roleIds !== undefined && (!Array.isArray(roleIds) || !roleIds.every(n => Number.isInteger(n))))
    return NextResponse.json({ error: "roleIds must be an array of ids" }, { status: 400 });

  const isSuper = role === "super";
  // members get their roles in the same write; super needs none
  const roles = isSuper || !roleIds?.length ? [] :
    await db.role.findMany({ where: { id: { in: roleIds } }, select: { id: true, name: true } });

  try {
    const created = await db.adminUser.create({
      data: {
        email: clean, name: cleanName, role: isSuper ? "super" : "member",
        roles: { create: roles.map(r => ({ roleId: r.id })) },
      },
    });
    await logChange(user.email, "create", `user:${clean}`, { name: created.name, role: created.role, roles: roles.map(r => r.name) }, getIp(req));
    if (roles.length) await rebalance().then(r => { if (r.moved) return logChange(user.email, "update", "rsvp-assign:rebalance", { ...r, reason: `user added: ${clean}` }, getIp(req)); })
      .catch(e => console.error("[rsvp] rebalance failed:", e));
    void sendWelcomeEmail({
      to: clean, name: cleanName, roles: roles.map(r => r.name), isSuper,
      invitedBy: user.name || user.email, origin: req.nextUrl.origin,
    });
    return NextResponse.json({ ...created, roles });
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, name, role } = await req.json();
  const clean = email?.trim().toLowerCase();
  if (!clean) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const updated = await db.adminUser.update({
    where: { email: clean },
    data: {
      ...(name !== undefined && { name: name?.trim() || null }),
      ...(role !== undefined && { role: role === "super" ? "super" : "member" }),
    },
  });
  await logChange(user.email, "update", `user:${clean}`, { name: updated.name, role: updated.role }, getIp(req));
  // caller pool may have changed → even out RSVP assignments (never fails the request)
  await rebalance().then(r => { if (r.moved) return logChange(user.email, "update", "rsvp-assign:rebalance", { ...r, reason: `user updated: ${clean}` }, getIp(req)); })
    .catch(e => console.error("[rsvp] rebalance failed:", e));
  return NextResponse.json(updated);
}

// Send the welcome email to an existing user (older users never got one)
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clean: string = (await req.json()).email?.trim().toLowerCase() ?? "";
  const target = clean && await db.adminUser.findUnique({
    where: { email: clean }, include: { roles: { include: { role: { select: { name: true } } } } },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await sendWelcomeEmail({
    to: target.email, name: target.name || target.email.split("@")[0], roles: target.roles.map(r => r.role.name),
    isSuper: target.role === "super", invitedBy: user.name || user.email, origin: req.nextUrl.origin,
  });
  if (!ok) return NextResponse.json({ error: "Email could not be sent — check SMTP settings" }, { status: 502 });
  await logChange(user.email, "update", `user:${clean}`, { welcome: "sent" }, getIp(req));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await req.json();
  const clean = email?.trim().toLowerCase();
  if (!clean) return NextResponse.json({ error: "Email required" }, { status: 400 });
  if (clean === user.email) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  await db.adminUser.delete({ where: { email: clean } });
  await logChange(user.email, "delete", `user:${clean}`, undefined, getIp(req));
  // caller pool may have changed → even out RSVP assignments (never fails the request)
  await rebalance().then(r => { if (r.moved) return logChange(user.email, "update", "rsvp-assign:rebalance", { ...r, reason: `user removed: ${clean}` }, getIp(req)); })
    .catch(e => console.error("[rsvp] rebalance failed:", e));
  return NextResponse.json({ ok: true });
}
