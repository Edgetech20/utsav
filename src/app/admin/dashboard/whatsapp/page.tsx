"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, QrCode, CheckCircle, XCircle, Clock, RefreshCw, ScrollText, X, Send, Users, CheckSquare, Square } from "lucide-react";
import { C, Button, Badge, Card, Spinner, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Pagination, useDesktop } from "../ui";
import { useToast } from "../toast";

type WaStatus  = { status: string; qr?: string; updatedAt?: string };
type Row       = { id: number; type: string; name: string; whatsapp: string; status: "sent" | "failed" | "pending"; sentAt: string; error?: string | null };
type Template  = { id: number; key: string; name: string; body: string; enabled: boolean };
type Recipient = { name: string; mobile: string };
type Tab       = "connect" | "analytics" | "templates" | "logs" | "settings";
type WaConfig  = { wa_interval_min: string; wa_interval_max: string; wa_daily_cap: string; wa_hours_from: string; wa_hours_to: string };

const STATUS_CFG = {
  sent:    { icon: CheckCircle, variant: "green"  as const, label: "Sent"    },
  failed:  { icon: XCircle,     variant: "red"    as const, label: "Failed"  },
  pending: { icon: Clock,       variant: "orange" as const, label: "Pending" },
} as const;

const TYPE_LABEL: Record<string, { label: string; variant: "blue" | "green" | "orange" | "purple" }> = {
  rsvp_auto: { label: "RSVP Auto", variant: "blue"   },
  broadcast:  { label: "Broadcast", variant: "purple" },
};

const TPL_META: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  rsvp_auto: {
    label: "RSVP",
    icon: <Users size={15} />,
    desc: "Sent when someone submits the RSVP form",
  },
};

const GROUPS = [{ value: "rsvp", label: "RSVP" }];

const TABS: { key: Tab; label: string }[] = [
  { key: "connect",   label: "Connect"   },
  { key: "analytics", label: "Analytics" },
  { key: "templates", label: "Templates" },
  { key: "logs",      label: "Logs"      },
  { key: "settings",  label: "Settings"  },
];

const CFG_DEFAULTS: WaConfig = {
  wa_interval_min: "90",
  wa_interval_max: "120",
  wa_daily_cap:    "50",
  wa_hours_from:   "9",
  wa_hours_to:     "20",
};

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

// ── Analytics types ───────────────────────────────────────────────────────────
type Analytics = {
  totals:      { sent: number; failed: number; pending: number; todaySent: number };
  daily:       { date: string; sent: number; failed: number }[];
  hourly:      { hour: number; count: number }[];
  byType:      Record<string, { sent: number; failed: number }>;
  topErrors:   { error: string; count: number }[];
  queueStats:  { pending: number; avgPerDay: number; etaDays: number | null };
  successRate: number;
};

// ── Analytics tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData]    = useState<Analytics | null>(null);
  const [loading, setLoad] = useState(true);

  function load() {
    setLoad(true);
    fetch("/api/wa-analytics").then(r => r.json()).then(d => { setData(d); setLoad(false); });
  }

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} padding="16px 18px"><Skeleton width={60} height={28} /><Skeleton width={90} height={11} style={{ marginTop: 6 }} /></Card>
        ))}
      </div>
    );
  }

  const { totals, daily, hourly, byType, topErrors, queueStats, successRate } = data;
  const week      = daily.slice(-7);
  const maxDaily  = Math.max(...week.map(d => d.sent + d.failed), 1);
  const maxHourly = Math.max(...hourly.map(h => h.count), 1);

  const kpis = [
    { label: "Total Sent",    value: totals.sent,          color: C.green  },
    { label: "Pending",       value: totals.pending,       color: C.orange },
    { label: "Failed",        value: totals.failed,        color: C.red    },
    { label: "Sent Today",    value: totals.todaySent,     color: C.blue   },
    { label: "Success Rate",  value: `${successRate}%`,    color: successRate >= 90 ? C.green : successRate >= 70 ? C.orange : C.red },
    { label: "Avg / Day",     value: queueStats.avgPerDay, color: C.text   },
  ];

  const TYPE_CFG: Record<string, { label: string; color: string }> = {
    rsvp_auto: { label: "RSVP Auto", color: C.blue   },
    broadcast: { label: "Broadcast", color: "#8B5CF6" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12 }}>
        {kpis.map(k => (
          <Card key={k.label} padding="16px 18px">
            <p style={{ fontSize: 24, fontWeight: 800, color: k.color, margin: "0 0 4px", lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{k.label}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card padding={0}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>7-Day Activity</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ color: C.green, label: "Sent" }, { color: C.red, label: "Failed" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 11, color: C.textSub }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "16px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }}>
              {week.map(d => {
                const sentH   = Math.round((d.sent   / maxDaily) * 100);
                const failedH = Math.round((d.failed / maxDaily) * 100);
                const label   = new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                return (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 88, gap: 2 }}>
                      {d.failed > 0 && (
                        <div title={`${d.failed} failed`} style={{ width: "100%", height: `${failedH}%`, minHeight: 3, background: C.red, borderRadius: "3px 3px 0 0", opacity: 0.8 }} />
                      )}
                      <div title={`${d.sent} sent`} style={{ width: "100%", height: `${sentH}%`, minHeight: d.sent > 0 ? 3 : 0, background: C.green, borderRadius: d.failed > 0 ? 0 : "3px 3px 0 0" }} />
                    </div>
                    <span style={{ fontSize: 9, color: C.textMuted, whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card padding={0}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>7-Day Trend</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ color: C.green, label: "Sent" }, { color: C.red, label: "Failed" }, { color: C.blue, label: "Total" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 16, height: 2, background: l.color, borderRadius: 1 }} />
                  <span style={{ fontSize: 11, color: C.textSub }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "16px 16px 12px" }}>
            {(() => {
              const W = 100, H = 88;
              const maxVal = Math.max(...week.map(d => d.sent + d.failed), 1);
              const xOf    = (i: number) => week.length === 1 ? W / 2 : (i / (week.length - 1)) * W;
              const yOf    = (v: number) => H - (v / maxVal) * H;
              const lines = [
                { key: "total",  color: C.blue,  vals: week.map(d => d.sent + d.failed), dash: "3,2" },
                { key: "sent",   color: C.green, vals: week.map(d => d.sent),            dash: ""    },
                { key: "failed", color: C.red,   vals: week.map(d => d.failed),          dash: "2,2" },
              ];
              const labels = week.map(d =>
                new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              );
              return (
                <div>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 96, overflow: "visible" }}>
                    {[0, 0.25, 0.5, 0.75, 1].map(v => (
                      <line key={v} x1={0} y1={H * (1 - v)} x2={W} y2={H * (1 - v)} stroke="#E8ECF0" strokeWidth="0.5" />
                    ))}
                    {lines.map(({ key, color, vals, dash }) => {
                      const pts = vals.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
                      return (
                        <g key={key}>
                          <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
                            strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash || undefined} />
                          {vals.map((v, i) => (
                            <circle key={i} cx={xOf(i)} cy={yOf(v)} r="2.2" fill={C.surface} stroke={color} strokeWidth="1.6">
                              <title>{labels[i]} · {key}: {v}</title>
                            </circle>
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    {labels.map((l, i) => (
                      <span key={i} style={{ fontSize: 9, color: C.textMuted, flex: 1, textAlign: "center" }}>{l}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card padding={0}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Queue Burn-down</p>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.textSub }}>Pending messages</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{queueStats.pending}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.textSub }}>Avg sent / day (7d)</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{queueStats.avgPerDay}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.textSub }}>ETA to clear queue</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: queueStats.etaDays && queueStats.etaDays > 30 ? C.red : C.green }}>
                {queueStats.etaDays == null ? "—" : queueStats.etaDays === 0 ? "Done" : `~${queueStats.etaDays} days`}
              </span>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>Today's cap</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{totals.todaySent} / 50</span>
              </div>
              <div style={{ height: 7, background: C.borderLight, borderRadius: 999 }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  width: `${Math.min(100, (totals.todaySent / 50) * 100)}%`,
                  background: totals.todaySent >= 45 ? C.red : totals.todaySent >= 35 ? C.orange : C.green,
                  transition: "width 0.4s",
                }} />
              </div>
            </div>
          </div>
        </Card>

        <Card padding={0}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>By Type</p>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {Object.entries(byType).map(([type, counts]) => {
              const cfg   = TYPE_CFG[type] ?? { label: type, color: C.textSub };
              const total = counts.sent + counts.failed;
              const pct   = totals.sent > 0 ? Math.round((counts.sent / totals.sent) * 100) : 0;
              const rate  = total > 0 ? Math.round((counts.sent / total) * 100) : 100;
              return (
                <div key={type}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{cfg.label}</span>
                    <span style={{ fontSize: 12, color: C.textSub }}>{counts.sent} sent · {rate}% success</span>
                  </div>
                  <div style={{ height: 7, background: C.borderLight, borderRadius: 999 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: 999, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card padding={0}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Send Activity by Hour</p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>All-time messages per hour of day</p>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 4 }}>
            {hourly.map(h => {
              const intensity = h.count / maxHourly;
              const inWindow  = h.hour >= 9 && h.hour < 20;
              return (
                <div key={h.hour} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div
                    title={`${h.hour}:00 — ${h.count} messages`}
                    style={{
                      width: "100%", aspectRatio: "1", borderRadius: 4,
                      background: h.count === 0 ? C.borderLight : `rgba(16,185,129,${0.15 + intensity * 0.85})`,
                      border: inWindow ? `1px solid rgba(16,185,129,0.3)` : `1px solid ${C.border}`,
                    }}
                  />
                  {h.hour % 3 === 0 && (
                    <span style={{ fontSize: 8, color: C.textMuted }}>{h.hour}h</span>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "10px 0 0" }}>
            Outlined cells = business hours (9am–8pm). Darker = more messages.
          </p>
        </div>
      </Card>

      {topErrors.length > 0 && (
        <Card padding={0}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Top Failure Reasons</p>
          </div>
          <div style={{ padding: "8px 0" }}>
            {topErrors.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 20px", borderBottom: i < topErrors.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 12, color: C.textSub, fontFamily: "monospace", flex: 1, marginRight: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.error}</span>
                <Badge variant="red">{e.count}×</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Templates tab ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? C.green : C.border, position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function TemplateCard({ tpl, onSave }: { tpl: Template; onSave: (key: string, body: string, enabled: boolean) => Promise<void> }) {
  const [body, setBody]       = useState(tpl.body);
  const [enabled, setEnabled] = useState(tpl.enabled);
  const [saving, setSaving]   = useState(false);
  const meta  = TPL_META[tpl.key];
  const dirty = body !== tpl.body || enabled !== tpl.enabled;

  async function save() {
    setSaving(true);
    await onSave(tpl.key, body, enabled);
    setSaving(false);
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: C.borderLight, borderRadius: 8, padding: 7, display: "flex", color: C.textSub }}>
            {meta?.icon}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{meta?.label ?? tpl.name}</p>
            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{meta?.desc}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: enabled ? C.green : C.textMuted, fontWeight: 600 }}>
            {enabled ? "On" : "Off"}
          </span>
          <Toggle on={enabled} onChange={setEnabled} />
        </div>
      </div>

      <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
        Use <code style={{ background: C.borderLight, padding: "1px 5px", borderRadius: 4 }}>{"{name}"}</code> for first name.
      </p>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={6}
        disabled={!enabled}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "10px 12px", border: `1px solid ${C.border}`,
          borderRadius: 8, fontSize: 13, color: enabled ? C.text : C.textMuted,
          resize: "vertical", fontFamily: "inherit", lineHeight: 1.7, outline: "none",
          background: enabled ? "#fff" : C.borderLight,
          transition: "background 0.15s",
        }}
      />

      <div style={{ marginTop: 10 }}>
        <Button disabled={!dirty} loading={saving} onClick={save}>Save</Button>
      </div>
    </Card>
  );
}

function ComposeModal({ onClose, onSend }: { onClose: () => void; onSend: (msg: string, selected: Recipient[]) => Promise<void> }) {
  const desktop = useDesktop();
  const [group, setGroup]           = useState("rsvp");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [rcLoading, setRcLoading]   = useState(false);
  const [msg, setMsg]               = useState("");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [sending, setSending]       = useState(false);
  const allSelected = recipients.length > 0 && selected.size === recipients.length;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRcLoading(true);
    fetch(`/api/wa-broadcast?group=${group}`)
      .then(r => r.json())
      .then(d => {
        const list: Recipient[] = d.recipients ?? [];
        setRecipients(list);
        setSelected(new Set(list.map(r => r.mobile)));
        setRcLoading(false);
      });
  }, [group]);

  function toggleOne(mobile: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(mobile) ? next.delete(mobile) : next.add(mobile);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(recipients.map(r => r.mobile)));
  }

  async function handleSend() {
    if (!msg.trim() || selected.size === 0) return;
    setSending(true);
    await onSend(msg, recipients.filter(r => selected.has(r.mobile)));
    setSending(false);
    onClose();
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.5)" }} />
      <div ref={ref} style={{ position: "fixed", inset: 0, zIndex: 51, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{
          background: "#fff", borderRadius: 16,
          width: desktop ? "90vw" : "100vw", maxWidth: 960,
          height: desktop ? "88vh" : "95vh",
          boxShadow: "0 12px 60px rgba(0,0,0,0.22)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "18px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: C.text }}>Compose Message</p>
            <button onClick={onClose} style={{ border: "none", background: C.borderLight, borderRadius: 7, padding: 7, cursor: "pointer", color: C.textSub, display: "flex" }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: desktop ? "row" : "column", flex: 1, minHeight: 0, overflow: desktop ? "hidden" : "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, borderRight: desktop ? `1px solid ${C.border}` : "none", borderBottom: desktop ? "none" : `1px solid ${C.border}`, flex: desktop ? 1 : "none" }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>Send To</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {GROUPS.map(g => (
                    <button key={g.value} onClick={() => setGroup(g.value)} style={{
                      padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                      border: `1px solid ${group === g.value ? C.primary : C.border}`,
                      background: group === g.value ? C.primary : "#fff",
                      color: group === g.value ? "#fff" : C.textSub,
                    }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Message</label>
                <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                  Use <code style={{ background: C.borderLight, padding: "1px 4px", borderRadius: 3 }}>{"{name}"}</code> for first name.
                </p>
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  autoFocus
                  placeholder={`Namaskar {name}, your registration is confirmed.`}
                  style={{
                    flex: 1, width: "100%", boxSizing: "border-box",
                    padding: "12px 14px", border: `1px solid ${C.border}`,
                    borderRadius: 10, fontSize: 14, color: C.text,
                    resize: "none", fontFamily: "inherit", lineHeight: 1.8, outline: "none",
                  }}
                />
              </div>

              <Button icon={<Send size={14} />} disabled={!msg.trim() || selected.size === 0 || sending} loading={sending} onClick={handleSend} size="lg">
                Send to {selected.size} recipient{selected.size !== 1 ? "s" : ""}
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: desktop ? 1 : "none", maxHeight: desktop ? "unset" : 280 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Recipients ({selected.size}/{recipients.length})
                </label>
                <button onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.primary }}>
                  {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {rcLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner size={22} color={C.textMuted} /></div>
                ) : recipients.length === 0 ? (
                  <p style={{ margin: 0, padding: "20px 20px", fontSize: 13, color: C.textMuted }}>No registrants in this group.</p>
                ) : recipients.map(r => {
                  const checked = selected.has(r.mobile);
                  return (
                    <div key={r.mobile} onClick={() => toggleOne(r.mobile)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", cursor: "pointer",
                      borderBottom: `1px solid ${C.borderLight}`,
                      background: checked ? "#F0FDF4" : "#fff", transition: "background 0.1s",
                    }}>
                      {checked ? <CheckSquare size={16} color={C.green} /> : <Square size={16} color={C.textMuted} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{r.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{r.mobile}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TemplatesTab() {
  const { toast }                   = useToast();
  const desktop                     = useDesktop();
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [loading, setLoading]       = useState(true);
  const [composeOpen, setCompose]   = useState(false);

  useEffect(() => {
    fetch("/api/wa-template").then(r => r.json()).then(d => { setTemplates(d); setLoading(false); });
  }, []);

  async function handleSave(key: string, body: string, enabled: boolean) {
    await fetch("/api/wa-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, body, enabled }),
    });
    setTemplates(prev => prev.map(t => t.key === key ? { ...t, body, enabled } : t));
    toast("Template saved", "success");
  }

  async function handleSend(msg: string, selected: Recipient[]) {
    const res  = await fetch("/api/wa-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: selected, message: msg }),
    });
    const data = await res.json();
    toast(`Queued ${data.queued} message${data.queued !== 1 ? "s" : ""}`, "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
          Auto-Send Templates
        </p>
        <Button size="sm" icon={<Send size={12} />} onClick={() => setCompose(true)}>
          Compose
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner size={24} color={C.textMuted} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: desktop ? "repeat(3, 1fr)" : "1fr", gap: 16 }}>
          {templates.map(tpl => (
            <TemplateCard key={tpl.key} tpl={tpl} onSave={handleSave} />
          ))}
        </div>
      )}

      {composeOpen && <ComposeModal onClose={() => setCompose(false)} onSend={handleSend} />}
    </div>
  );
}

// ── Settings tab ─────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function SettingsTab() {
  const { toast }                   = useToast();
  const [cfg, setCfg]               = useState<WaConfig>(CFG_DEFAULTS);
  const [saved, setSaved]           = useState<WaConfig>(CFG_DEFAULTS);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    fetch("/api/wa-config")
      .then(r => r.json())
      .then(d => { setCfg(d); setSaved(d); setLoading(false); });
  }, []);

  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);

  function set(key: keyof WaConfig, value: string) {
    setCfg(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    await fetch("/api/wa-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setSaved({ ...cfg });
    setSaving(false);
    toast("Settings saved", "success");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "8px 12px", border: `1px solid ${C.border}`,
    borderRadius: 8, fontSize: 14, color: C.text,
    fontFamily: "inherit", outline: "none", background: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: C.textSub,
    textTransform: "uppercase", letterSpacing: "0.06em",
    display: "block", marginBottom: 6,
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} color={C.textMuted} /></div>;

  const fromHour = parseInt(cfg.wa_hours_from);
  const toHour   = parseInt(cfg.wa_hours_to);
  const intMin   = parseInt(cfg.wa_interval_min);
  const intMax   = parseInt(cfg.wa_interval_max);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>

      {/* Send Interval */}
      <Card padding={0}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Send Interval</p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>
            Random delay between messages — keeps sending human-looking
          </p>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Min (seconds)</label>
            <input
              type="number" min={10} max={intMax - 1}
              value={cfg.wa_interval_min}
              onChange={e => set("wa_interval_min", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Max (seconds)</label>
            <input
              type="number" min={intMin + 1} max={600}
              value={cfg.wa_interval_max}
              onChange={e => set("wa_interval_max", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ padding: "0 20px 14px" }}>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
            Default: 90–120 s · Current: {cfg.wa_interval_min}–{cfg.wa_interval_max} s per message
          </p>
        </div>
      </Card>

      {/* Daily cap */}
      <Card padding={0}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Daily Cap</p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>
            Maximum messages sent per calendar day — resets at midnight
          </p>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <label style={labelStyle}>Messages per day</label>
          <input
            type="number" min={1} max={500}
            value={cfg.wa_daily_cap}
            onChange={e => set("wa_daily_cap", e.target.value)}
            style={{ ...inputStyle, maxWidth: 160 }}
          />
          <p style={{ fontSize: 11, color: C.textMuted, margin: "8px 0 0" }}>Default: 50</p>
        </div>
      </Card>

      {/* Business hours */}
      <Card padding={0}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Business Hours (IST)</p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>
            Bot will only send messages within this window
          </p>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>From</label>
            <select
              value={cfg.wa_hours_from}
              onChange={e => set("wa_hours_from", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {HOURS.filter(h => h < toHour).map(h => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>To</label>
            <select
              value={cfg.wa_hours_to}
              onChange={e => set("wa_hours_to", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {HOURS.filter(h => h > fromHour).map(h => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ padding: "0 20px 14px" }}>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
            Default: 09:00–20:00 · Current: {String(fromHour).padStart(2,"0")}:00–{String(toHour).padStart(2,"0")}:00 IST
          </p>
        </div>
      </Card>

      </div>
      <Button disabled={!dirty} loading={saving} onClick={save}>Save Settings</Button>
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
  const [tab, setTab]            = useState<Tab>("connect");
  const [wa, setWa]              = useState<WaStatus>({ status: "not_started" });
  const [showConnect, setShow]   = useState(false);
  const [rows, setRows]          = useState<Row[]>([]);
  const [logLoading, setLogLoad] = useState(true);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <TabBar active={tab} onChange={setTab} />

      {tab === "connect"   && <ConnectTab wa={wa} onConnect={handleConnect} onShowQr={() => setShow(true)} />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "templates" && <TemplatesTab />}
      {tab === "logs"      && <LogsTab rows={rows} loading={logLoading} onRefresh={loadLog} />}
      {tab === "settings"  && <SettingsTab />}

      {showConnect && <ConnectModal onClose={() => setShow(false)} />}
    </div>
  );
}
