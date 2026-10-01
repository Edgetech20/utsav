"use client";

import { useEffect, useState } from "react";
import { MessageSquare, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

type Entry = { id: number; name: string; mobile: string; responses: string; submittedAt: string };

function ResponseDetail({ responses }: { responses: string }) {
  const data: Record<string, string> = JSON.parse(responses);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Object.entries(data).map(([q, a]) =>
        a?.trim() ? (
          <div key={q} style={{ borderLeft: "3px solid #E8ECF0", paddingLeft: 12 }}>
            <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>{q}</p>
            <p style={{ fontSize: 13, color: "#0F172A" }}>{a}</p>
          </div>
        ) : null
      )}
    </div>
  );
}

export default function FeedbackPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/feedback")
      .then(r => r.json())
      .then(d => { setEntries(d.entries ?? []); setLoading(false); });
  }, []);

  async function del(id: number) {
    if (!confirm("Delete this response?")) return;
    await fetch("/api/feedback", { method: "DELETE", body: JSON.stringify({ id }), headers: { "Content-Type": "application/json" } });
    setEntries(e => e.filter(x => x.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Feedback Responses</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>প্রথম বর্ষ · {entries.length} response{entries.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ background: "#EEF2FF", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <MessageSquare size={14} color="#6366F1" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#6366F1" }}>{entries.length}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, height: 72, border: "1px solid #E8ECF0" }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
          <MessageSquare size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>No feedback responses yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Responses will appear here once submitted via Google Form</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map(e => (
            <div key={e.id} style={{
              background: "#fff", borderRadius: 12, border: "1px solid #E8ECF0",
              overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              {/* Row */}
              <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "#F1F5F9", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#475569",
                }}>
                  {e.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0 }}>{e.name}</p>
                  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                    {e.mobile} · {new Date(e.submittedAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <button onClick={() => del(e.id)} style={{
                  background: "none", border: "none", cursor: "pointer", padding: 6,
                  color: "#94A3B8", borderRadius: 6,
                }} title="Delete">
                  <Trash2 size={14} />
                </button>
                <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} style={{
                  background: "#F1F5F9", border: "none", cursor: "pointer",
                  borderRadius: 6, padding: "6px 12px", display: "flex",
                  alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#475569",
                }}>
                  {expanded === e.id ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> View</>}
                </button>
              </div>

              {/* Expanded answers */}
              {expanded === e.id && (
                <div style={{ padding: "0 18px 18px", borderTop: "1px solid #F1F5F9" }}>
                  <div style={{ paddingTop: 16 }}>
                    <ResponseDetail responses={e.responses} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
