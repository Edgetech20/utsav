"use client";

import { useEffect, useState } from "react";

type WaStatus = { status: string; qr?: string; updatedAt?: string };

export default function WhatsAppPage() {
  const [wa, setWa] = useState<WaStatus>({ status: "not_started" });
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const tick = () => fetch("/api/wa-status").then(r => r.json()).then(setWa);
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  async function startBot() {
    setStarting(true);
    await fetch("/api/wa-start", { method: "POST" });
    setTimeout(() => setStarting(false), 4000);
  }

  const isStale     = wa.updatedAt ? (Date.now() - new Date(wa.updatedAt).getTime()) > 30000 : false;
  const isConnected = (wa.status === "connected" || wa.status === "authenticated") && !isStale;
  const needsStart  = wa.status === "not_started" || wa.status === "disconnected" || (isStale && wa.status === "connected");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>WhatsApp</h1>
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Auto-send thank-you messages to registrants</p>
      </div>

      {/* Status card */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #E8ECF0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 16,
      }}>
        {/* Status bar */}
        <div style={{
          padding: "14px 24px", borderBottom: "1px solid #E8ECF0",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isConnected ? "#10B981" : needsStart ? "#94A3B8" : "#F59E0B",
            boxShadow: isConnected ? "0 0 0 3px rgba(16,185,129,0.2)" : "none",
          }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
            {isConnected ? "Connected" : needsStart ? "Not Running" : wa.status === "qr" ? "Waiting for scan" : "Starting…"}
            {isStale && wa.status === "connected" && (
              <span style={{ fontSize: 11, fontWeight: 400, color: "#F59E0B", marginLeft: 8 }}>— bot may have stopped</span>
            )}
          </p>
          {wa.updatedAt && (
            <p style={{ fontSize: 11, color: "#CBD5E1", marginLeft: "auto" }}>
              Updated {new Date(wa.updatedAt).toLocaleTimeString("en-IN")}
            </p>
          )}
        </div>

        <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>

          {/* Connected state */}
          {isConnected && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>WhatsApp Connected</p>
                <p style={{ fontSize: 13, color: "#64748B", marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>
                  The bot is active. Registrants will automatically receive a thank-you message upon RSVP submission.
                </p>
              </div>
            </>
          )}

          {/* QR state */}
          {wa.status === "qr" && wa.qr && (
            <>
              <img src={wa.qr} alt="WhatsApp QR" style={{
                width: 220, height: 220, borderRadius: 16,
                border: "1px solid #E8ECF0",
              }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Scan to Connect</p>
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, lineHeight: 1.6 }}>
                  Open WhatsApp → Settings → Linked Devices → Link a Device<br />
                  Point your camera at the QR code above
                </p>
              </div>
            </>
          )}

          {/* Starting state */}
          {(wa.status === "starting") && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ fontSize: 14, color: "#64748B" }}>Bot is starting, QR will appear shortly…</p>
            </div>
          )}

          {/* Not started / disconnected */}
          {needsStart && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Bot Not Running</p>
                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Start the bot to enable auto-messaging</p>
              </div>
              <button
                onClick={startBot}
                disabled={starting}
                style={{
                  padding: "11px 32px", borderRadius: 10, border: "none",
                  background: starting ? "#E2E8F0" : "#0F172A",
                  color: starting ? "#94A3B8" : "#fff",
                  fontSize: 13, fontWeight: 600, cursor: starting ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {starting ? "Starting…" : "Start Bot"}
              </button>
            </>
          )}

        </div>
      </div>

      {/* Info box */}
      <div style={{
        background: "#F8FAFC", borderRadius: 12, padding: "14px 18px",
        border: "1px solid #E8ECF0", fontSize: 12, color: "#64748B", lineHeight: 1.6,
      }}>
        <strong style={{ color: "#0F172A" }}>How it works:</strong> When someone submits the RSVP form,
        they automatically receive a personalised thank-you message on WhatsApp.
        The session is saved — QR scan is only required once.
      </div>
    </div>
  );
}
