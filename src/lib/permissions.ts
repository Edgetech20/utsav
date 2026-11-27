// Permission catalog — the only list of permissions. Roles are built from these keys.
// Key format "resource:action"; per-form keys are "form:<slug>:<action>" (split on the LAST colon).
// No imports here: also loaded by scripts/migrate-roles.ts outside Next.

export type PermGroup = { label: string; perms: Array<{ key: string; label: string }> };

export const PERMISSIONS: PermGroup[] = [
  { label: "Registrations", perms: [
    { key: "rsvp:view",     label: "View RSVPs" },
    { key: "rsvp:edit",     label: "Edit RSVPs" },
    { key: "rsvp:delete",   label: "Delete RSVPs" },
    { key: "feedback:view", label: "View feedback" },
  ]},
  { label: "Content", perms: [
    { key: "attractions:view", label: "View attractions" },
    { key: "attractions:edit", label: "Edit attractions" },
    { key: "programme:view",   label: "View programme" },
    { key: "programme:edit",   label: "Edit programme" },
  ]},
  { label: "Operations", perms: [
    { key: "forms:view",     label: "View all forms" },
    { key: "forms:edit",     label: "Edit all forms" },
    { key: "forms:delete",   label: "Delete form responses (all forms)" },
    { key: "qr:view",        label: "View QR codes" },
    { key: "qr:edit",        label: "Edit QR codes" },
    { key: "whatsapp:view",  label: "View WhatsApp" },
    { key: "whatsapp:edit",  label: "Manage WhatsApp" },
    { key: "templates:view", label: "View templates" },
    { key: "templates:edit", label: "Edit templates" },
  ]},
  { label: "Admin", perms: [
    { key: "settings:edit",  label: "Edit settings" },
    { key: "changelog:view", label: "View change log" },
  ]},
  { label: "Medical Camp", perms: [
    { key: "camp:view",     label: "View reports & stats" },
    { key: "camp:register", label: "Register patients" },
    { key: "camp:consult",  label: "Doctor console" },
    { key: "camp:dispense", label: "Pharmacy / dispense" },
    { key: "camp:manage",   label: "Manage departments, doctors, medicines" },
    { key: "camp:delete",   label: "Delete patients" },
  ]},
  { label: "Volunteers", perms: [
    { key: "volunteer:view",       label: "View volunteers" },
    { key: "volunteer:edit",       label: "Add / edit volunteers" },
    { key: "volunteer:delete",     label: "Delete volunteers" },
    { key: "volunteer:print_card", label: "Print ID cards" },
  ]},
];

/** Per-form permissions, generated from the forms in the DB. */
export function formPerms(forms: Array<{ slug: string; name: string }>): PermGroup {
  return {
    label: "Individual forms",
    perms: forms.flatMap(f => (["view", "edit", "delete"] as const).map(a => ({
      key: `form:${f.slug}:${a}`, label: `${f.name} — ${a}`,
    }))),
  };
}

/** "form:slug:view" → { resource: "form:slug", action: "view" } */
export function splitPerm(key: string): { resource: string; action: string } {
  const i = key.lastIndexOf(":");
  return { resource: key.slice(0, i), action: key.slice(i + 1) };
}

const all = (prefix: string) =>
  PERMISSIONS.flatMap(g => g.perms.map(p => p.key)).filter(k => k.startsWith(prefix + ":"));

/** Created by the migration script; ordinary editable roles afterwards. */
export const STARTER_ROLES: Array<{ name: string; description: string; perms: string[] }> = [
  { name: "Camp Admin",        description: "Full medical camp access",          perms: all("camp") },
  { name: "Camp Doctor",       description: "Doctor console",                    perms: ["camp:view", "camp:consult"] },
  { name: "Pharmacist",        description: "Pharmacy queue",                    perms: ["camp:view", "camp:dispense"] },
  { name: "Registration Desk", description: "Patient registration",              perms: ["camp:view", "camp:register"] },
  { name: "Camp Viewer",       description: "Camp reports, read-only",           perms: ["camp:view"] },
  { name: "Volunteer Admin",   description: "Full volunteer module access",      perms: all("volunteer") },
];
