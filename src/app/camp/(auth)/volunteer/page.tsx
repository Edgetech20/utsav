"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, RefreshCw } from "lucide-react";

const C = {
  surface: "#ffffff", border: "#E8ECF0", bg: "#F5F7FA",
  text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  green: "#10B981", greenBg: "#ECFDF5",
  orange: "#F59E0B", orangeBg: "#FFFBEB",
  blue: "#6366F1", blueBg: "#EEF2FF",
  gold: "#C9A96E", goldBg: "rgba(201,169,110,0.10)",
} as const;

type DeptStat = {
  id: number; code: string; name: string;
  waiting: number; called: number; completed: number; total: number;
};
type Stats = {
  total: number; waiting: number; called: number; completed: number;
  departments: DeptStat[];
};

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
      <p style={{ fontSize: 28, fontWeight: 800, color, margin: "0 0 4px", fontVariantNumeric: "tabular-nums" }}>{value}</p>
      <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>{label}</p>
    </div>
  );
}

export default function VolunteerPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/camp/stats");
    if (r.ok) setStats(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.orangeBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={18} color={C.orange} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Volunteer Dashboard</h1>
          <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>Live queue overview — refreshes every 15s</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Refresh"
          style={{ border: `1px solid ${C.border}`, background: C.surface, borderRadius: 8, padding: 7, cursor: "pointer", display: "flex", color: C.textSub }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Summary cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Registered" value={stats.total}     color={C.text}   bg={C.surface} />
          <StatCard label="Completed"         value={stats.completed} color={C.green}  bg={C.greenBg} />
          <StatCard label="Being Seen"        value={stats.called}    color={C.blue}   bg={C.blueBg}  />
          <StatCard label="Waiting"           value={stats.waiting}   color={C.orange} bg={C.orangeBg}/>
        </div>
      )}

      {/* Per-department table */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Department-wise Queue
          </p>
        </div>

        {!stats || stats.departments.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: C.textMuted, margin: 0 }}>No departments set up yet.</p>
        ) : (
          stats.departments.map((d, i) => {
            const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
            return (
              <div
                key={d.id}
                style={{
                  padding: "16px 20px",
                  borderBottom: i < stats.departments.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: C.gold,
                      background: C.goldBg, padding: "2px 8px", borderRadius: 6,
                      letterSpacing: "0.06em",
                    }}>
                      {d.code}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span style={{ fontSize: 12, color: C.orange, fontWeight: 600 }}>{d.waiting} waiting</span>
                    <span style={{ fontSize: 12, color: C.blue,   fontWeight: 600 }}>{d.called} seeing</span>
                    <span style={{ fontSize: 12, color: C.green,  fontWeight: 600 }}>{d.completed} done</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 6, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: C.green, borderRadius: 99, transition: "width 0.4s ease" }} />
                </div>
                <p style={{ fontSize: 11, color: C.textMuted, margin: "4px 0 0", textAlign: "right" as const }}>{pct}% complete</p>
              </div>
            );
          })
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
