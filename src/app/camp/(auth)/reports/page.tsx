"use client";

import { useEffect, useState } from "react";
import { BarChart2, Download } from "lucide-react";

const C = {
  surface: "#ffffff", border: "#E8ECF0", bg: "#F5F7FA",
  text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  green: "#10B981", greenBg: "#ECFDF5",
  orange: "#F59E0B", orangeBg: "#FFFBEB",
  blue: "#6366F1", blueBg: "#EEF2FF",
  purple: "#8B5CF6", purpleBg: "#F5F3FF",
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

export default function ReportsPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/camp/stats")
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  function downloadCsv() {
    if (!stats) return;
    const rows = [
      ["Department", "Code", "Total", "Waiting", "Being Seen", "Completed"],
      ...stats.departments.map(d => [d.name, d.code, d.total, d.waiting, d.called, d.completed]),
      ["TOTAL", "", stats.total, stats.waiting, stats.called, stats.completed],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `camp-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const summaryCards = stats ? [
    { label: "Total Registered", value: stats.total,     color: C.purple, bg: C.purpleBg },
    { label: "Completed",        value: stats.completed, color: C.green,  bg: C.greenBg  },
    { label: "Waiting",          value: stats.waiting,   color: C.orange, bg: C.orangeBg },
    { label: "Being Seen",       value: stats.called,    color: C.blue,   bg: C.blueBg   },
  ] : [];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={18} color={C.purple} strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Reports</h1>
            <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>Department-wise patient statistics</p>
          </div>
        </div>
        {stats && (
          <button
            onClick={downloadCsv}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 9, border: `1px solid ${C.border}`,
              background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSub, cursor: "pointer",
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {loading && <p style={{ fontSize: 13, color: C.textMuted }}>Loading…</p>}

      {stats && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
            {summaryCards.map(c => (
              <div key={c.label} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: c.color, margin: "0 0 4px", fontVariantNumeric: "tabular-nums" }}>{c.value}</p>
                <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>{c.label}</p>
              </div>
            ))}
          </div>

          {/* Department table */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px",
              padding: "10px 20px", borderBottom: `1px solid ${C.border}`,
              gap: 8,
            }}>
              {["Department", "Total", "Waiting", "Seeing", "Done"].map(h => (
                <p key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.07em", margin: 0, textAlign: h === "Department" ? "left" : "right" as const }}>{h}</p>
              ))}
            </div>

            {stats.departments.map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px",
                  padding: "14px 20px", gap: 8, alignItems: "center",
                  borderBottom: i < stats.departments.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: C.goldBg, padding: "2px 7px", borderRadius: 5 }}>{d.code}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{d.name}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text,   margin: 0, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{d.total}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.orange, margin: 0, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{d.waiting}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.blue,   margin: 0, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{d.called}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.green,  margin: 0, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{d.completed}</p>
              </div>
            ))}

            {/* Totals row */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px",
              padding: "14px 20px", gap: 8, alignItems: "center",
              borderTop: `2px solid ${C.border}`, background: C.bg,
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Total</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.text,   margin: 0, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{stats.total}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.orange, margin: 0, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{stats.waiting}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.blue,   margin: 0, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{stats.called}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.green,  margin: 0, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{stats.completed}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
