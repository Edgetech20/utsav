"use client";

import { useEffect, useState } from "react";
import { Trash2, RefreshCw, CheckCircle, Clock, Users } from "lucide-react";
import { C, Badge, Button, Search, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Avatar, Pagination, Card, useDesktop } from "../ui";
import { useToast } from "../toast";

type Entry = { id: number; name: string; whatsapp: string; address: string; submittedAt: string; waSent: boolean };

function SkeletonRows() {
  return (
    <>{Array.from({ length: 5 }).map((_, i) => (
      <Tr key={i}>
        <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Skeleton width={32} height={32} radius={99} /><Skeleton width={120} height={13} /></div></Td>
        <Td><Skeleton width={110} height={13} /></Td>
        <Td><Skeleton width={160} height={13} /></Td>
        <Td><Skeleton width={60} height={22} radius={20} /></Td>
        <Td><Skeleton width={80} height={13} /></Td>
        <Td><Skeleton width={90} height={28} radius={7} /></Td>
      </Tr>
    ))}</>
  );
}

export default function RsvpPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [acting, setActing]     = useState<number | null>(null);
  const [toConfirm, setToConfirm] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;
  const desktop = useDesktop();

  async function load() {
    const res = await fetch("/api/rsvp").then(r => r.json()).catch(() => ({}));
    setEntries(res?.entries ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    setActing(id); setToConfirm(null);
    await fetch("/api/rsvp", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast("Registration deleted", "success");
    await load();
    setActing(null);
  }

  async function handleResend(id: number) {
    setActing(id);
    await fetch("/api/rsvp/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast("WhatsApp message queued", "info");
    await load();
    setActing(null);
  }

  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.whatsapp.includes(search) ||
    e.address.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const sent    = entries.filter(e => e.waSent).length;
  const pending = entries.length - sent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="RSVP Registrations"
        sub={`${entries.length} total · ${sent} messaged · ${pending} pending`}
        actions={<Search placeholder="Search name, phone, address…" value={search} onChange={e => setSearch(e.target.value)} />}
      />

      {/* Summary pills */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Badge variant="gray" dot>{entries.length} Total</Badge>
        <Badge variant="green" dot>{sent} Messaged</Badge>
        <Badge variant="orange" dot>{pending} Pending</Badge>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      {desktop ? (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th><Th>Phone</Th><Th>Address</Th><Th>Status</Th><Th>Registered</Th>
              <Th style={{ textAlign: "right" }}>Actions</Th>
            </Tr>
          </Thead>
          <tbody>
            {loading ? <SkeletonRows /> : filtered.length === 0 ? (
              <Tr><Td style={{ padding: 0, border: "none" }} colSpan={6}>
                <Empty icon={<Users size={40} />} title={search ? "No results" : "No registrations yet"} sub={search ? "Try a different search term" : "Registrations will appear here"} />
              </Td></Tr>
            ) : paginated.map(e => {
              const busy = acting === e.id; const confirm = toConfirm === e.id;
              return (
                <Tr key={e.id} style={{ opacity: busy ? 0.5 : 1 }}>
                  <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={e.name} size={32} /><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{e.name}</span></div></Td>
                  <Td><span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSub }}>{e.whatsapp}</span></Td>
                  <Td style={{ maxWidth: 220 }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.textSub, fontSize: 12 }}>{e.address}</span></Td>
                  <Td>{e.waSent ? <Badge variant="green" icon={<CheckCircle size={10} />}>Sent</Badge> : <Badge variant="orange" icon={<Clock size={10} />}>Pending</Badge>}</Td>
                  <Td style={{ color: C.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Td>
                  <Td><div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {confirm ? (<><Button variant="danger" size="sm" loading={busy} onClick={() => handleDelete(e.id)}>Confirm</Button><Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button></>) : (<><Button variant="ghost" size="sm" icon={<RefreshCw size={11} />} loading={busy} onClick={() => handleResend(e.id)}>Resend</Button><Button variant="ghost" size="sm" icon={<Trash2 size={11} />} onClick={() => setToConfirm(e.id)} style={{ color: C.red }}>Delete</Button></>)}
                  </div></Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? Array.from({ length: 4 }).map((_, i) => <Card key={i} padding={16}><Skeleton height={80} /></Card>) :
           filtered.length === 0 ? <Empty icon={<Users size={40} />} title={search ? "No results" : "No registrations yet"} /> :
           paginated.map(e => {
            const busy = acting === e.id; const confirm = toConfirm === e.id;
            return (
              <Card key={e.id} padding={14} style={{ opacity: busy ? 0.5 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Avatar name={e.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{e.name}</p>
                    <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>{e.whatsapp}</p>
                  </div>
                  {e.waSent ? <Badge variant="green" icon={<CheckCircle size={10} />}>Sent</Badge> : <Badge variant="orange" icon={<Clock size={10} />}>Pending</Badge>}
                </div>
                <p style={{ fontSize: 12, color: C.textSub, margin: "0 0 10px", lineHeight: 1.5 }}>{e.address}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {confirm ? (<><Button variant="danger" size="sm" loading={busy} onClick={() => handleDelete(e.id)}>Confirm</Button><Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button></>) : (<><Button variant="ghost" size="sm" icon={<RefreshCw size={11} />} loading={busy} onClick={() => handleResend(e.id)}>Resend</Button><Button variant="ghost" size="sm" icon={<Trash2 size={11} />} onClick={() => setToConfirm(e.id)} style={{ color: C.red }}>Delete</Button></>)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={p => setPage(p)} />
    </div>
  );
}
