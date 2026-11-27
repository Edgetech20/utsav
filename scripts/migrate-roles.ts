// One-time: convert per-user AdminPermission rows into roles. Safe to re-run.
// Run once per client DB after `npx prisma db push`:   npx jiti scripts/migrate-roles.ts
// AdminPermission rows are left untouched (dropped in a later release).
import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, STARTER_ROLES } from "../src/lib/permissions";

const db = new PrismaClient();
const ACTIONS = new Set(PERMISSIONS.flatMap(g => g.perms.map(p => p.key.split(":").pop()!)));

const CAMP_ROLE: Record<string, string> = {
  edit: "Camp Admin", doctor: "Camp Doctor", pharmacist: "Pharmacist",
  medical: "Registration Desk", view: "Camp Viewer",
};
// old volunteer view/edit → new keys
const VOL: Record<string, string[]> = {
  view: ["volunteer:view"],
  edit: ["volunteer:view", "volunteer:edit", "volunteer:delete", "volunteer:print_card"],
};

async function upsertRole(name: string, description: string, perms: string[]) {
  const role = await db.role.upsert({ where: { name }, create: { name, description }, update: {} });
  await db.rolePermission.createMany({ data: perms.map(perm => ({ roleId: role.id, perm })), skipDuplicates: true });
  return role;
}

async function main() {
  const starters = new Map<string, number>();
  for (const r of STARTER_ROLES) starters.set(r.name, (await upsertRole(r.name, r.description, r.perms)).id);

  const users = await db.adminUser.findMany({ where: { role: { not: "super" } }, include: { permissions: true } });

  // group members with an identical non-camp permission set into one legacy role
  const groups = new Map<string, string[]>();
  for (const u of users) {
    const assign: number[] = [];
    const camp = u.permissions.find(p => p.resource === "camp");
    if (camp && CAMP_ROLE[camp.action]) assign.push(starters.get(CAMP_ROLE[camp.action])!);

    const rest = u.permissions
      .filter(p => p.resource !== "camp")
      .flatMap(p => p.resource === "volunteer" ? VOL[p.action] ?? [] : [`${p.resource}:${p.action}`]);
    // drops malformed legacy rows, e.g. { resource: "form", action: "<slug>" } from an old split bug
    const key = [...new Set(rest)].filter(k => ACTIONS.has(k.slice(k.lastIndexOf(":") + 1))).sort().join(",");
    if (key) groups.set(key, [...(groups.get(key) ?? []), u.email]);

    await db.userRole.createMany({ data: assign.map(roleId => ({ email: u.email, roleId })), skipDuplicates: true });
    console.log(`${u.email}: camp=${camp?.action ?? "-"} other=[${key}]`);
  }

  for (const [key, emails] of groups) {
    const name = `Legacy: ${emails.map(e => e.split("@")[0]).join(", ")}`.slice(0, 190);
    const role = await upsertRole(name, "Auto-created from old per-user permissions — rename or merge", key.split(","));
    await db.userRole.createMany({ data: emails.map(email => ({ email, roleId: role.id })), skipDuplicates: true });
    console.log(`role "${name}" → ${emails.length} user(s)`);
  }
}

main().finally(() => db.$disconnect());
