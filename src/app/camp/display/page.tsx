"use client";

import { useEffect, useState } from "react";

type DeptDisplay = { id: number; code: string; name: string; current: string | null };

export default function CampDisplayPage() {
  const [depts,   setDepts]   = useState<DeptDisplay[]>([]);
  const [time,    setTime]    = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch("/api/camp/display");
    if (r.ok) setDepts(await r.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const poll  = setInterval(load, 5000);
    const clock = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
    }, 1000);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, []);

  const active = depts.filter(d => d.current !== null);
  const idle   = depts.filter(d => d.current === null);

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0F1E",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
      padding: "32px 40px",
      color: "#fff",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7A99", margin: "0 0 4px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Medical Camp
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
            NOW SERVING
          </h1>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: "#C9A96E", margin: 0, fontVariantNumeric: "tabular-nums" }}>{time}</p>
          <p style={{ fontSize: 12, color: "#6B7A99", margin: 0 }}>
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 20, color: "#6B7A99" }}>Connecting…</p>
        </div>
      )}

      {!loading && depts.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 20, color: "#6B7A99" }}>Camp not started yet.</p>
        </div>
      )}

      {/* Active (currently calling) */}
      {active.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(active.length, 3)}, 1fr)`,
          gap: 20, marginBottom: idle.length > 0 ? 24 : 0,
        }}>
          {active.map(d => (
            <div
              key={d.id}
              style={{
                background: "#111827",
                border: "1px solid #1E3A5F",
                borderRadius: 20,
                padding: "28px 32px",
                boxShadow: "0 0 40px rgba(110,231,183,0.08)",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "#6B7A99", letterSpacing: "0.14em", textTransform: "uppercase" as const, margin: "0 0 10px" }}>
                {d.name}
              </p>
              <p style={{
                fontSize: "clamp(56px, 8vw, 96px)", fontWeight: 900, margin: 0,
                color: "#C9A96E", letterSpacing: 4, lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}>
                {d.current}
              </p>
              <p style={{ fontSize: 13, color: "#6B7A99", margin: "12px 0 0" }}>
                Please proceed to your doctor
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Idle departments (no current token) */}
      {idle.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          {idle.map(d => (
            <div
              key={d.id}
              style={{
                background: "#111827", border: "1px solid #1A2540",
                borderRadius: 14, padding: "14px 20px",
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", letterSpacing: "0.08em" }}>{d.code}</span>
              <span style={{ fontSize: 13, color: "#374151" }}>{d.name}</span>
              <span style={{ fontSize: 13, color: "#1F2D44", fontStyle: "italic" }}>–</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <p style={{ fontSize: 12, color: "#2A3550", marginTop: "auto", paddingTop: 32, textAlign: "center" as const }}>
        Please wait for your token to be called · किरपया अपना टोकन बुलाए जाने की प्रतीक्षा करें
      </p>
    </div>
  );
}
