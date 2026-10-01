"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

type Entry    = { name: string; whatsapp: string; address: string; submittedAt: string };
type LogEntry = { name: string; whatsapp: string; status: "sent" | "failed"; sentAt: string; error?: string };
type Row      = { name: string; whatsapp: string; submittedAt: string; status: "sent" | "failed" | "pending"; sentAt?: string; error?: string };

const STATUS = {
  sent:    { icon: CheckCircle, color: "#10B981", bg: "#ECFDF5", label: "Sent" },
  failed:  { icon: XCircle,     color: "#EF4444", bg: "#FEF2F2", label: "Failed" },
  pending: { icon: Clock,       color: "#F59E0B", bg: "#FFFBEB", label: "Pending" },
} as const;

export default function LogsPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [rsvpRes, logs]: [{ entries: Entry[]; sent: string[] }, LogEntry[]] = await Promise.all([
      fetch("/api/rsvp").then(r => r.json()),
      fetch("/api/wa-log").then(r => r.json()),
    ]);
    const entries = rsvpRes?.entries ?? [];
    const sent    = rsvpRes?.sent ?? [];
    const logMap  = new Map<string, LogEntry>();
    for (const l of logs) logMap.set(l.whatsapp, l);

    setRows([...entries].reverse().map(e => {
      const isSent = sent.includes(`${e.whatsapp}|${e.submittedAt}`);
      const log    = logMap.get(e.whatsapp);
      return {
        name: e.name, whatsapp: e.whatsapp, submittedAt: e.submittedAt,
        status: isSent ? "sent" : log?.status === "failed" ? "failed" : "pending",
        sentAt: log?.sentAt, error: log?.error,
      };
    }));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const counts = {
    sent:    rows.filter(r => r.status === "sent").length,
    failed:  rows.filter(r => r.status === "failed").length,
    pending: rows.filter(r => r.status === "pending").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Message Log</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>WhatsApp delivery status for all registrants</p>
        </div>
        <button onClick={load} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0",
          background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#475569", flexShrink: 0,
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {(["sent", "pending", "failed"] as const).map(s => {
          const { icon: Icon, color, bg, label } = STATUS[s];
          return (
            <div key={s} style={{ background: bg, borderRadius: 10, padding: "9px 16px", display: "flex", gap: 6, alignItems: "center" }}>
              <Icon size={15} color={color} />
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{counts[s]} {label}</span>
            </div>
          );
        })}
        <div style={{ background: "#F1F5F9", borderRadius: 10, padding: "9px 16px", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>{rows.length} Total</span>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, height: 68, border: "1px solid #E8ECF0" }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: "56px 0", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#94A3B8", fontWeight: 500 }}>No registrations yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r, i) => {
            const { icon: Icon, color, bg, label } = STATUS[r.status];
            return (
              <div key={i} style={{
                background: "#fff", borderRadius: 12, border: "1px solid #E8ECF0",
                padding: "13px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Status icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: bg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} color={color} />
                  </div>

                  {/* Name + phone */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name}
                    </p>
                    {r.error ? (
                      <p style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>{r.error}</p>
                    ) : (
                      <p style={{ fontSize: 12, color: "#64748B", fontFamily: "monospace", marginTop: 2 }}>{r.whatsapp}</p>
                    )}
                  </div>

                  {/* Badge + time */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: bg, color,
                    }}>
                      {label}
                    </span>
                    <p style={{ fontSize: 11, color: "#CBD5E1", textAlign: "right" }}>
                      {r.sentAt
                        ? new Date(r.sentAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
