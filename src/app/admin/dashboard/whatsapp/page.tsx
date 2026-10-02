"use client";

import { useEffect, useState } from "react";
import { Wifi, QrCode, CheckCircle, XCircle, Clock, RefreshCw, ScrollText, X } from "lucide-react";
import { C, Button, Badge, PageHeader, Card, Spinner, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty } from "../ui";
type WaStatus = { status: string; qr?: string; updatedAt?: string };
type Row      = { id: number; type: string; name: string; whatsapp: string; status: "sent" | "failed" | "pending"; sentAt: string; error?: string | null };

const STATUS_CFG = {
  sent:    { icon: CheckCircle, variant: "green"  as const, label: "Sent"    },
  failed:  { icon: XCircle,     variant: "red"    as const, label: "Failed"  },
  pending: { icon: Clock,       variant: "orange" as const, label: "Pending" },
} as const;

const TYPE_LABEL: Record<string, { label: string; variant: "blue" | "green" | "orange" | "purple" }> = {
  rsvp_auto:          { label: "RSVP",          variant: "blue"   },
  accommodation_auto: { label: "Accommodation",  variant: "green"  },
  vehicle_auto:       { label: "Vehicle",        variant: "orange" },
  broadcast:          { label: "Broadcast",      variant: "purple" },
};

function SkeletonRows() {
  return (
    <>{Array.from({ length: 5 }).map((_, i) => (
      <Tr key={i}>
        <Td><Skeleton width={60} height={22} radius={20} /></Td>
        <Td><Skeleton width={90} height={22} radius={20} /></Td>
        <Td><Skeleton width={120} height={13} /></Td>
        <Td><Skeleton width={100} height={13} /></Td>
        <Td><Skeleton width={90} height={13} /></Td>
      </Tr>
    ))}</>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Connect modal ─────────────────────────────────────────────────────────────
function ConnectModal({ onClose }: { onClose: () => void }) {
  const [wa, setWa] = useState<WaStatus>({ status: "starting" });

  // Poll independently every 2 s so modal doesn't miss fast status changes
  useEffect(() => {
    const tick = () => fetch("/api/wa-status").then(r => r.json()).then(setWa);
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  const isQr       = wa.status === "qr" && !!wa.qr;
  const isConnected = wa.status === "connected" || wa.status === "authenticated";

  // Auto-close on connect
  useEffect(() => {
    if (isConnected) onClose();
  }, [isConnected, onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: 16 }}
    >
      <Card
        padding={0}
        style={{ width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wifi size={15} color={C.textSub} />
            <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>Connect WhatsApp</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
          {!isQr && (
            <>
              <Spinner size={32} color={C.orange} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Starting bot…</p>
                <p style={{ fontSize: 12, color: C.textSub, marginTop: 6 }}>QR code will appear shortly</p>
              </div>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>status: {wa.status}</span>
            </>
          )}

          {isQr && (
            <>
              <div style={{ background: C.borderLight, borderRadius: 14, padding: 12, border: `1px solid ${C.border}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={wa.qr} alt="WhatsApp QR" style={{ width: 200, height: 200, display: "block", borderRadius: 8 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
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
        </div>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WhatsAppPage() {
  const [wa, setWa]                   = useState<WaStatus>({ status: "not_started" });
  const [showConnect, setShowConnect] = useState(false);
  const [rows, setRows]               = useState<Row[]>([]);
  const [logLoading, setLogLoading]   = useState(true);

  // Poll WA status every 3 s
  useEffect(() => {
    const tick = () => fetch("/api/wa-status").then(r => r.json()).then(setWa);
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  async function loadLog() {
    setLogLoading(true);
    const data: Row[] = await fetch("/api/wa-log").then(r => r.json());
    setRows(data);
    setLogLoading(false);
  }

  useEffect(() => { loadLog(); }, []);

  async function handleConnect() {
    setShowConnect(true);
    await fetch("/api/wa-start", { method: "POST" });
  }

  const isStale     = wa.updatedAt ? (Date.now() - new Date(wa.updatedAt).getTime()) > 30000 : false;
  const isConnected = (wa.status === "connected" || wa.status === "authenticated") && !isStale;
  const isQr        = wa.status === "qr" && !!wa.qr;
  const isStarting  = wa.status === "starting";
  const needsStart  = !isConnected && !isQr && !isStarting;

  const statusLabel   = isConnected ? "Connected" : isQr ? "Waiting for scan" : isStarting ? "Starting…" : "Not running";
  const statusVariant = isConnected ? "green" as const : isQr || isStarting ? "orange" as const : "gray" as const;

  const counts = {
    sent:    rows.filter(r => r.status === "sent").length,
    failed:  rows.filter(r => r.status === "failed").length,
    pending: rows.filter(r => r.status === "pending").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="WhatsApp"
        sub="Bot connection and message delivery log"
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Badge variant={statusVariant} dot>{statusLabel}</Badge>
            {needsStart && (
              <Button size="sm" icon={<Wifi size={13} />} onClick={handleConnect}>
                Connect
              </Button>
            )}
            {(isQr || isStarting) && (
              <Button variant="secondary" size="sm" icon={<QrCode size={13} />} onClick={() => setShowConnect(true)}>
                Show QR
              </Button>
            )}
          </div>
        }
      />

      {/* ── Connection card — only shown while connecting/scanning ── */}
      {(isQr || isStarting) && (
        <Card padding={0} style={{ overflow: "hidden", maxWidth: 520 }}>
          <div style={{
            padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: isConnected ? C.green : C.orange,
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

          <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.orangeBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spinner size={22} color={C.orange} />
            </div>
            <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>
              {isStarting ? "Starting — QR code will appear shortly…" : "Waiting for QR scan"}
            </p>
          </div>
        </Card>
      )}

      {/* Connect modal */}
      {showConnect && (
        <ConnectModal onClose={() => setShowConnect(false)} />
      )}

      {/* ── Message log ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
            Message Log
          </p>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={loadLog}>Refresh</Button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(["sent", "pending", "failed"] as const).map(s => {
            const { icon: Icon, variant, label } = STATUS_CFG[s];
            return (
              <Card key={s} padding="10px 18px" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon size={18} color={variant === "green" ? C.green : variant === "orange" ? C.orange : C.red} />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>{counts[s]}</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{label}</p>
                </div>
              </Card>
            );
          })}
          <Card padding="10px 18px" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>{rows.length}</p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>Total</p>
            </div>
          </Card>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Status</Th>
              <Th>Type</Th>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Sent At</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logLoading ? (
              <SkeletonRows />
            ) : rows.length === 0 ? (
              <Tr>
                <Td style={{ padding: 0, border: "none" }} colSpan={5}>
                  <Empty icon={<ScrollText size={40} />} title="No messages yet" />
                </Td>
              </Tr>
            ) : rows.map((r, i) => {
              const { icon: Icon, variant, label } = STATUS_CFG[r.status];
              const typeMeta = TYPE_LABEL[r.type] ?? { label: r.type, variant: "blue" as const };
              return (
                <Tr key={i}>
                  <Td><Badge variant={variant} icon={<Icon size={10} />}>{label}</Badge></Td>
                  <Td><Badge variant={typeMeta.variant}>{typeMeta.label}</Badge></Td>
                  <Td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.name}</Td>
                  <Td>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSub }}>{r.whatsapp}</span>
                    {r.error && <p style={{ fontSize: 11, color: C.red, margin: "2px 0 0" }}>{r.error}</p>}
                  </Td>
                  <Td style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>{fmtDate(r.sentAt)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}
