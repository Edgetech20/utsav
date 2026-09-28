"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

type Entry   = { name: string; whatsapp: string; address: string; submittedAt: string };
type LogEntry = { name: string; whatsapp: string; status: "sent" | "failed"; sentAt: string; error?: string };
type Row = { name: string; whatsapp: string; submittedAt: string; status: "sent" | "failed" | "pending"; sentAt?: string; error?: string };

export default function LogsPage() {
  const [rows, setRows]     = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [rsvpRes, logs]: [{ entries: Entry[]; sent: string[] }, LogEntry[]] = await Promise.all([
      fetch("/api/rsvp").then(r => r.json()),
      fetch("/api/wa-log").then(r => r.json()),
    ]);

    const entries = rsvpRes?.entries ?? [];
    const sent    = rsvpRes?.sent ?? [];

    // Build a lookup from whatsapp → log entry
    const logMap = new Map<string, LogEntry>();
    for (const l of logs) logMap.set(l.whatsapp, l);

    const combined: Row[] = [...entries].reverse().map(e => {
      const key = `${e.whatsapp}|${e.submittedAt}`;
      const isSent = sent.includes(key);
      const log = logMap.get(e.whatsapp);
      return {
        name: e.name,
        whatsapp: e.whatsapp,
        submittedAt: e.submittedAt,
        status: isSent ? "sent" : log?.status === "failed" ? "failed" : "pending",
        sentAt: log?.sentAt,
        error: log?.error,
      };
    });

    setRows(combined);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const counts = { sent: rows.filter(r => r.status === "sent").length, failed: rows.filter(r => r.status === "failed").length, pending: rows.filter(r => r.status === "pending").length };

  const statusConfig = {
    sent:    { icon: CheckCircle, color: "#10B981", bg: "#ECFDF5", label: "Sent" },
    failed:  { icon: XCircle,     color: "#EF4444", bg: "#FEF2F2", label: "Failed" },
    pending: { icon: Clock,       color: "#F59E0B", bg: "#FFFBEB", label: "Pending" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Message Log</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>WhatsApp delivery status for all registrants</p>
        </div>
        <button onClick={load} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0",
          background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#475569",
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {(["sent", "pending", "failed"] as const).map(s => {
          const { icon: Icon, color, bg, label } = statusConfig[s];
          return (
            <div key={s} style={{ background: bg, borderRadius: 10, padding: "10px 18px", display: "flex", gap: 8, alignItems: "center" }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{counts[s]} {label}</span>
            </div>
          );
        })}
        <div style={{ background: "#F1F5F9", borderRadius: 10, padding: "10px 18px", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>{rows.length} Total</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8ECF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 140px 90px 180px",
          padding: "10px 20px", borderBottom: "1px solid #E8ECF0",
          fontSize: 11, fontWeight: 600, color: "#94A3B8",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <span>Name</span><span>WhatsApp</span><span>Status</span><span>Time</span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#CBD5E1", fontSize: 13 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#94A3B8", fontWeight: 500 }}>No registrations yet</p>
          </div>
        ) : rows.map((r, i) => {
          const { icon: Icon, color, bg, label } = statusConfig[r.status];
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 140px 90px 180px",
              padding: "13px 20px",
              borderBottom: i < rows.length - 1 ? "1px solid #F1F5F9" : "none",
              alignItems: "center",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon size={15} color={color} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{r.name}</p>
                  {r.error && <p style={{ fontSize: 11, color: "#EF4444", marginTop: 1 }}>{r.error}</p>}
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>{r.whatsapp}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg, color }}>
                {label}
              </span>
              <p style={{ fontSize: 12, color: "#64748B" }}>
                {r.sentAt
                  ? new Date(r.sentAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                  : <span style={{ color: "#CBD5E1" }}>Registered {new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                }
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
