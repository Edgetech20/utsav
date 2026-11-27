"use client";

import { useState } from "react";
import { LayoutDashboard, Tent, BadgeCheck, PhoneCall, LogOut, ChevronRight } from "lucide-react";
import type { ModuleTile } from "@/lib/modules";

const C = {
  bg: "#F5F7FA", surface: "#ffffff", border: "#E8ECF0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  gold: "#C9A96E", goldBg: "rgba(201,169,110,0.10)", red: "#EF4444", redBg: "#FFF5F5",
} as const;

const ICON = { admin: LayoutDashboard, camp: Tent, volunteer: BadgeCheck } as const;
const ERROR_MSG: Record<string, string> = {
  access:   "You don't have access to that module. Pick one below or contact your administrator.",
  disabled: "That module is not currently active.",
};

const CSS = `
.mod-tile { transition: border-color .15s, box-shadow .15s, transform .15s; }
.mod-tile:hover { border-color: ${C.gold}; box-shadow: 0 6px 20px rgba(15,23,42,0.08); transform: translateY(-1px); }
.mod-tile:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
`;

export default function Launcher({ event, name, email, modules, error }: {
  event: string; name: string; email: string; modules: ModuleTile[]; error?: string;
}) {
  const [leaving, setLeaving] = useState(false);

  async function signOut() {
    setLeaving(true);
    await fetch("/api/admin-login", { method: "DELETE" }).catch(() => {});
    window.location.assign("/login");
  }

  return (
    <main style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>{event}</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "6px 0 4px" }}>Welcome, {name}</h1>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{modules.length ? "Where would you like to go?" : "Signed in as " + email}</p>
        </div>

        {error && ERROR_MSG[error] && (
          <div role="alert" style={{ background: C.redBg, border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: C.red, lineHeight: 1.5 }}>
            {ERROR_MSG[error]}
          </div>
        )}

        {modules.length === 0 ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, textAlign: "center", fontSize: 14, color: C.textSub, lineHeight: 1.6 }}>
            Your account doesn&apos;t have access to any module yet.<br />Ask your administrator to assign you a role.
          </div>
        ) : (
          <nav aria-label="Modules" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {modules.map(m => {
              const Icon = m.key === "admin" && m.href.endsWith("/rsvp") ? PhoneCall : ICON[m.key];
              return (
                <a key={m.key} href={m.href} className="mod-tile" style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", textDecoration: "none",
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
                    <Icon size={20} color={C.gold} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: C.text }}>{m.name}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: C.textSub, marginTop: 2 }}>{m.desc}</span>
                  </span>
                  <ChevronRight size={18} color={C.textMuted} />
                </a>
              );
            })}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, fontSize: 12, color: C.textMuted }}>
          <span>{email}</span>
          <span aria-hidden>·</span>
          <button onClick={signOut} disabled={leaving}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 12, color: C.textSub, fontWeight: 600 }}>
            <LogOut size={12} /> {leaving ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </main>
  );
}
