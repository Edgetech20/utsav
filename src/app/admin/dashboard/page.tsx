"use client";

import { useEffect, useState } from "react";
import { Eye, Users, MousePointerClick, MapPin, UserCheck, ClipboardCheck } from "lucide-react";
import { C, Card, StatCard, Skeleton, useDesktop } from "./ui";

// ── Types ─────────────────────────────────────────────────────────────────────
type TrackStats  = { views: number; viewHits: number; attending: number; mapClicks: number; mapHits: number };
type Entry       = { submittedAt: string };
type LogEntry    = { status: string; type: string };
type DaySeries   = { day: string; total: number; unique: number; repeat: number };
type FormSummary = { id: number; name: string; responseCount: number };

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function LineChart({ series, labels }: {
  series: { label: string; data: number[]; color: string }[];
  labels: string[];
}) {
  const W = 600, H = 180, PAD = { t: 10, r: 10, b: 36, l: 32 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const n      = labels.length;
  const maxVal = Math.max(1, ...series.flatMap(s => s.data));

  function points(data: number[]) {
    return data.map((v, i) => {
      const x = PAD.l + (i / (n - 1)) * innerW;
      const y = PAD.t + innerH - (v / maxVal) * innerH;
      return `${x},${y}`;
    }).join(" ");
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = PAD.t + innerH * (1 - f);
        return (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke={C.border} strokeWidth={1} strokeDasharray={f === 0 ? "0" : "3 3"} />
            <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill={C.textMuted}>{Math.round(maxVal * f)}</text>
          </g>
        );
      })}
      {/* X labels */}
      {labels.map((l, i) => (
        i % 2 === 0 && (
          <text key={l} x={PAD.l + (i / (n - 1)) * innerW} y={H - PAD.b + 14} textAnchor="middle" fontSize={9} fill={C.textMuted}>{l}</text>
        )
      ))}
      {/* Lines + dots */}
      {series.map(s => (
        <g key={s.label}>
          <polyline points={points(s.data)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {s.data.map((v, i) => {
            const x = PAD.l + (i / (n - 1)) * innerW;
            const y = PAD.t + innerH - (v / maxVal) * innerH;
            return <circle key={i} cx={x} cy={y} r={3} fill={s.color} />;
          })}
        </g>
      ))}
    </svg>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data, labels, colors, series }: {
  data: number[][];   // [seriesIdx][dayIdx]
  labels: string[];
  colors: string[];
  series: string[];
}) {
  const W = 600, H = 180, PAD = { t: 10, r: 10, b: 36, l: 32 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const n      = labels.length;
  const maxVal = Math.max(1, ...data.flat());
  const groupW = innerW / n;
  const barW   = Math.max(4, (groupW * 0.7) / data.length);
  const gap    = (groupW - barW * data.length) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Y grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = PAD.t + innerH * (1 - f);
        return (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke={C.border} strokeWidth={1} />
            <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill={C.textMuted}>
              {Math.round(maxVal * f)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {labels.map((label, di) => (
        <g key={label}>
          {data.map((series, si) => {
            const x = PAD.l + di * groupW + gap + si * barW;
            const h = (series[di] / maxVal) * innerH;
            const y = PAD.t + innerH - h;
            return (
              <rect
                key={si}
                x={x} y={y} width={barW - 1} height={Math.max(h, 1)}
                rx={2} fill={colors[si]} opacity={0.85}
              />
            );
          })}
          <text
            x={PAD.l + di * groupW + groupW / 2}
            y={H - PAD.b + 14}
            textAnchor="middle" fontSize={9} fill={C.textMuted}
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── SVG Donut Chart ───────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  const R = 54, r = 32, cx = 70, cy = 70;
  let angle = -Math.PI / 2;

  const arcs = segments.map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    angle += sweep;
    const x2 = cx + R * Math.cos(angle), y2 = cy + R * Math.sin(angle);
    const xi1 = cx + r * Math.cos(angle - sweep), yi1 = cy + r * Math.sin(angle - sweep);
    const xi2 = cx + r * Math.cos(angle), yi2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...seg, d: `M${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} L${xi2},${yi2} A${r},${r},0,${large},0,${xi1},${yi1} Z` };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <svg viewBox="0 0 140 140" style={{ width: 100 }}>
        {total === 0
          ? <circle cx={cx} cy={cy} r={R} fill={C.borderLight} />
          : arcs.map(a => <path key={a.label} d={a.d} fill={a.color} />)
        }
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={700} fill={C.text}>{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill={C.textMuted}>total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.textSub, flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted, minWidth: 32, textAlign: "right" }}>
              {Math.round((s.value / (total || 1)) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Delivery Bar ──────────────────────────────────────────────────────────────
function DeliveryBar({ sent, failed, pending }: { sent: number; failed: number; pending: number }) {
  const total = sent + failed + pending || 1;
  const bars = [
    { label: "Sent",    value: sent,    color: C.green  },
    { label: "Failed",  value: failed,  color: C.red    },
    { label: "Pending", value: pending, color: C.orange },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Stacked bar */}
      <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: C.borderLight }}>
        {bars.map(b => (
          <div key={b.label} style={{ width: `${(b.value / total) * 100}%`, background: b.color, transition: "width 0.5s ease" }} />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {bars.map(b => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
            <span style={{ fontSize: 12, color: C.textSub }}>{b.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function last14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
}
function countByDay(entries: Entry[], days: string[]) {
  const map = new Map(days.map(d => [d, 0]));
  entries.forEach(e => {
    const day = e.submittedAt.slice(0, 10);
    if (map.has(day)) map.set(day, (map.get(day) ?? 0) + 1);
  });
  return days.map(d => map.get(d) ?? 0);
}
function sectionLabel(s: string) {
  return { label: s, title: s };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const desktop = useDesktop();
  const [track,      setTrack]      = useState<TrackStats | null>(null);
  const [rsvp,       setRsvp]       = useState<Entry[]>([]);
  const [waLog,      setWaLog]      = useState<LogEntry[]>([]);
  const [viewSeries, setViewSeries] = useState<DaySeries[]>([]);
  const [forms,      setForms]      = useState<FormSummary[]>([]);

  useEffect(() => {
    function tick() {
      Promise.all([
        fetch("/api/track").then(r => r.json()),
        fetch("/api/rsvp").then(r => r.json()),
        fetch("/api/wa-log").then(r => r.json()),
        fetch("/api/track/series").then(r => r.json()),
        fetch("/api/forms").then(r => r.json()),
      ]).then(([t, rv, wl, vs, fm]) => {
        setTrack(t);
        setRsvp(rv?.entries ?? []);
        setWaLog(Array.isArray(wl) ? wl : []);
        setViewSeries(Array.isArray(vs) ? vs : []);
        setForms(Array.isArray(fm) ? fm : []);
      }).catch(() => {});
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const daysLeft = Math.max(0, Math.ceil((new Date("2026-12-20").getTime() - Date.now()) / 86400000));
  const days     = last14Days();
  const dayLabels = days.map(d => `${parseInt(d.slice(8))}/${parseInt(d.slice(5, 7))}`);

  // Chart data
  const chartData = [
    countByDay(rsvp, days),
  ];

  // WA delivery
  const waSent    = waLog.filter(l => l.status === "sent").length;
  const waFailed  = waLog.filter(l => l.status === "failed").length;
  const waPending = waLog.filter(l => l.status === "pending").length;

  // Stat cards
  const CARDS = track ? [
    { label: "Unique Visitors",    value: track.views,     sub: "Distinct IPs",               icon: <Users size={16} />,            accent: C.blue,   accentBg: C.blueBg   },
    { label: "Total Page Views",   value: track.viewHits,  sub: `${track.views} unique`,      icon: <Eye size={16} />,              accent: C.purple, accentBg: C.purpleBg },
    { label: "Attending",          value: track.attending, sub: "Clicked 'I will attend'",    icon: <UserCheck size={16} />,        accent: C.green,  accentBg: C.greenBg  },
    { label: "RSVP Forms",         value: rsvp.length,     sub: "Confirmed registrations",    icon: <ClipboardCheck size={16} />,   accent: C.orange, accentBg: C.orangeBg },
    { label: "Map Clicks",         value: track.mapClicks, sub: "Venue taps",                 icon: <MapPin size={16} />,           accent: C.pink,   accentBg: C.pinkBg   },
    { label: "Engagement",
      value: track.viewHits > 0 ? Math.round((track.attending / track.viewHits) * 100) : 0,
      sub: "Attendees / views", suffix: "%",                                                   icon: <MousePointerClick size={16} />, accent: C.gold,  accentBg: C.goldBg   },
  ] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Event banner */}
      <Card style={{
        background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
        border: "none",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <p style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Upcoming Event</p>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "6px 0 2px" }}>প্রিয়বোধী মহোৎসব</p>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>20 December 2026 · Alinagar Playground, Bhatar</p>
        </div>
        <div style={{ background: "rgba(201,169,110,0.12)", border: `1px solid ${C.goldBorder}`, borderRadius: 12, padding: "12px 20px", textAlign: "center", flexShrink: 0 }}>
          <p style={{ fontSize: 30, fontWeight: 900, color: C.gold, lineHeight: 1, margin: 0 }}>{daysLeft}</p>
          <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>days left</p>
        </div>
      </Card>

      {/* Stat cards — 6 including separate Unique Visitors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
        {CARDS ? CARDS.map(c => <StatCard key={c.label} {...c} />) : (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Skeleton width={36} height={36} radius={9} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton height={28} width="60%" />
                <Skeleton height={12} width="80%" />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: desktop ? "1fr 1fr" : "1fr", gap: 16 }}>

        {/* Visitor line chart */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
              Views — Last 14 Days
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            {[["Total", C.blue], ["Unique", C.green], ["Repeat", C.orange]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 16, height: 2, background: c as string, borderRadius: 1 }} />
                <span style={{ fontSize: 11, color: C.textMuted }}>{l}</span>
              </div>
            ))}
          </div>
          <LineChart
            labels={viewSeries.map(d => `${parseInt(d.day.slice(8))}/${parseInt(d.day.slice(5, 7))}`)}
            series={[
              { label: "Total",  data: viewSeries.map(d => d.total),  color: C.blue   },
              { label: "Unique", data: viewSeries.map(d => d.unique), color: C.green  },
              { label: "Repeat", data: viewSeries.map(d => d.repeat), color: C.orange },
            ]}
          />
        </Card>

        {/* Registration trend */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>
            Registrations — Last 14 Days
          </p>
          <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
            {[["RSVP", C.orange]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />
                <span style={{ fontSize: 11, color: C.textMuted }}>{l}</span>
              </div>
            ))}
          </div>
          <BarChart
            data={chartData}
            labels={dayLabels}
            colors={[C.orange]}
            series={["RSVP"]}
          />
        </Card>


      </div>

      {/* WhatsApp delivery + Quick info */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>

        {/* WA Delivery */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
            WhatsApp Delivery
          </p>
          <DeliveryBar sent={waSent} failed={waFailed} pending={waPending} />
        </Card>

        {/* Registration breakdown donut */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 16px" }}>
            Registration Breakdown
          </p>
          <DonutChart segments={[
            { label: "RSVP", value: rsvp.length, color: C.orange },
            ...forms.map((f, i) => ({
              label: f.name,
              value: f.responseCount,
              color: [C.blue, C.green, C.purple, C.pink, C.gold, C.red][i % 6],
            })),
          ]} />
        </Card>

        {/* Event Details */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
            Event Details
          </p>
          {[
            ["Date",     "20 December 2026"],
            ["Venue",    "Alinagar Playground"],
            ["Location", "Bhatar, West Bengal"],
            ["Days left", `${daysLeft} days`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.borderLight}` }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
            </div>
          ))}
        </Card>

        {/* Quick Links */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
            Quick Links
          </p>
          {[
            { label: "RSVP Registrations",  href: "/admin/dashboard/rsvp"          },
            { label: "Vehicle Management",   href: "/admin/dashboard/vehicles"      },
            { label: "Accommodation",        href: "/admin/dashboard/accommodation" },
            { label: "Feedback Responses",   href: "/admin/dashboard/feedback"      },
            { label: "Message Templates",    href: "/admin/dashboard/templates"     },
          ].map(({ label, href }) => (
            <a key={href} href={href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 0", borderBottom: `1px solid ${C.borderLight}`,
              textDecoration: "none", color: C.text,
            }}>
              <span style={{ fontSize: 12 }}>{label}</span>
              <span style={{ fontSize: 16, color: C.textMuted }}>›</span>
            </a>
          ))}
        </Card>

      </div>
    </div>
  );
}
