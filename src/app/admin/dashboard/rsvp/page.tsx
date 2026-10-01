"use client";

import { useEffect, useState } from "react";
import { Trash2, RefreshCw, CheckCircle, Clock } from "lucide-react";

type Entry = { id: number; name: string; whatsapp: string; address: string; submittedAt: string; waSent: boolean };

export default function RsvpPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/rsvp").then(r => r.json()).catch(() => ({}));
    setEntries(res?.entries ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this registration?")) return;
    setActing(id);
    await fetch("/api/rsvp", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setActing(null);
  }

  async function handleResend(id: number) {
    setActing(id);
    await fetch("/api/rsvp/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setActing(null);
  }

  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.whatsapp.includes(search) ||
    e.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>RSVP Registrations</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>
            {entries.length} total · {entries.filter(e => e.waSent).length} messaged
          </p>
        </div>
        <span style={{ background: "#0F172A", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
          {entries.length} registered
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search name, phone or address…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 10,
          border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A",
          background: "#fff", outline: "none", boxSizing: "border-box",
        }}
      />

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, height: 80, border: "1px solid #E8ECF0" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#94A3B8" }}>{search ? "No results found" : "No registrations yet"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(e => {
            const isActing = acting === e.id;
            return (
              <div key={e.id} style={{
                background: "#fff", borderRadius: 14, border: "1px solid #E8ECF0",
                padding: "14px 16px",
                opacity: isActing ? 0.5 : 1, transition: "opacity 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                {/* Top row: avatar + name + date + actions */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: "#F1F5F9", display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#475569",
                  }}>
                    {e.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.name}
                      </p>
                      {/* Status badge */}
                      {e.waSent ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#10B981", background: "#ECFDF5", padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>
                          <CheckCircle size={11} /> Sent
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#F59E0B", background: "#FFFBEB", padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </div>

                    {/* Phone */}
                    <p style={{ fontSize: 12, color: "#475569", fontFamily: "monospace", marginTop: 3 }}>{e.whatsapp}</p>

                    {/* Address */}
                    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.address}
                    </p>
                  </div>
                </div>

                {/* Bottom row: date + actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                  <p style={{ fontSize: 11, color: "#CBD5E1" }}>
                    {new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleResend(e.id)}
                      disabled={isActing}
                      title="Resend WhatsApp"
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "6px 12px", borderRadius: 7, border: "1px solid #E2E8F0",
                        background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#6366F1",
                      }}
                    >
                      <RefreshCw size={12} /> Resend
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={isActing}
                      title="Delete"
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "6px 12px", borderRadius: 7, border: "1px solid #FEE2E2",
                        background: "#FFF5F5", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#EF4444",
                      }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
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
