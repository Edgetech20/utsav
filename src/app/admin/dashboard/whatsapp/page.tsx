"use client";

import { useEffect, useState } from "react";
import { Wifi, QrCode, CheckCircle, XCircle, Clock, RefreshCw, ScrollText, X, BarChart2 } from "lucide-react";
import { C, Button, Badge, PageHeader, Card, Spinner, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Pagination } from "../ui";

type WaStatus = { status: string; qr?: string; updatedAt?: string };
type Row      = { id: number; type: string; name: string; whatsapp: string; status: "sent" | "failed" | "pending"; sentAt: string; error?: string | null };
type Tab      = "connect" | "analytics" | "logs";

const STATUS_CFG = {
  sent:    { icon: CheckCircle, variant: "green"  as const, label: "Sent"    },
  failed:  { icon: XCircle,     variant: "red"    as const, label: "Failed"  },
  pending: { icon: Clock,       variant: "orange" as const, label: "Pending" },
} as const;

const TYPE_LABEL: Record<string, { label: string; variant: "blue" | "green" | "orange" | "purple" }> = {
  rsvp_auto: { label: "RSVP Auto", variant: "blue"   },
  broadcast:  { label: "Broadcast", variant: "purple" },
};

const TABS: { key: Tab; label: string }[] = [
  { key: "connect",   label: "Connect"   },
  { key: "analytics", label: "Analytics" },
  { key: "logs",      label: "Logs"      },
];

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

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

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: "flex", gap: 2, background: C.borderLight, borderRadius: 10, padding: 4, width: "fit-content" }}>
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            border: "none", cursor: "pointer", borderRadius: 7, padding: "6px 18px",
            fontSize: 13, fontWeight: active === t.key ? 600 : 500,
            color: active === t.key ? C.text : C.textSub,
            background: active === t.key ? C.surface : "transparent",
            boxShadow: active === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Connect modal ─────────────────────────────────────────────────────────────
function ConnectModal({ onClose }: { onClose: () => void }) {
  const [wa, setWa] = useState<WaStatus>({ status: "starting" });

  useEffect(() => {
    const tick = () => fetch("/api/wa-status").then(r => r.json()).then(setWa);
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  const isQr        = wa.status === "qr" && !!wa.qr;
  const isConnected = wa.status === "connected" || wa.status === "authenticated";

  useEffect(() => { if (isConnected) onClose(); }, [isConnected, onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: 16 }}>
      <Card padding={0} style={{ width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wifi size={15} color={C.textSub} />
            <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>Connect WhatsApp</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}>
            <X size={17} />
          </button>
        </div>
        <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
          {!isQr ? (
            <>
              <Spinner size={32} color={C.orange} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Starting bot…</p>
                <p style={{ fontSize: 12, color: C.textSub, marginTop: 6 }}>QR code will appear shortly</p>
              </div>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>status: {wa.status}</span>
            </>
          ) : (
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

// ── Connect tab ───────────────────────────────────────────────────────────────
function ConnectTab({ wa, onConnect, onShowQr }: { wa: WaStatus; onConnect: () => void; onShowQr: () => void }) {
  const isStale     = wa.updatedAt ? (Date.now() - new Date(wa.updatedAt).getTime()) > 30000 : false;
  const isConnected = (wa.status === "connected" || wa.status === "authenticated") && !isStale;
  const isQr        = wa.status === "qr" && !!wa.qr;
  const isStarting  = wa.status === "starting";
  const needsStart  = !isConnected && !isQr && !isStarting;

  const statusLabel   = isConnected ? "Connected" : isQr ? "Waiting for scan" : isStarting ? "Starting…" : "Not running";
  const statusColor   = isConnected ? C.green : isQr || isStarting ? C.orange : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      {/* Status card */}
      <Card padding={0}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Bot Status</p>
          {wa.updatedAt && (
            <span style={{ fontSize: 11, color: C.textMuted }}>
              Updated {new Date(wa.updatedAt).toLocaleTimeString("en-IN")}
            </span>
          )}
        </div>
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: isConnected ? "rgba(16,185,129,0.1)" : isQr || isStarting ? C.orangeBg : "#FFF5F5",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isStarting ? <Spinner size={20} color={C.orange} /> : <Wifi size={20} color={statusColor} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0,
                boxShadow: isConnected ? "0 0 0 3px rgba(16,185,129,0.2)" : "none" }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{statusLabel}</p>
              {isStale && wa.status === "connected" && (
                <span style={{ fontSize: 11, color: C.orange }}>— may have stopped</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>
              {isConnected ? "Bot is running and sending messages" :
               isQr        ? "Waiting for QR scan from your phone" :
               isStarting  ? "Initialising — QR will appear shortly" :
                             "Start the bot to send WhatsApp messages"}
            </p>
          </div>
        </div>
        {(needsStart || isQr || isStarting) && (
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            {needsStart && (
              <Button size="sm" icon={<Wifi size={13} />} onClick={onConnect}>Connect</Button>
            )}
            {(isQr || isStarting) && (
              <Button variant="secondary" size="sm" icon={<QrCode size={13} />} onClick={onShowQr}>Show QR</Button>
            )}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card padding="16px 20px">
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>How to connect</p>
        {[
          "Click Connect above to start the bot",
          "Open WhatsApp on your phone",
          "Go to Settings → Linked Devices → Link a Device",
          "Scan the QR code that appears",
          "Bot connects automatically and starts sending",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>{i + 1}</span>
            </div>
            <p style={{ fontSize: 13, color: C.textSub, margin: 0, lineHeight: 1.5 }}>{step}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ rows }: { rows: Row[] }) {
  const today = new Date().toDateString();

  const sent    = rows.filter(r => r.status === "sent");
  const failed  = rows.filter(r => r.status === "failed");
  const pending = rows.filter(r => r.status === "pending");
  const todaySent = sent.filter(r => new Date(r.sentAt).toDateString() === today).length;

  const rsvpSent      = sent.filter(r => r.type === "rsvp_auto").length;
  const broadcastSent = sent.filter(r => r.type === "broadcast").length;
  const successRate   = sent.length + failed.length > 0
    ? Math.round((sent.length / (sent.length + failed.length)) * 100) : 0;

  const statCards = [
    { label: "Total Sent",     value: sent.length,    color: C.green  },
    { label: "Pending",        value: pending.length, color: C.orange },
    { label: "Failed",         value: failed.length,  color: C.red    },
    { label: "Sent Today",     value: todaySent,       color: C.blue   },
    { label: "Success Rate",   value: `${successRate}%`, color: C.text },
    { label: "Total Messages", value: rows.length,    color: C.text   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {statCards.map(s => (
          <Card key={s.label} padding="16px 18px">
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Breakdown by type */}
      <Card padding={0}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Breakdown by Type</p>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "RSVP Auto", value: rsvpSent,      total: sent.length, variant: "blue"   as const },
            { label: "Broadcast", value: broadcastSent, total: sent.length, variant: "purple" as const },
          ].map(row => {
            const pct = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0;
            const barColor = row.variant === "blue" ? C.blue : "#8B5CF6";
            return (
              <div key={row.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge variant={row.variant}>{row.label}</Badge>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{row.value} <span style={{ fontWeight: 400, color: C.textMuted }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 6, background: C.borderLight, borderRadius: 999 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 999, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Daily cap */}
      <Card padding={0}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Daily Cap Usage</p>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: C.textSub }}>Today</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{todaySent} / 50</span>
          </div>
          <div style={{ height: 8, background: C.borderLight, borderRadius: 999 }}>
            <div style={{
              height: "100%", borderRadius: 999, transition: "width 0.4s",
              width: `${Math.min(100, (todaySent / 50) * 100)}%`,
              background: todaySent >= 45 ? C.red : todaySent >= 35 ? C.orange : C.green,
            }} />
          </div>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "8px 0 0" }}>
            {50 - todaySent} messages remaining today
          </p>
        </div>
      </Card>
    </div>
  );
}

// ── Logs tab ──────────────────────────────────────────────────────────────────
function LogsTab({ rows, loading, onRefresh }: { rows: Row[]; loading: boolean; onRefresh: () => void }) {
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
          Message Log
        </p>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={onRefresh}>Refresh</Button>
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
          {loading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <Tr>
              <Td style={{ padding: 0, border: "none" }} colSpan={5}>
                <Empty icon={<ScrollText size={40} />} title="No messages yet" />
              </Td>
            </Tr>
          ) : rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((r, i) => {
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
      <Pagination page={page} total={rows.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WhatsAppPage() {
  const [tab, setTab]             = useState<Tab>("connect");
  const [wa, setWa]               = useState<WaStatus>({ status: "not_started" });
  const [showConnect, setShow]    = useState(false);
  const [rows, setRows]           = useState<Row[]>([]);
  const [logLoading, setLogLoad]  = useState(true);

  useEffect(() => {
    const tick = () => fetch("/api/wa-status").then(r => r.json()).then(setWa);
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  async function loadLog() {
    setLogLoad(true);
    const data: Row[] = await fetch("/api/wa-log").then(r => r.json());
    setRows(data);
    setLogLoad(false);
  }

  useEffect(() => { loadLog(); }, []);

  async function handleConnect() {
    setShow(true);
    await fetch("/api/wa-start", { method: "POST" });
  }

  const isStale     = wa.updatedAt ? (Date.now() - new Date(wa.updatedAt).getTime()) > 30000 : false;
  const isConnected = (wa.status === "connected" || wa.status === "authenticated") && !isStale;
  const statusVariant = isConnected ? "green" as const : wa.status === "qr" || wa.status === "starting" ? "orange" as const : "gray" as const;
  const statusLabel   = isConnected ? "Connected" : wa.status === "qr" ? "Waiting for scan" : wa.status === "starting" ? "Starting…" : "Not running";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="WhatsApp"
        sub="Bot management and message delivery"
        actions={<Badge variant={statusVariant} dot>{statusLabel}</Badge>}
      />

      <TabBar active={tab} onChange={setTab} />

      {tab === "connect" && (
        <ConnectTab wa={wa} onConnect={handleConnect} onShowQr={() => setShow(true)} />
      )}
      {tab === "analytics" && (
        <AnalyticsTab rows={rows} />
      )}
      {tab === "logs" && (
        <LogsTab rows={rows} loading={logLoading} onRefresh={loadLog} />
      )}

      {showConnect && <ConnectModal onClose={() => setShow(false)} />}
    </div>
  );
}
