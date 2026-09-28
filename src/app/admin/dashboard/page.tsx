"use client";

import { useEffect, useState } from "react";
import { Eye, MousePointerClick, MapPin, UserCheck, ClipboardCheck } from "lucide-react";

type Stats = { views: number; viewHits: number; attending: number; mapClicks: number; rsvp: number };

const CARDS = (s: Stats) => [
  { label: "Total Page Views",    value: s.viewHits,    sub: `${s.views} unique visitors`,       icon: Eye,              accent: "#6366F1", bg: "#EEF2FF" },
  { label: "Attending",           value: s.attending,   sub: "Clicked 'I will attend'",           icon: UserCheck,        accent: "#10B981", bg: "#ECFDF5" },
  { label: "RSVP Registrations",  value: s.rsvp,        sub: "Form submissions",                  icon: ClipboardCheck,   accent: "#F59E0B", bg: "#FFFBEB" },
  { label: "Map Clicks",          value: s.mapClicks,   sub: "Venue location taps",               icon: MapPin,           accent: "#8B5CF6", bg: "#F5F3FF" },
  { label: "Engagement Rate",     value: s.viewHits > 0 ? Math.round((s.attending / s.viewHits) * 100) : 0,
                                  sub: "Attendees vs total views",                                icon: MousePointerClick, accent: "#EC4899", bg: "#FDF2F8", suffix: "%" },
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/track").then(r => r.json()),
      fetch("/api/rsvp").then(r => r.json()),
    ]).then(([s, rsvp]) => setStats({ ...s, rsvp: (rsvp?.entries ?? rsvp ?? []).length }));
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>{today}</p>
      </div>

      {/* Event info banner */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 11, color: "#C9A96E", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Upcoming Event</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 4 }}>প্রিয়বোধী মহোৎসব</p>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>20 December 2026 · Alinagar Playground, Bhatar</p>
        </div>
        <div style={{
          background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.3)",
          borderRadius: 10, padding: "8px 16px", textAlign: "center",
        }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#C9A96E", lineHeight: 1 }}>
            {Math.max(0, Math.ceil((new Date("2026-12-20").getTime() - Date.now()) / 86400000))}
          </p>
          <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>days left</p>
        </div>
      </div>

      {/* Metric cards */}
      {!stats ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 20, height: 96, border: "1px solid #E8ECF0" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {CARDS(stats).map(({ label, value, sub, icon: Icon, accent, bg, suffix }) => (
            <div key={label} style={{
              background: "#fff", borderRadius: 14, padding: 20,
              border: "1px solid #E8ECF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ background: bg, borderRadius: 8, padding: 8 }}>
                  <Icon size={16} color={accent} />
                </div>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
                {value}{suffix ?? ""}
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginTop: 6 }}>{label}</p>
              <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
