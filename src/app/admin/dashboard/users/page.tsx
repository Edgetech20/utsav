"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { UserPlus, Users, Trash2, ChevronDown, ChevronUp, ShieldCheck, User, Save } from "lucide-react";
import { C, Button, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Avatar, Search } from "../ui";
import { useToast } from "../toast";

type Perm = { resource: string; action: string };
type AdminUser = { email: string; name: string | null; role: string; createdAt: string; permissions: Perm[] };
type Form = { slug: string; name: string };

// ── Resource definitions ───────────────────────────────────────────────────────
const RESOURCE_GROUPS = [
  {
    label: "Registrations",
    items: [
      { key: "rsvp",     label: "RSVP",     actions: ["view", "edit"] },
      { key: "feedback", label: "Feedback",  actions: ["view"] },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "attractions", label: "Attractions", actions: ["view", "edit"] },
      { key: "programme",   label: "Programme",   actions: ["view", "edit"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "forms",     label: "Forms (all)", actions: ["view", "edit"] },
      { key: "qr",        label: "QR Codes",    actions: ["view", "edit"] },
      { key: "whatsapp",  label: "WhatsApp",    actions: ["view", "edit"] },
      { key: "templates", label: "Templates",   actions: ["view", "edit"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { key: "settings",  label: "Settings",   actions: ["edit"] },
      { key: "changelog", label: "Change Log", actions: ["view"] },
    ],
  },
];

// ── Permission editor ─────────────────────────────────────────────────────────
function PermissionEditor({ target, onClose, onSaved }: {
  target: AdminUser;
  onClose: () => void;
  onSaved: (u: AdminUser) => void;
}) {
  const { toast } = useToast();
  const [name, setName]       = useState(target.name ?? "");
  const [role, setRole]       = useState(target.role);
  const [perms, setPerms]     = useState<Set<string>>(
    () => new Set(target.permissions.map(p => `${p.resource}:${p.action}`))
  );
  const [forms, setForms]     = useState<Form[]>([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    fetch("/api/forms").then(r => r.ok ? r.json() : []).then((data: Form[]) => setForms(data)).catch(() => {});
  }, []);

  function toggle(resource: string, action: string) {
    const key = `${resource}:${action}`;
    const editKey = `${resource}:edit`;
    const viewKey = `${resource}:view`;
    setPerms(prev => {
      const next = new Set(prev);
      if (action === "edit") {
        if (next.has(key)) { next.delete(key); }
        else { next.add(key); next.add(viewKey); } // edit implies view
      } else {
        // view toggle — only if edit is not set
        if (next.has(editKey)) return next; // locked by edit
        if (next.has(key)) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    // Update name + role
    const ur = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target.email, name: name || null, role }),
    });
    if (!ur.ok) { toast("Failed to update user", "error"); setSaving(false); return; }

    // Update permissions (only for members)
    const permissions: Perm[] = role === "super" ? [] :
      Array.from(perms).map(k => {
        const [resource, action] = k.split(":");
        return { resource, action };
      });

    const pr = await fetch(`/api/admin/users/${encodeURIComponent(target.email)}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    });
    if (!pr.ok) { toast("Failed to save permissions", "error"); setSaving(false); return; }

    const updated: AdminUser = { ...target, name: name || null, role, permissions };
    toast("Saved", "success");
    onSaved(updated);
    setSaving(false);
  }

  const isSuper = role === "super";

  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: 20, display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* Name + Role */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Display Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={target.email.split("@")[0]}
            style={{ width: "100%", padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.surface, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{ width: "100%", padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.surface, outline: "none" }}
          >
            <option value="member">Member</option>
            <option value="super">Super Admin</option>
          </select>
        </div>
      </div>

      {isSuper ? (
        <div style={{ padding: "12px 16px", background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 8, fontSize: 13, color: C.gold, fontWeight: 500 }}>
          Super Admin has full access to everything — no per-section permissions needed.
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Permissions</p>

          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 56px", gap: 0, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: C.textMuted }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: "center", textTransform: "uppercase" }}>View</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: "center", textTransform: "uppercase" }}>Edit</span>
          </div>

          {RESOURCE_GROUPS.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "8px 0 4px", paddingLeft: 4 }}>{group.label}</p>
              {group.items.map(item => {
                const hasEdit   = perms.has(`${item.key}:edit`);
                const hasView   = perms.has(`${item.key}:view`) || hasEdit;
                const viewLocked = hasEdit; // edit implies view
                return (
                  <div key={item.key} style={{
                    display: "grid", gridTemplateColumns: "1fr 56px 56px",
                    alignItems: "center", padding: "7px 8px",
                    borderRadius: 6, background: (hasView || hasEdit) ? C.goldBg : "transparent",
                    marginBottom: 2,
                  }}>
                    <span style={{ fontSize: 13, color: C.text }}>{item.label}</span>
                    {/* View */}
                    <div style={{ textAlign: "center" }}>
                      {item.actions.includes("view") && (
                        <input
                          type="checkbox"
                          checked={hasView}
                          disabled={viewLocked}
                          onChange={() => toggle(item.key, "view")}
                          style={{ cursor: viewLocked ? "default" : "pointer", accentColor: C.gold }}
                        />
                      )}
                    </div>
                    {/* Edit */}
                    <div style={{ textAlign: "center" }}>
                      {item.actions.includes("edit") && (
                        <input
                          type="checkbox"
                          checked={hasEdit}
                          onChange={() => toggle(item.key, "edit")}
                          style={{ cursor: "pointer", accentColor: C.gold }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Per-form permissions after the global "forms" row */}
              {gi === RESOURCE_GROUPS.findIndex(g => g.items.some(i => i.key === "forms")) && forms.length > 0 && (
                <div style={{ marginLeft: 16, marginTop: 2 }}>
                  <p style={{ fontSize: 10, color: C.textMuted, margin: "4px 0 2px", fontStyle: "italic" }}>Per-form access</p>
                  {forms.map(f => {
                    const rk = `form:${f.slug}`;
                    const fEdit = perms.has(`${rk}:edit`);
                    const fView = perms.has(`${rk}:view`) || fEdit;
                    return (
                      <div key={f.slug} style={{
                        display: "grid", gridTemplateColumns: "1fr 56px 56px",
                        alignItems: "center", padding: "5px 8px",
                        borderRadius: 6, background: (fView || fEdit) ? C.goldBg : "transparent",
                        marginBottom: 2,
                      }}>
                        <span style={{ fontSize: 12, color: C.textSub }}>↳ {f.name}</span>
                        <div style={{ textAlign: "center" }}>
                          <input type="checkbox" checked={fView} disabled={fEdit} onChange={() => toggle(rk, "view")} style={{ cursor: fEdit ? "default" : "pointer", accentColor: C.gold }} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <input type="checkbox" checked={fEdit} onChange={() => toggle(rk, "edit")} style={{ cursor: "pointer", accentColor: C.gold }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button icon={<Save size={14} />} onClick={save} loading={saving}>Save Changes</Button>
      </div>
    </div>
  );
}

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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [email, setEmail]       = useState("");
  const [newName, setNewName]   = useState("");
  const [adding, setAdding]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState<string | null>(null); // email of expanded editor

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/users");
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!email.trim()) return;
    setAdding(true);
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: newName.trim() || null, role: "member" }),
    });
    const data = await r.json();
    if (r.ok) {
      toast("User added", "success");
      setEmail(""); setNewName(""); setShowAdd(false);
      setUsers(u => [...u, { ...data, permissions: [] }]);
    } else {
      toast(data.error ?? "Failed", "error");
    }
    setAdding(false);
  }

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
      if (editing === em) setEditing(null);
    } else {
      toast("Failed to remove", "error");
    }
    setDeleting(null);
  }

  const q = search.toLowerCase();
  const filtered = users.filter(u => u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Admin Users"
        sub={`${users.length} user${users.length !== 1 ? "s" : ""} · super admin has full access`}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Search placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <Button icon={<UserPlus size={14} />} onClick={() => setShowAdd(v => !v)}>Add User</Button>
          </div>
        }
      />

      {showAdd && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 16px",
        }}>
          <Avatar name="+" size={32} style={{ background: C.goldBg, color: C.gold, fontSize: 16 }} />
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Full name (optional)"
            type="text"
            style={{ flex: 1, padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, outline: "none", background: C.bg }}
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Email address"
            type="email"
            style={{ flex: 1, padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, outline: "none", background: C.bg }}
          />
          <Button onClick={add} loading={adding} icon={<UserPlus size={14} />}>Add</Button>
          <Button variant="ghost" onClick={() => { setShowAdd(false); setEmail(""); setNewName(""); }}>Cancel</Button>
        </div>
      )}

      <Table>
        <Thead>
          <Tr>
            <Th>User</Th>
            <Th>Role</Th>
            <Th>Added</Th>
            <Th style={{ width: 120 }} />
          </Tr>
        </Thead>
        <Tbody>
          {loading ? <SkeletonRows /> : filtered.length === 0 ? (
            <Tr><Td colSpan={4}><Empty icon={<Users size={40} />} title="No users found" sub={search ? "Try a different search" : "Add the first admin user above"} /></Td></Tr>
          ) : filtered.map(u => (
            <Fragment key={u.email}>
              <Tr style={{ cursor: "pointer" }} onClick={() => setEditing(editing === u.email ? null : u.email)}>
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
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: u.role === "super" ? C.goldBg : C.bg,
                    color: u.role === "super" ? C.gold : C.textSub,
                    border: `1px solid ${u.role === "super" ? C.goldBorder : C.border}`,
                  }}>
                    {u.role === "super" ? <ShieldCheck size={11} /> : <User size={11} />}
                    {u.role === "super" ? "Super" : "Member"}
                  </span>
                </Td>
                <Td style={{ color: C.textMuted }}>
                  {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Button
                      variant="ghost" size="sm"
                      icon={editing === u.email ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      onClick={e => { e.stopPropagation(); setEditing(editing === u.email ? null : u.email); }}
                    >
                      {editing === u.email ? "Close" : "Edit"}
                    </Button>
                    <Button
                      variant="danger" size="sm"
                      icon={<Trash2 size={13} />}
                      loading={deleting === u.email}
                      onClick={e => { e.stopPropagation(); remove(u.email); }}
                    >
                      Remove
                    </Button>
                  </div>
                </Td>
              </Tr>
              {editing === u.email && (
                <Tr>
                  <Td colSpan={4} style={{ padding: "0 16px 16px" }}>
                    <PermissionEditor
                      target={u}
                      onClose={() => setEditing(null)}
                      onSaved={updated => {
                        setUsers(prev => prev.map(x => x.email === updated.email ? updated : x));
                        setEditing(null);
                      }}
                    />
                  </Td>
                </Tr>
              )}
            </Fragment>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
