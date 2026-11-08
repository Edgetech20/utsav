"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { C, Button, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Avatar, Search } from "../ui";
import { useToast } from "../toast";

type AdminUser = { email: string; createdAt: string };

function SkeletonRows() {
  return (
    <>{Array.from({ length: 4 }).map((_, i) => (
      <Tr key={i}>
        <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Skeleton width={32} height={32} radius={99} /><Skeleton width={160} height={13} /></div></Td>
        <Td><Skeleton width={110} height={13} /></Td>
        <Td><Skeleton width={60} height={28} radius={7} /></Td>
      </Tr>
    ))}</>
  );
}

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [email, setEmail]     = useState("");
  const [adding, setAdding]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/users");
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!email.trim()) return;
    setAdding(true);
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await r.json();
    if (r.ok) {
      toast("User added", "success");
      setEmail("");
      setShowAdd(false);
      setUsers(u => [...u, data]);
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
    } else {
      toast("Failed to remove", "error");
    }
    setDeleting(null);
  }

  const q = search.toLowerCase();
  const filtered = users.filter(u => u.email.toLowerCase().includes(q));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Admin Users"
        sub={`${users.length} user${users.length !== 1 ? "s" : ""} · only listed emails can log in`}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Search placeholder="Search email…" value={search} onChange={e => setSearch(e.target.value)} />
            <Button icon={<UserPlus size={14} />} onClick={() => setShowAdd(v => !v)}>Add User</Button>
          </div>
        }
      />

      {/* Inline add row */}
      {showAdd && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <Avatar name="+" size={32} style={{ background: C.goldBg, color: C.gold, fontSize: 16 }} />
          <input
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Email address"
            type="email"
            style={{
              flex: 1, padding: "8px 11px",
              border: `1px solid ${C.border}`, borderRadius: 7,
              fontSize: 13, color: C.text, outline: "none",
              background: C.bg,
            }}
          />
          <Button onClick={add} loading={adding} icon={<UserPlus size={14} />}>Add</Button>
          <Button variant="ghost" onClick={() => { setShowAdd(false); setEmail(""); }}>Cancel</Button>
        </div>
      )}

      <Table>
        <Thead>
          <Tr>
            <Th>Email</Th>
            <Th>Added</Th>
            <Th style={{ width: 60 }} />
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <Tr>
              <Td colSpan={3}>
                <Empty icon={<Users size={40} />} title="No users found" sub={search ? "Try a different search" : "Add the first admin user above"} />
              </Td>
            </Tr>
          ) : (
            filtered.map(u => (
              <Tr key={u.email}>
                <Td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={u.email} size={32} />
                    <span style={{ fontWeight: 500, color: C.text }}>{u.email}</span>
                  </div>
                </Td>
                <Td style={{ color: C.textMuted }}>
                  {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </Td>
                <Td>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    loading={deleting === u.email}
                    onClick={() => remove(u.email)}
                  >
                    Remove
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </div>
  );
}
