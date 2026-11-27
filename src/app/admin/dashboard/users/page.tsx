"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { UserPlus, Users, Trash2, Pencil, ShieldCheck, Save, X, Mail } from "lucide-react";
import { C, Button, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Avatar, Search } from "../ui";
import { useToast } from "../toast";
import type { Role } from "../roles/RolesManager";

type RoleRef = { id: number; name: string };
type AdminUser = { email: string; name: string | null; role: string; createdAt: string; welcomedAt?: string | null; roles: RoleRef[] };

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>{Array.from({ length: 4 }).map((_, i) => (
      <Tr key={i}>
        <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Skeleton width={32} height={32} radius={99} /><Skeleton width={160} height={13} /></div></Td>
        <Td><Skeleton width={70} height={22} radius={20} /></Td>
        <Td><Skeleton width={110} height={13} /></Td>
        <Td><Skeleton width={80} height={28} radius={7} /></Td>
      </Tr>
    ))}</>
  );
}

// ── Add / edit user dialog ────────────────────────────────────────────────────
const DIALOG_CSS = `
.user-dialog { margin: auto; inset: 0; padding: 0; border: none; border-radius: 14px; width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 48px); box-shadow: 0 24px 64px rgba(15,23,42,0.24); color: ${C.text}; }
.user-dialog::backdrop { background: rgba(15,23,42,0.45); }
.user-input { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid ${C.border}; border-radius: 8px;
  font: inherit; font-size: 13.5px; color: ${C.text}; background: ${C.surface}; transition: border-color .15s, box-shadow .15s; }
.user-input::placeholder { color: ${C.textMuted}; }
.user-input:focus { outline: none; border-color: ${C.gold}; box-shadow: 0 0 0 3px ${C.goldBg}; }
.user-input:read-only { background: ${C.bg}; color: ${C.textSub}; }
.user-role:hover { background: ${C.bg}; }
`;

/** Mounted = open. `target` null → add a new user; otherwise edit that user. */
function UserDialog({ target, roles, onClose, onSaved }: {
  target: AdminUser | null;
  roles: Role[];
  onClose: () => void;
  onSaved: (u: AdminUser, isNew: boolean) => void;
}) {
  const { toast } = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const isNew = target === null;
  const [name, setName]     = useState(target?.name ?? "");
  const [email, setEmail]   = useState(target?.email ?? "");
  const [access, setAccess] = useState<"member" | "super">(target?.role === "super" ? "super" : "member");
  const [picked, setPicked] = useState<Set<number>>(() => new Set(target?.roles.map(r => r.id) ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  // Native <dialog>: centred, focus-trapped, Esc closes
  useEffect(() => { ref.current?.showModal(); }, []);

  function toggle(id: number) {
    setPicked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (access === "member" && picked.size === 0) { setError("Pick at least one role, or make them Super Admin"); return; }
    setSaving(true); setError("");
    const roleIds = access === "member" ? [...picked] : [];
    const json = { "Content-Type": "application/json" };

    if (isNew) {
      const r = await fetch("/api/admin/users", {
        method: "POST", headers: json,
        body: JSON.stringify({ email, name: name.trim(), role: access, roleIds }),
      });
      const data = await r.json().catch(() => ({}));
      setSaving(false);
      if (!r.ok) { setError(data.error ?? "Could not add user"); return; }
      toast("User added — a welcome email is on its way", "success");
      onSaved(data, true);
      return;
    }

    const ur = await fetch("/api/admin/users", {
      method: "PUT", headers: json,
      body: JSON.stringify({ email: target.email, name: name.trim(), role: access }),
    });
    if (!ur.ok) { setSaving(false); setError((await ur.json().catch(() => ({}))).error ?? "Could not update user"); return; }
    const rr = await fetch(`/api/admin/users/${encodeURIComponent(target.email)}/roles`, {
      method: "PUT", headers: json, body: JSON.stringify({ roleIds }),
    });
    setSaving(false);
    if (!rr.ok) { setError((await rr.json().catch(() => ({}))).error ?? "Could not save roles"); return; }
    toast("User updated", "success");
    onSaved({ ...target, name: name.trim(), role: access, roles: await rr.json() }, false);
  }

  return (
    <dialog ref={ref} className="user-dialog" onClose={onClose} aria-labelledby="user-dialog-title">
      <style>{DIALOG_CSS}</style>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 id="user-dialog-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{isNew ? "Add user" : "Edit user"}</h2>
            <p style={{ fontSize: 13, color: C.textSub, margin: "4px 0 0" }}>
              {isNew
                ? "We'll email them a sign-in link. They log in with a one-time code — no password."
                : "Changes apply on their next page load."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="ud-name" style={{ fontSize: 13, fontWeight: 600 }}>Full name</label>
              <input id="ud-name" className="user-input" autoFocus required value={name} autoComplete="off"
                onChange={e => { setName(e.target.value); setError(""); }} placeholder="Shown in notes and logs" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="ud-email" style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
              <input id="ud-email" className="user-input" type="email" required value={email} autoComplete="off"
                readOnly={!isNew} aria-describedby={isNew ? undefined : "ud-email-help"}
                onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="name@example.com" />
              {!isNew && <p id="ud-email-help" style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Email is their login and can&apos;t be changed.</p>}
            </div>
          </div>

          <fieldset style={{ border: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, padding: 0 }}>Access</legend>
            {([["member", "Member", "Can do only what their roles allow"], ["super", "Super Admin", "Full access to everything, including users and roles"]] as const).map(([v, label, desc]) => (
              <label key={v} className="user-role" style={{
                display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${access === v ? C.gold : C.border}`, background: access === v ? C.goldBg : C.surface,
              }}>
                <input type="radio" name="ud-access" checked={access === v} onChange={() => { setAccess(v); setError(""); }} style={{ marginTop: 3, accentColor: C.gold }} />
                <span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                    {v === "super" && <ShieldCheck size={13} color={C.gold} />}{label}
                  </span>
                  <span style={{ display: "block", fontSize: 12, color: C.textSub, marginTop: 2 }}>{desc}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {access === "member" && (
            <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, padding: 0, width: "100%", display: "flex", justifyContent: "space-between" }}>
                Roles <span style={{ fontWeight: 400, fontSize: 12, color: C.textSub }}>{picked.size} selected</span>
              </legend>
              {roles.length === 0 ? (
                <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>
                  No roles yet. <Link href="/admin/dashboard/roles" style={{ color: C.gold, fontWeight: 600 }}>Create a role</Link> first.
                </p>
              ) : (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {roles.map((r, i) => (
                    <label key={r.id} className="user-role" style={{
                      display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", cursor: "pointer",
                      borderTop: i ? `1px solid ${C.borderLight}` : "none", background: picked.has(r.id) ? C.goldBg : undefined,
                    }}>
                      <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} style={{ marginTop: 3, accentColor: C.gold }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                        {r.description && <span style={{ display: "block", fontSize: 12, color: C.textSub, marginTop: 2 }}>{r.description}</span>}
                      </span>
                      <span style={{ fontSize: 11, color: C.textMuted, whiteSpace: "nowrap" }}>{r.perms.length} permission{r.perms.length === 1 ? "" : "s"}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, background: "#FAFBFC" }}>
          <p role="alert" style={{ flex: 1, margin: 0, fontSize: 13, color: C.red }}>{error}</p>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} icon={isNew ? <UserPlus size={14} /> : <Save size={14} />}>{isNew ? "Add user" : "Save changes"}</Button>
        </div>
      </form>
    </dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [welcoming, setWelcoming] = useState<string | null>(null);
  const [dialog, setDialog]     = useState<AdminUser | "new" | null>(null);
  const [roles, setRoles]       = useState<Role[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/users");
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }, []);

  const loadRoles = useCallback(async () => {
    const r = await fetch("/api/admin/roles");
    if (r.ok) setRoles(await r.json());
  }, []);

  useEffect(() => { load(); loadRoles(); }, [load, loadRoles]);

  async function remove(em: string) {
    setDeleting(em);
    const r = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: em }),
    });
    if (r.ok) {
      toast("User removed", "success");
      setUsers(u => u.filter(x => x.email !== em));
    } else {
      toast((await r.json().catch(() => ({}))).error ?? "Failed to remove", "error");
    }
    setDeleting(null);
  }

  async function sendWelcome(em: string) {
    setWelcoming(em);
    const r = await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em }),
    });
    setWelcoming(null);
    if (!r.ok) { toast((await r.json().catch(() => ({}))).error ?? "Failed to send", "error"); return; }
    toast("Welcome email sent", "success");
    setUsers(us => us.map(x => x.email === em ? { ...x, welcomedAt: new Date().toISOString() } : x));
  }

  const q = search.toLowerCase();
  const filtered = users.filter(u => u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Admin Users"
        sub={`${users.length} user${users.length !== 1 ? "s" : ""} · super admin has full access`}
        actions={(
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Search placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <Button icon={<UserPlus size={14} />} onClick={() => setDialog("new")}>Add User</Button>
          </div>
        )}
      />

      {dialog && (
        <UserDialog
          key={dialog === "new" ? "new" : dialog.email}
          target={dialog === "new" ? null : dialog}
          roles={roles}
          onClose={() => setDialog(null)}
          onSaved={(u, isNew) => {
            // new users get the welcome email automatically (stamped server-side a moment later)
            setUsers(prev => isNew ? [...prev, { ...u, welcomedAt: new Date().toISOString() }] : prev.map(x => x.email === u.email ? { ...u, welcomedAt: x.welcomedAt } : x));
            setDialog(null);
            loadRoles(); // role "assigned to" counts changed
          }}
        />
      )}

      <Table>
        <Thead>
          <Tr>
            <Th>User</Th>
            <Th>Roles</Th>
            <Th>Added</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {loading ? <SkeletonRows /> : filtered.length === 0 ? (
            <Tr><Td colSpan={4}><Empty icon={<Users size={40} />} title="No users found" sub={search ? "Try a different search" : "Add the first admin user above"} /></Td></Tr>
          ) : filtered.map(u => (
            <Tr key={u.email} style={{ cursor: "pointer" }} onClick={() => setDialog(u)}>
              <Td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={u.name || u.email} size={32} />
                  <div>
                    <p style={{ fontWeight: 500, color: C.text, margin: 0, lineHeight: 1.3 }}>{u.name || u.email.split("@")[0]}</p>
                    <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {u.role === "super" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: C.goldBg, color: C.gold, border: `1px solid ${C.goldBorder}` }}>
                      <ShieldCheck size={11} /> Super
                    </span>
                  ) : u.roles.length === 0 ? (
                    <span style={{ fontSize: 12, color: C.textMuted }}>No roles</span>
                  ) : u.roles.map(r => (
                    <span key={r.id} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: C.bg, color: C.textSub, border: `1px solid ${C.border}` }}>
                      {r.name}
                    </span>
                  ))}
                </div>
              </Td>
              <Td style={{ color: C.textMuted }}>
                {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </Td>
              <Td>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {!u.welcomedAt && (
                    <Button variant="secondary" size="sm" icon={<Mail size={13} />} loading={welcoming === u.email}
                      title="Email this user their sign-in instructions"
                      onClick={e => { e.stopPropagation(); sendWelcome(u.email); }}>
                      Send welcome
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={<Pencil size={13} />}
                    onClick={e => { e.stopPropagation(); setDialog(u); }}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon={<Trash2 size={13} />} loading={deleting === u.email}
                    onClick={e => { e.stopPropagation(); remove(u.email); }}>
                    Remove
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
