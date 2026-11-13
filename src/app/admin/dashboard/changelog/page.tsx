"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { C, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Avatar, Search } from "../ui";

type LogEntry = {
  id: number;
  email: string;
  action: string;
  resource: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
};

const ACTION_STYLE: Record<string, { bg: string; color: string }> = {
  login:     { bg: "#dcfce7", color: "#16a34a" },
  logout:    { bg: "#f1f5f9", color: "#64748b" },
  create:    { bg: "#dbeafe", color: "#2563eb" },
  update:    { bg: "#fef9c3", color: "#ca8a04" },
  delete:    { bg: "#fee2e2", color: "#dc2626" },
  grant:     { bg: "#ede9fe", color: "#7c3aed" },
  broadcast: { bg: "#ccfbf1", color: "#0d9488" },
};

function ActionBadge({ action }: { action: string }) {
  const s = ACTION_STYLE[action] ?? { bg: C.bg, color: C.textSub };
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
      textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {action}
    </span>
  );
}

function formatResource(resource: string): string {
  const [type, ...rest] = resource.split(":");
  const val = rest.join(":");
  const label: Record<string, string> = {
    auth: "Authentication", setting: "Setting", form: "Form",
    user: "User", permission: "Permission", rsvp: "RSVP",
    attraction: "Attraction", programme: "Programme",
    qr: "QR Code", template: "Template",
  };
  const name = label[type] ?? type;
  return val ? `${name}: ${val}` : name;
}

function formatDetail(detail: string | null, action: string): string {
  if (!detail) return "—";
  try {
    const d = JSON.parse(detail);
    if (action === "update" && d.from !== undefined && d.to !== undefined)
      return `"${d.from || "(empty)"}" → "${d.to || "(empty)"}"`;
    if (d.queued !== undefined) return `${d.queued} recipients (${d.group})`;
    if (d.permissions) return `${d.permissions.length} permission(s) set`;
    if (d.name && d.role) return `${d.name ?? ""} · ${d.role}`;
    if (d.name) return d.name;
    return JSON.stringify(d);
  } catch {
    return detail;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function SkeletonRows() {
  return (
    <>{Array.from({ length: 8 }).map((_, i) => (
      <Tr key={i}>
        <Td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Skeleton width={28} height={28} radius={99} /><Skeleton width={130} height={12} /></div></Td>
        <Td><Skeleton width={70} height={22} radius={20} /></Td>
        <Td><Skeleton width={140} height={12} /></Td>
        <Td><Skeleton width={180} height={12} /></Td>
        <Td><Skeleton width={80} height={12} /></Td>
        <Td><Skeleton width={60} height={12} /></Td>
      </Tr>
    ))}</>
  );
}

export default function ChangelogPage() {
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load(showSpinner = true) {
    if (showSpinner) setRefreshing(true);
    const r = await fetch("/api/admin/changelog?take=200");
    if (r.ok) setLogs(await r.json());
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(false); }, []);

  const q = search.toLowerCase();
  const filtered = logs.filter(l =>
    l.email.includes(q) || l.action.includes(q) || l.resource.includes(q) ||
    (l.detail ?? "").toLowerCase().includes(q)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Change Log"
        sub={`${logs.length} recent events · super admin sees all, members see own`}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Search placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <button
              onClick={() => load()}
              disabled={refreshing}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, fontSize: 13, color: C.textSub, cursor: "pointer",
              }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
        }
      />

      <Table>
        <Thead>
          <Tr>
            <Th>User</Th>
            <Th>Action</Th>
            <Th>Resource</Th>
            <Th>Detail</Th>
            <Th>IP</Th>
            <Th>When</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? <SkeletonRows /> : filtered.length === 0 ? (
            <Tr><Td colSpan={6}><Empty icon={<History size={40} />} title="No events found" sub={search ? "Try a different search" : "Events will appear here as admins take actions"} /></Td></Tr>
          ) : filtered.map(l => (
            <Tr key={l.id}>
              <Td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={l.email} size={28} />
                  <span style={{ fontSize: 12, color: C.textSub }}>{l.email.split("@")[0]}</span>
                </div>
              </Td>
              <Td><ActionBadge action={l.action} /></Td>
              <Td style={{ fontSize: 12, color: C.text, maxWidth: 180 }}>
                <span title={l.resource}>{formatResource(l.resource)}</span>
              </Td>
              <Td style={{ fontSize: 12, color: C.textMuted, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span title={l.detail ?? ""}>{formatDetail(l.detail, l.action)}</span>
              </Td>
              <Td style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{l.ip ?? "—"}</Td>
              <Td style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }} title={new Date(l.createdAt).toLocaleString("en-IN")}>
                {relativeTime(l.createdAt)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
