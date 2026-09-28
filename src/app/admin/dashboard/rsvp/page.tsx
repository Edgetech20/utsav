"use client";

import { useEffect, useState } from "react";
import { Trash2, RefreshCw, CheckCircle, Clock } from "lucide-react";

type Entry = { name: string; whatsapp: string; address: string; submittedAt: string };

export default function RsvpPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    const rsvpRes = await fetch("/api/rsvp").then(r => r.json()).catch(() => ({}));
    setEntries(rsvpRes?.entries ?? []);
    setSent(rsvpRes?.sent ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(key: string) {
    if (!confirm("Delete this registration?")) return;
    setActing(key);
    await fetch("/api/rsvp", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    await load();
    setActing(null);
  }

  async function handleResend(key: string) {
    setActing(key);
    await fetch("/api/rsvp/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    await load();
    setActing(null);
  }

  const filtered = [...entries]
    .reverse()
    .filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.whatsapp.includes(search) ||
      e.address.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>RSVP Registrations</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>{entries.length} total · {sent.length} messaged</p>
        </div>
        <span style={{ background: "#0F172A", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>
          {entries.length} registered
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, phone or address…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "10px 16px", borderRadius: 10,
          border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A",
          background: "#fff", outline: "none", boxSizing: "border-box",
        }}
      />

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8ECF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        {/* Header row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 130px 1fr 80px 100px",
          padding: "10px 20px", borderBottom: "1px solid #E8ECF0",
          fontSize: 11, fontWeight: 600, color: "#94A3B8",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <span>Name</span><span>WhatsApp</span><span>Address</span><span>Status</span><span>Actions</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#CBD5E1", fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#94A3B8" }}>{search ? "No results found" : "No registrations yet"}</p>
          </div>
        ) : filtered.map((e, i) => {
          const key = `${e.whatsapp}|${e.submittedAt}`;
          const isSent = sent.includes(key);
          const isActing = acting === key;
          return (
            <div key={key} style={{
              display: "grid", gridTemplateColumns: "1fr 130px 1fr 80px 100px",
              padding: "13px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none",
              alignItems: "center", opacity: isActing ? 0.5 : 1, transition: "opacity 0.2s",
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{e.name}</p>
                <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                  {new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <p style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>{e.whatsapp}</p>
              <p style={{ fontSize: 12, color: "#64748B" }}>{e.address}</p>
              <div>
                {isSent ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#10B981", background: "#ECFDF5", padding: "3px 8px", borderRadius: 6 }}>
                    <CheckCircle size={11} /> Sent
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#F59E0B", background: "#FFFBEB", padding: "3px 8px", borderRadius: 6 }}>
                    <Clock size={11} /> Pending
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => handleResend(key)}
                  disabled={isActing}
                  title="Resend message"
                  style={{ padding: "6px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", color: "#6366F1" }}
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => handleDelete(key)}
                  disabled={isActing}
                  title="Delete"
                  style={{ padding: "6px", borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", display: "flex", alignItems: "center", color: "#EF4444" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
