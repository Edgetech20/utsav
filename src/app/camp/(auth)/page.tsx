"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Monitor, RefreshCw, Users, Clock, Stethoscope, CheckCircle2, UserPlus, BarChart2 } from "lucide-react";
import { useCampUser } from "./CampNav";

const C = {
  bg: "#F5F7FA", surface: "#ffffff", border: "#E8ECF0",
  text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  gold: "#C9A96E", goldBg: "rgba(201,169,110,0.10)", goldBorder: "rgba(201,169,110,0.30)",
  orange: "#F59E0B", orangeBg: "#FFFBEB", orangeBorder: "rgba(245,158,11,0.25)",
  blue: "#6366F1", blueBg: "#EEF2FF", blueBorder: "rgba(99,102,241,0.25)",
  green: "#10B981", greenBg: "#ECFDF5", greenBorder: "rgba(16,185,129,0.25)",
  primary: "#0F172A",
} as const;

type DeptStat = {
  id: number; code: string; name: string;
  waiting: number; called: number; doctorDone: number; completed: number; total: number;
};
type Stats = {
  total: number; waiting: number; called: number; doctorDone: number; completed: number;
  departments: DeptStat[];
};

function StatCard({ label, value, icon, color, bg, border }: {
  label: string; value: number;
  icon: React.ReactNode; color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</p>
        <p style={{ fontSize: 12, color: C.textSub, margin: "4px 0 0", fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.3s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: "tabular-nums", minWidth: 28, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

export default function CampDashboard() {
  const user = useCampUser();
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const hasEdit = user.role === "super" || user.permissions.some(p => p.resource === "camp" && p.action === "edit");

  const load = useCallback(async () => {
    const r = await fetch("/api/camp/stats");
    if (r.ok) {
      setStats(await r.json());
      setUpdatedAt(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const s = stats;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Camp Overview</h1>
          {updatedAt && (
            <p style={{ fontSize: 11, color: C.textMuted, margin: "3px 0 0" }}>
              Updated {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </p>
          )}
        </div>
        <button
          onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: C.textSub, cursor: "pointer" }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total Patients"  value={s?.total     ?? 0} icon={<Users       size={20} color={C.gold}   strokeWidth={1.8} />} color={C.gold}   bg={C.goldBg}   border={C.goldBorder}   />
        <StatCard label="Waiting"         value={s?.waiting   ?? 0} icon={<Clock       size={20} color={C.orange} strokeWidth={1.8} />} color={C.orange} bg={C.orangeBg} border={C.orangeBorder} />
        <StatCard label="Being Seen"      value={s?.called    ?? 0} icon={<Stethoscope size={20} color={C.blue}   strokeWidth={1.8} />} color={C.blue}   bg={C.blueBg}   border={C.blueBorder}   />
        <StatCard label="Completed"       value={s?.completed ?? 0} icon={<CheckCircle2 size={20} color={C.green} strokeWidth={1.8} />} color={C.green}  bg={C.greenBg}  border={C.greenBorder}  />
      </div>

      {/* Department breakdown */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Department Breakdown</p>
          <span style={{ fontSize: 11, color: C.textMuted }}>{s?.departments.length ?? 0} active</span>
        </div>

        {!s || s.departments.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: C.textMuted, margin: 0 }}>
            No active departments. Add departments in Manage → Departments.
          </p>
        ) : (
          <div>
            {s.departments.map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr 160px 80px",
                  alignItems: "center", gap: 16,
                  padding: "14px 20px",
                  borderBottom: i < s.departments.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                {/* Code */}
                <span style={{ fontSize: 14, fontWeight: 800, color: C.gold, letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>
                  {d.code}
                </span>

                {/* Name + progress */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 6px" }}>{d.name}</p>
                  <ProgressBar value={d.completed} max={d.total} color={C.green} />
                </div>

                {/* Badges */}
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  {d.waiting > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, background: C.orangeBg, border: `1px solid ${C.orangeBorder}`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      {d.waiting} waiting
                    </span>
                  )}
                  {d.called > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueBg, border: `1px solid ${C.blueBorder}`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      {d.called} seeing
                    </span>
                  )}
                  {d.doctorDone > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#8B5CF6", background: "#F5F3FF", border: "1px solid rgba(139,92,246,0.3)", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      {d.doctorDone} pharmacy
                    </span>
                  )}
                  {d.completed > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenBg, border: `1px solid ${C.greenBorder}`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      {d.completed} done
                    </span>
                  )}
                  {d.total === 0 && (
                    <span style={{ fontSize: 11, color: C.textMuted }}>No patients yet</span>
                  )}
                </div>

                {/* Total */}
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {d.total} <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>total</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom row: quick actions + TV link */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>

        {/* Quick actions */}
        {hasEdit && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/camp/register" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: C.primary, borderRadius: 9, cursor: "pointer" }}>
                <UserPlus size={14} color="#fff" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Add Patient</span>
              </div>
            </Link>
            <Link href="/camp/doctor" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, cursor: "pointer" }}>
                <Stethoscope size={14} color={C.textSub} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>Doctor View</span>
              </div>
            </Link>
            <Link href="/camp/reports" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, cursor: "pointer" }}>
                <BarChart2 size={14} color={C.textSub} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>Reports</span>
              </div>
            </Link>
          </div>
        )}

        {/* TV display */}
        <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
          <Monitor size={16} color={C.gold} />
          <div style={{ marginRight: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0 }}>Live Display</p>
            <p style={{ fontSize: 11, color: C.textSub, margin: 0 }}>TV / LED screen</p>
          </div>
          <Link href="/camp/display" target="_blank" style={{ fontSize: 12, fontWeight: 700, color: C.gold, textDecoration: "none", padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.goldBorder}`, background: C.surface }}>
            Open →
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
