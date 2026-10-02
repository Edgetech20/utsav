"use client";

import { useEffect, useState } from "react";
import { Eye, MousePointerClick, MapPin, UserCheck, ClipboardCheck } from "lucide-react";
import { C, Card, StatCard, Skeleton } from "./ui";

type Stats = { views: number; viewHits: number; attending: number; mapClicks: number; rsvp: number };

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/track").then(r => r.json()),
      fetch("/api/rsvp").then(r => r.json()),
    ]).then(([s, rsvp]) => setStats({ ...s, rsvp: (rsvp?.entries ?? rsvp ?? []).length }));
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const daysLeft = Math.max(0, Math.ceil((new Date("2026-12-20").getTime() - Date.now()) / 86400000));

  const CARDS = stats ? [
    { label: "Total Page Views",   value: stats.viewHits, sub: `${stats.views} unique visitors`,     icon: <Eye size={16} />,              accent: C.blue,   accentBg: C.blueBg },
    { label: "Attending",          value: stats.attending, sub: "Clicked 'I will attend'",            icon: <UserCheck size={16} />,        accent: C.green,  accentBg: C.greenBg },
    { label: "RSVP Registrations", value: stats.rsvp,     sub: "Form submissions",                   icon: <ClipboardCheck size={16} />,   accent: C.orange, accentBg: C.orangeBg },
    { label: "Map Clicks",         value: stats.mapClicks, sub: "Venue location taps",               icon: <MapPin size={16} />,           accent: C.purple, accentBg: C.purpleBg },
    { label: "Engagement Rate",    value: stats.viewHits > 0 ? Math.round((stats.attending / stats.viewHits) * 100) : 0,
                                   sub: "Attendees vs total views", suffix: "%",                     icon: <MousePointerClick size={16} />, accent: C.pink,   accentBg: C.pinkBg },
  ] : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{today}</p>
      </div>

      {/* Event banner */}
      <Card style={{
        background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
        border: "none", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <p style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
            Upcoming Event
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "6px 0 2px" }}>প্রিয়বোধী মহোৎসব</p>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>20 December 2026 · Alinagar Playground, Bhatar</p>
        </div>
        <div style={{
          background: "rgba(201,169,110,0.12)", border: `1px solid ${C.goldBorder}`,
          borderRadius: 12, padding: "12px 20px", textAlign: "center", flexShrink: 0,
        }}>
          <p style={{ fontSize: 30, fontWeight: 900, color: C.gold, lineHeight: 1, margin: 0 }}>{daysLeft}</p>
          <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>days left</p>
        </div>
      </Card>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 16, marginBottom: 24 }}>
        {CARDS ? (
          CARDS.map(c => <StatCard key={c.label} {...c} />)
        ) : (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Skeleton width={36} height={36} radius={9} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton height={28} width="60%" />
                <Skeleton height={12} width="80%" />
                <Skeleton height={10} width="50%" />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick info row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
            Event Details
          </p>
          {[
            ["Date",     "20 December 2026"],
            ["Venue",    "Alinagar Playground"],
            ["Location", "Bhatar, West Bengal"],
            ["Days left",`${daysLeft} days`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.borderLight}` }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
            </div>
          ))}
        </Card>

        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
            Quick Links
          </p>
          {[
            { label: "RSVP Registrations",   href: "/admin/dashboard/rsvp" },
            { label: "Vehicle Management",    href: "/admin/dashboard/vehicles" },
            { label: "Accommodation",         href: "/admin/dashboard/accommodation" },
            { label: "Feedback Responses",    href: "/admin/dashboard/feedback" },
            { label: "QR Code Generator",     href: "/admin/dashboard/qr" },
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
