"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, QrCode, CheckCircle, XCircle, Clock, RefreshCw, ScrollText, X, Send, Users } from "lucide-react";
import { C, Button, Badge, PageHeader, Card, Spinner, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty } from "../ui";
import { useToast } from "../toast";

type WaStatus  = { status: string; qr?: string; updatedAt?: string };
type Entry     = { name: string; whatsapp: string; submittedAt: string; waSent: boolean };
type LogEntry  = { name: string; whatsapp: string; status: "sent" | "failed"; sentAt: string; error?: string };
type Row       = { name: string; whatsapp: string; submittedAt: string; status: "sent" | "failed" | "pending"; sentAt?: string; error?: string };

const STATUS_CFG = {
  sent:    { icon: CheckCircle, variant: "green"  as const, label: "Sent"    },
  failed:  { icon: XCircle,     variant: "red"    as const, label: "Failed"  },
  pending: { icon: Clock,       variant: "orange" as const, label: "Pending" },
} as const;

function SkeletonRows() {
  return (
    <>{Array.from({ length: 5 }).map((_, i) => (
      <Tr key={i}>
        <Td><Skeleton width={60} height={22} radius={20} /></Td>
        <Td><Skeleton width={120} height={13} /></Td>
        <Td><Skeleton width={100} height={13} /></Td>
        <Td><Skeleton width={90} height={13} /></Td>
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

const GROUPS = [
  { value: "rsvp",          label: "RSVP registrants"          },
  { value: "accommodation",  label: "Accommodation registrants"  },
  { value: "vehicle",        label: "Vehicle / Parking registrants" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WhatsAppPage() {
  const { toast } = useToast();
  const [wa, setWa]                 = useState<WaStatus>({ status: "not_started" });
  const [showConnect, setShowConnect] = useState(false);
  const [rows, setRows]             = useState<Row[]>([]);
  const [logLoading, setLogLoading] = useState(true);

  // Template state
  const [tplBody, setTplBody]   = useState("");
  const [tplSaving, setTplSaving] = useState(false);
  const origTpl = useRef("");

  // Broadcast state
  const [bcGroup, setBcGroup]   = useState("rsvp");
  const [bcCount, setBcCount]   = useState<number | null>(null);
  const [bcMsg, setBcMsg]       = useState("");
  const [bcSending, setBcSending] = useState(false);

  // Poll WA status every 3 s
  useEffect(() => {
    const tick = () => fetch("/api/wa-status").then(r => r.json()).then(setWa);
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  async function loadLog() {
    setLogLoading(true);
    const [rsvpRes, logs]: [{ entries: Entry[] }, LogEntry[]] = await Promise.all([
      fetch("/api/rsvp").then(r => r.json()),
      fetch("/api/wa-log").then(r => r.json()),
    ]);
    const entries = rsvpRes?.entries ?? [];
    const logMap  = new Map(logs.map(l => [l.whatsapp, l]));
    setRows([...entries].reverse().map(e => {
      const log = logMap.get(e.whatsapp);
      return {
        name: e.name, whatsapp: e.whatsapp, submittedAt: e.submittedAt,
        status: e.waSent ? "sent" : log?.status === "failed" ? "failed" : "pending",
        sentAt: log?.sentAt, error: log?.error,
      };
    }));
    setLogLoading(false);
  }

  useEffect(() => { loadLog(); }, []);

  // Load template
  useEffect(() => {
    fetch("/api/wa-template").then(r => r.json()).then(d => {
      setTplBody(d.body ?? ""); origTpl.current = d.body ?? "";
    });
  }, []);

  // Load recipient count when group changes
  useEffect(() => {
    setBcCount(null);
    fetch(`/api/wa-broadcast?group=${bcGroup}`).then(r => r.json()).then(d => setBcCount(d.count ?? 0));
  }, [bcGroup]);

  async function saveTemplate() {
    setTplSaving(true);
    await fetch("/api/wa-template", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: tplBody }) });
    origTpl.current = tplBody;
    setTplSaving(false);
    toast("Template saved", "success");
  }

  async function sendBroadcast() {
    if (!bcMsg.trim()) return;
    setBcSending(true);
    const res = await fetch("/api/wa-broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: bcGroup, message: bcMsg }) });
    const data = await res.json();
    setBcSending(false);
    setBcMsg("");
    toast(`Queued ${data.queued} message${data.queued !== 1 ? "s" : ""}`, "success");
  }

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

      {/* ── Auto-message template ── */}
      <Card>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
          Auto-Message Template
        </p>
        <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
          Sent automatically on RSVP. Use <code style={{ background: C.borderLight, padding: "1px 5px", borderRadius: 4 }}>{"{name}"}</code> for first name.
        </p>
        <textarea
          value={tplBody}
          onChange={e => setTplBody(e.target.value)}
          rows={6}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, outline: "none" }}
        />
        <div style={{ marginTop: 10 }}>
          <Button
            disabled={tplBody === origTpl.current || !tplBody.trim()}
            loading={tplSaving}
            onClick={saveTemplate}
          >
            Save Template
          </Button>
        </div>
      </Card>

      {/* ── Manual broadcast ── */}
      <Card>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
          Send Notification
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Group picker */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
              Recipients
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {GROUPS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setBcGroup(g.value)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${bcGroup === g.value ? C.primary : C.border}`,
                    background: bcGroup === g.value ? C.primary : "#fff",
                    color: bcGroup === g.value ? "#fff" : C.textSub,
                  }}
                >
                  {g.label}
                  {bcGroup === g.value && bcCount !== null && (
                    <span style={{ marginLeft: 6, opacity: 0.7 }}>({bcCount})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
              Message
            </label>
            <textarea
              value={bcMsg}
              onChange={e => setBcMsg(e.target.value)}
              rows={4}
              placeholder={`Use {name} for first name.\nHello {name}, your accommodation has been confirmed…`}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Button
              icon={<Send size={13} />}
              disabled={!bcMsg.trim() || bcSending}
              loading={bcSending}
              onClick={sendBroadcast}
            >
              Send to {bcCount !== null ? bcCount : "…"} recipients
            </Button>
            {bcCount === 0 && (
              <span style={{ fontSize: 12, color: C.textMuted }}>No registrants in this group yet</span>
            )}
          </div>
        </div>
      </Card>

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
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Registered</Th>
              <Th>Message Sent</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logLoading ? (
              <SkeletonRows />
            ) : rows.length === 0 ? (
              <Tr>
                <Td style={{ padding: 0, border: "none" }} colSpan={5}>
                  <Empty icon={<ScrollText size={40} />} title="No registrations yet" />
                </Td>
              </Tr>
            ) : rows.map((r, i) => {
              const { icon: Icon, variant, label } = STATUS_CFG[r.status];
              return (
                <Tr key={i}>
                  <Td><Badge variant={variant} icon={<Icon size={10} />}>{label}</Badge></Td>
                  <Td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.name}</Td>
                  <Td>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSub }}>{r.whatsapp}</span>
                    {r.error && <p style={{ fontSize: 11, color: C.red, margin: "2px 0 0" }}>{r.error}</p>}
                  </Td>
                  <Td style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>{fmtDate(r.submittedAt)}</Td>
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
