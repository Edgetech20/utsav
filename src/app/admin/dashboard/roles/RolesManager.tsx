"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, X, Users } from "lucide-react";
import { C, Button, Empty, PageHeader, Search, Skeleton, Table, Thead, Th, Tbody, Td, Tr } from "../ui";
import { useToast } from "../toast";
import { PERMISSIONS, formPerms, splitPerm, type PermGroup } from "@/lib/permissions";

export type Role = { id: number; name: string; description: string | null; perms: string[]; users: string[] };

const CSS = `
.role-input { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid ${C.border}; border-radius: 8px;
  font: inherit; font-size: 13.5px; color: ${C.text}; background: ${C.surface}; transition: border-color .15s, box-shadow .15s; }
.role-input::placeholder { color: ${C.textMuted}; }
.role-input:focus { outline: none; border-color: ${C.gold}; box-shadow: 0 0 0 3px ${C.goldBg}; }
.role-dialog { margin: auto; inset: 0; padding: 0; border: none; border-radius: 14px; width: min(880px, calc(100vw - 32px)); max-height: calc(100vh - 48px);
  box-shadow: 0 24px 64px rgba(15,23,42,0.24); color: ${C.text}; }
.role-dialog::backdrop { background: rgba(15,23,42,0.45); }
.role-row:hover { background: #FAFBFC; }
.role-check { width: 15px; height: 15px; accent-color: ${C.gold}; cursor: pointer; flex-shrink: 0; }
.role-perm:hover { background: ${C.bg}; }
`;

// ── Role form (inside the dialog) ─────────────────────────────────────────────
function RoleForm({ role, groups, onCancel, onSaved }: {
  role: Role | null; // null = new
  groups: PermGroup[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName]     = useState(role?.name ?? "");
  const [desc, setDesc]     = useState(role?.description ?? "");
  const [perms, setPerms]   = useState<Set<string>>(() => new Set(role?.perms ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const hasView = (resource: string) => groups.some(g => g.perms.some(p => p.key === `${resource}:view`));

  // Any non-view action needs the resource's view; unticking view clears the rest of that resource.
  function toggle(key: string) {
    const { resource, action } = splitPerm(key);
    setPerms(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        if (action === "view") for (const k of prev) if (splitPerm(k).resource === resource) next.delete(k);
      } else {
        next.add(key);
        if (action !== "view" && hasView(resource)) next.add(`${resource}:view`);
      }
      return next;
    });
  }

  function toggleGroup(g: PermGroup, on: boolean) {
    setPerms(prev => {
      const next = new Set(prev);
      for (const p of g.perms) if (on) next.add(p.key); else next.delete(p.key);
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Role name is required"); return; }
    if (perms.size === 0) { setError("Pick at least one permission"); return; }
    setSaving(true); setError("");
    const r = await fetch("/api/admin/roles", {
      method: role ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: role?.id, name, description: desc, perms: [...perms] }),
    });
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { setError(data.error ?? "Failed to save role"); return; }
    toast(role ? "Role updated" : "Role created", "success");
    onSaved();
  }

  const visible = groups.filter(g => g.perms.length);

  return (
    <form onSubmit={save} style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{role ? `Edit role: ${role.name}` : "New role"}</h2>
          <p style={{ fontSize: 13, color: C.textSub, margin: "4px 0 0" }}>Pick what people with this role can do. Assign the role to users on the Users page.</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close"
          style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4, borderRadius: 6 }}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="role-name" style={{ fontSize: 13, fontWeight: 600 }}>Role name</label>
            <input id="role-name" autoFocus className="role-input" value={name}
              onChange={e => { setName(e.target.value); setError(""); }} placeholder="e.g. BPO User" maxLength={190} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="role-desc" style={{ fontSize: 13, fontWeight: 600 }}>Description <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional)</span></label>
            <input id="role-desc" className="role-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What this role is for" />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Permissions</p>
            <span style={{ fontSize: 12, color: C.textSub }}>{perms.size} selected</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
            {visible.map(g => {
              const on = g.perms.filter(p => perms.has(p.key)).length;
              const all = on === g.perms.length;
              return (
                <fieldset key={g.label} style={{ margin: 0, padding: 0, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", minWidth: 0 }}>
                  <legend style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{g.label}</legend>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#FAFBFC", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                    <input type="checkbox" className="role-check" checked={all}
                      ref={el => { if (el) el.indeterminate = on > 0 && !all; }}
                      onChange={() => toggleGroup(g, !all)} aria-label={`Select all ${g.label}`} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>{g.label}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{on}/{g.perms.length}</span>
                  </label>
                  <div style={{ padding: 6 }}>
                    {g.perms.map(p => (
                      <label key={p.key} className="role-perm" style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                        <input type="checkbox" className="role-check" checked={perms.has(p.key)} onChange={() => toggle(p.key)} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, background: "#FAFBFC" }}>
        <p role="alert" style={{ flex: 1, margin: 0, fontSize: 13, color: C.red }}>{error}</p>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{role ? "Save changes" : "Create role"}</Button>
      </div>
    </form>
  );
}

// ── Roles page body ───────────────────────────────────────────────────────────
export default function RolesManager({ roles, loading, reload }: { roles: Role[]; loading: boolean; reload: () => void }) {
  const { toast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [forms, setForms]       = useState<Array<{ slug: string; name: string }>>([]);
  const [editing, setEditing]   = useState<Role | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [q, setQ]               = useState("");

  useEffect(() => {
    fetch("/api/forms").then(r => r.ok ? r.json() : []).then(setForms).catch(() => {});
  }, []);

  // Native <dialog>: focus trap, Esc to close, backdrop — for free
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (editing && !d.open) d.showModal();
    if (!editing && d.open) d.close();
  }, [editing]);

  const groups = [...PERMISSIONS, formPerms(forms)];
  const groupOf = new Map(groups.flatMap(g => g.perms.map(p => [p.key, g.label] as const)));

  // "Medical Camp · 3, Registrations · 2" — compact summary per module
  function summary(perms: string[]) {
    const counts = new Map<string, number>();
    for (const p of perms) { const g = groupOf.get(p) ?? "Other"; counts.set(g, (counts.get(g) ?? 0) + 1); }
    return [...counts];
  }

  async function remove(r: Role) {
    setConfirmId(null);
    setDeleting(r.id);
    const res = await fetch("/api/admin/roles", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id }),
    });
    const data = await res.json().catch(() => ({}));
    setDeleting(null);
    if (!res.ok) { toast(data.error ?? "Failed to delete", "error"); return; }
    toast("Role deleted", "success");
    reload();
  }

  const needle = q.trim().toLowerCase();
  const filtered = roles.filter(r => !needle || r.name.toLowerCase().includes(needle) || (r.description ?? "").toLowerCase().includes(needle));

  return (
    <>
      <style>{CSS}</style>
      <PageHeader
        title="Roles"
        sub={`${roles.length} role${roles.length !== 1 ? "s" : ""} · build a role from permissions, then assign it on the Users page`}
        actions={<>
          <Search placeholder="Search roles…" value={q} onChange={e => setQ(e.target.value)} width={220} />
          <Button icon={<Plus size={14} />} onClick={() => setEditing("new")}>New Role</Button>
        </>}
      />

      <Table>
        <Thead>
          <Tr>
            <Th>Role</Th>
            <Th>Permissions</Th>
            <Th style={{ width: 110 }}>Users</Th>
            <Th style={{ width: 170, textAlign: "right" }}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <Tr key={i}>
              <Td><Skeleton width={140} height={13} /><Skeleton width={220} height={11} style={{ marginTop: 6 }} /></Td>
              <Td><Skeleton width={260} height={20} radius={20} /></Td>
              <Td><Skeleton width={40} height={13} /></Td>
              <Td><Skeleton width={120} height={28} radius={7} style={{ marginLeft: "auto" }} /></Td>
            </Tr>
          )) : filtered.length === 0 ? (
            <Tr><Td colSpan={4}>
              <Empty icon={<KeyRound size={40} />}
                title={needle ? "No roles match your search" : "No roles yet"}
                sub={needle ? "Try a different name" : "Create a role, pick its permissions, then assign it to users"} />
            </Td></Tr>
          ) : filtered.map(r => (
            <Tr key={r.id} className="role-row">
              <Td style={{ verticalAlign: "top" }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{r.name}</p>
                {r.description && <p style={{ fontSize: 12, color: C.textSub, margin: "3px 0 0", maxWidth: 360 }}>{r.description}</p>}
              </Td>
              <Td style={{ verticalAlign: "top" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }} title={r.perms.join("\n")}>
                  {summary(r.perms).map(([g, n]) => (
                    <span key={g} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: C.bg, border: `1px solid ${C.border}`, color: C.textSub, whiteSpace: "nowrap" }}>
                      {g} <b style={{ color: C.text, fontWeight: 600 }}>{n}</b>
                    </span>
                  ))}
                </div>
              </Td>
              <Td style={{ verticalAlign: "top" }}>
                <span title={r.users.join("\n") || "Not assigned"} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: r.users.length ? C.text : C.textMuted }}>
                  <Users size={13} color={C.textMuted} /> {r.users.length}
                </span>
              </Td>
              <Td style={{ verticalAlign: "top" }}>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {confirmId === r.id ? (<>
                    {r.users.length > 0 && <span style={{ fontSize: 11, color: C.textSub, alignSelf: "center" }}>Removes it from {r.users.length} user(s)</span>}
                    <Button variant="danger" size="sm" onClick={() => remove(r)}>Confirm</Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmId(null)}>Cancel</Button>
                  </>) : (<>
                    <Button variant="ghost" size="sm" icon={<Pencil size={12} />} onClick={() => setEditing(r)}>Edit</Button>
                    <Button variant="danger" size="sm" icon={<Trash2 size={12} />} loading={deleting === r.id}
                      title={r.users.length ? `Delete and unassign from: ${r.users.join(", ")}` : "Delete role"}
                      onClick={() => setConfirmId(r.id)}>Delete</Button>
                  </>)}
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <dialog ref={dialogRef} className="role-dialog" onClose={() => setEditing(null)} aria-label={editing === "new" ? "New role" : "Edit role"}>
        {editing && (
          <RoleForm
            key={editing === "new" ? "new" : editing.id}
            role={editing === "new" ? null : editing}
            groups={groups}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); reload(); }}
          />
        )}
      </dialog>
    </>
  );
}
