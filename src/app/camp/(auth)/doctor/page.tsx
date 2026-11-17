"use client";

import { useEffect, useState, useCallback } from "react";
import { Stethoscope, ChevronRight, CheckCheck, RefreshCw } from "lucide-react";
import { useCampUser } from "../CampNav";

const C = {
  surface: "#ffffff", border: "#E8ECF0", bg: "#F5F7FA",
  text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  green: "#10B981", greenBg: "#ECFDF5",
  blue: "#6366F1", blueBg: "#EEF2FF",
  orange: "#F59E0B", orangeBg: "#FFFBEB",
  gold: "#C9A96E", goldBg: "rgba(201,169,110,0.10)", goldBorder: "rgba(201,169,110,0.30)",
  red: "#EF4444", redBg: "#FFF5F5",
  primary: "#0F172A",
} as const;

type Dept    = { id: number; code: string; name: string; isActive: boolean };
type Doctor  = { id: number; name: string; email: string | null; departmentId: number; department: Dept };
type Patient = {
  id: number; token: string; name: string; age: number; gender: string;
  mobile: string; problem: string | null; status: string; registeredAt: string;
  department: { id: number; code: string; name: string };
};

export default function DoctorPage() {
  const user      = useCampUser();
  const [depts,    setDepts]    = useState<Dept[]>([]);
  const [myDoctor, setMyDoctor] = useState<Doctor | null | undefined>(undefined); // undefined = loading
  const [selDept,  setSelDept]  = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [acting,   setActing]   = useState(false);
  const [error,    setError]    = useState("");

  // Load departments + doctors, resolve auto-filter
  useEffect(() => {
    Promise.all([
      fetch("/api/camp/departments").then(r => r.json()),
      fetch("/api/camp/doctors").then(r => r.json()),
    ]).then(([deptList, doctorList]: [Dept[], Doctor[]]) => {
      const active = deptList.filter(x => x.isActive);
      setDepts(active);

      const matched = doctorList.find(d => d.email?.toLowerCase() === user.email.toLowerCase() && d.isActive) ?? null;
      setMyDoctor(matched);

      if (matched) {
        setSelDept(matched.departmentId);
      } else if (active.length > 0) {
        setSelDept(active[0].id);
      }
    });
  }, [user.email]);

  const load = useCallback(async () => {
    if (!selDept) return;
    setLoading(true);
    const r = await fetch(`/api/camp/patients?departmentId=${selDept}`);
    if (r.ok) setPatients(await r.json());
    setLoading(false);
  }, [selDept]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const called       = patients.filter(p => p.status === "called");
  const waiting      = patients.filter(p => p.status === "waiting");
  const current      = called[0]  ?? null;
  const nextWaiting  = waiting[0] ?? null;

  async function updateStatus(id: number, status: "called" | "doctor_done") {
    setActing(true); setError("");
    const res  = await fetch("/api/camp/patients", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setActing(false);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      setError(text ? (JSON.parse(text).error ?? "Action failed") : `Server error (${res.status})`);
      return;
    }
    await res.json().catch(() => {});
    load();
  }

  const isLoaded = myDoctor !== undefined;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Stethoscope size={18} color={C.green} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            {myDoctor ? myDoctor.name : "Doctor Dashboard"}
          </h1>
          <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>
            {myDoctor ? myDoctor.department.name : "Call patients and mark consultations complete"}
          </p>
        </div>
        <button
          onClick={load} disabled={loading} title="Refresh"
          style={{ border: `1px solid ${C.border}`, background: C.surface, borderRadius: 8, padding: 7, cursor: "pointer", display: "flex", color: C.textSub }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Dept tabs — only shown when not auto-filtered to a specific doctor */}
      {isLoaded && !myDoctor && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" as const }}>
          {depts.map(d => (
            <button
              key={d.id}
              onClick={() => setSelDept(d.id)}
              style={{
                padding: "7px 16px", borderRadius: 20,
                border: `1px solid ${selDept === d.id ? C.goldBorder : C.border}`,
                background: selDept === d.id ? C.goldBg : C.surface,
                fontSize: 13, fontWeight: selDept === d.id ? 700 : 500,
                color: selDept === d.id ? C.gold : C.textSub,
                cursor: "pointer",
              }}
            >
              {d.code} · {d.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: C.redBg, border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Currently serving */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
          Currently Serving
        </p>
        {current ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: C.text, letterSpacing: 1, fontVariantNumeric: "tabular-nums" }}>
                {current.token}
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 2px" }}>{current.name}</p>
                <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>Age {current.age} · {current.gender} · {current.mobile}</p>
                {current.problem && <p style={{ fontSize: 12, color: C.gold, margin: "3px 0 0", fontStyle: "italic" }}>{current.problem}</p>}
              </div>
            </div>
            <button
              onClick={() => updateStatus(current.id, "doctor_done")}
              disabled={acting}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 9, border: "none",
                background: C.green, fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1,
              }}
            >
              <CheckCheck size={15} /> Finish Consultation
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
              {waiting.length === 0 ? "No patients waiting." : "No patient currently being seen."}
            </p>
            {nextWaiting && (
              <button
                onClick={() => updateStatus(nextWaiting.id, "called")}
                disabled={acting}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 18px", borderRadius: 9, border: "none",
                  background: C.primary, fontSize: 13, fontWeight: 700, color: "#fff",
                  cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1,
                }}
              >
                <ChevronRight size={15} /> Call Next — {nextWaiting.token}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Waiting queue */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Waiting Queue
          </p>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, background: C.orangeBg, padding: "2px 10px", borderRadius: 20 }}>
            {waiting.length}
          </span>
        </div>
        {waiting.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: C.textMuted, margin: 0 }}>Queue is empty.</p>
        ) : (
          <div>
            {waiting.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 20px",
                  borderBottom: i < waiting.length - 1 ? `1px solid ${C.border}` : "none",
                  background: i === 0 ? "#FAFBFF" : C.surface,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? C.blue : C.textMuted, minWidth: 70, fontVariantNumeric: "tabular-nums" }}>
                  {p.token}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: C.textSub, margin: 0 }}>{p.problem ? p.problem : `Age ${p.age} · ${p.gender}`}</p>
                </div>
                <span style={{ fontSize: 11, color: C.textMuted }}># {i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
