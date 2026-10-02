"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, QrCode } from "lucide-react";
import { C, Button, Badge, PageHeader, Card, Spinner } from "../ui";

type WaStatus = { status: string; qr?: string; updatedAt?: string };

export default function WhatsAppPage() {
  const [wa, setWa]           = useState<WaStatus>({ status: "not_started" });
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
  const isQr        = wa.status === "qr" && !!wa.qr;
  const isStarting  = wa.status === "starting";
  const needsStart  = !isConnected && !isQr && !isStarting;

  const statusLabel = isConnected ? "Connected"
    : isQr       ? "Waiting for scan"
    : isStarting ? "Starting…"
    : "Not running";

  const statusVariant = isConnected ? "green" as const
    : isQr || isStarting ? "orange" as const
    : "gray" as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
      <PageHeader
        title="WhatsApp"
        sub="Auto-send thank-you messages to registrants"
        actions={<Badge variant={statusVariant} dot>{statusLabel}</Badge>}
      />

      {/* Main status card */}
      <Card padding={0} style={{ overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: isConnected ? C.green : isQr || isStarting ? C.orange : C.textMuted,
              boxShadow: isConnected ? `0 0 0 3px rgba(16,185,129,0.2)` : "none",
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{statusLabel}</span>
            {isStale && wa.status === "connected" && (
              <span style={{ fontSize: 11, color: C.orange }}>— may have stopped</span>
            )}
          </div>
          {wa.updatedAt && (
            <span style={{ fontSize: 11, color: C.textMuted }}>
              {new Date(wa.updatedAt).toLocaleTimeString("en-IN")}
            </span>
          )}
        </div>

        <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>

          {/* Connected */}
          {isConnected && (
            <>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wifi size={28} color={C.green} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>WhatsApp Connected</p>
                <p style={{ fontSize: 13, color: C.textSub, marginTop: 6, maxWidth: 320, lineHeight: 1.6 }}>
                  The bot is active. Registrants automatically receive a thank-you message upon RSVP submission.
                </p>
              </div>
            </>
          )}

          {/* QR scan */}
          {isQr && (
            <>
              <div style={{ background: C.borderLight, borderRadius: 14, padding: 12, border: `1px solid ${C.border}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={wa.qr} alt="WhatsApp QR" style={{ width: 200, height: 200, display: "block", borderRadius: 8 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                  <QrCode size={14} color={C.orange} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Scan to Connect</p>
                </div>
                <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.7 }}>
                  WhatsApp → Settings → Linked Devices → Link a Device<br />
                  Point your camera at the QR code above
                </p>
              </div>
            </>
          )}

          {/* Starting */}
          {isStarting && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
              <Spinner size={24} color={C.orange} />
              <p style={{ fontSize: 13, color: C.textSub }}>Bot is starting — QR will appear shortly…</p>
            </div>
          )}

          {/* Not started */}
          {needsStart && (
            <>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.borderLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WifiOff size={26} color={C.textMuted} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Bot Not Running</p>
                <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Start the bot to enable auto-messaging</p>
              </div>
              <Button size="lg" loading={starting} onClick={startBot}>
                {starting ? "Starting…" : "Start Bot"}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Info box */}
      <div style={{
        background: C.goldBg, borderRadius: 10, padding: "13px 16px",
        border: `1px solid ${C.goldBorder}`, fontSize: 12, color: C.textSub, lineHeight: 1.7,
      }}>
        <strong style={{ color: C.text }}>How it works:</strong> When someone submits the RSVP form,
        they automatically receive a personalised thank-you message on WhatsApp.
        The session is saved — QR scan is only required once.
      </div>
    </div>
  );
}
