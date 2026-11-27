import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { isScopedCaller } from "@/lib/permissions";

export type ModuleKey = "admin" | "camp" | "volunteer";
export type ModuleTile = { key: ModuleKey; name: string; desc: string; href: string };

/** Modules this user can open, in launcher order. Add a module here and it appears on /login. */
export async function userModules(user: SessionUser): Promise<ModuleTile[]> {
  const isSuper = user.role === "super";
  const has = (pred: (resource: string) => boolean) => isSuper || user.permissions.some(p => pred(p.resource));
  const out: ModuleTile[] = [];

  if (has(r => r !== "camp" && r !== "volunteer")) {
    out.push(isScopedCaller(user)
      ? { key: "admin", name: "RSVP Calls", desc: "Guests assigned to you to call", href: "/admin/dashboard/rsvp" }
      : { key: "admin", name: "Admin Dashboard", desc: "RSVPs, content, forms, WhatsApp and settings", href: "/admin/dashboard" });
  }

  if (has(r => r === "camp")) {
    // same rule as the camp layout: module must be switched on, super bypasses
    const enabled = isSuper || (await db.setting.findUnique({ where: { key: "camp_enabled" } }))?.value === "true";
    if (enabled) out.push({ key: "camp", name: "Medical Camp", desc: "Registration, doctors, pharmacy and reports", href: "/camp" });
  }

  if (has(r => r === "volunteer")) {
    out.push({ key: "volunteer", name: "Volunteers", desc: "Volunteer list, departments and ID cards", href: "/volunteer" });
  }
  return out;
}
