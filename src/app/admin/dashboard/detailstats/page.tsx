"use client";

import { useEffect, useState } from "react";
import { Globe, RefreshCw, MapPin } from "lucide-react";
import { C, Card, PageHeader, Skeleton, Pagination } from "../ui";

type Location   = { city: string; region: string; country: string; unique: number; views: number };
type GeoData    = { locations: Location[]; total: number; resolved: number };
type RsvpEntry  = { village: string | null; district: string | null; totalAttending: number | null };
type VillageRow = { village: string; district: string; rsvps: number; attending: number };

type Tab = "geo" | "rsvp";

const PER_PAGE = 15;

export default function DetailStatsPage() {
  const [tab, setTab]              = useState<Tab>("geo");

  const [geo, setGeo]              = useState<GeoData | null>(null);
  const [geoLoading, setGeoLoad]   = useState(true);
  const [geoRefresh, setGeoRef]    = useState(false);
  const [geoPage, setGeoPage]      = useState(1);

  const [villages, setVillages]    = useState<VillageRow[]>([]);
  const [rsvpLoading, setRsvpLoad] = useState(true);
  const [rsvpPage, setRsvpPage]    = useState(1);

  async function loadGeo(refresh = false) {
    if (refresh) setGeoRef(true); else setGeoLoad(true);
    try {
      const res = await fetch("/api/track/geo");
      if (res.ok) { setGeo(await res.json()); setGeoPage(1); }
    } finally { setGeoLoad(false); setGeoRef(false); }
  }

  async function loadRsvp() {
    setRsvpLoad(true);
    try {
      const res = await fetch("/api/rsvp");
      if (!res.ok) return;
      const { entries }: { entries: RsvpEntry[] } = await res.json();
      const map = new Map<string, VillageRow>();
      for (const e of entries) {
        const village  = e.village?.trim() || "Unknown";
        const district = e.district?.trim() || "";
        const key = village.toLowerCase();
        const row = map.get(key);
        if (row) { row.rsvps++; row.attending += e.totalAttending ?? 0; }
        else map.set(key, { village, district, rsvps: 1, attending: e.totalAttending ?? 0 });
      }
      setVillages(Array.from(map.values()).sort((a, b) => b.rsvps - a.rsvps));
      setRsvpPage(1);
    } finally { setRsvpLoad(false); }
  }

  useEffect(() => { loadGeo(); loadRsvp(); }, []);

  const geoSlice     = geo?.locations.slice((geoPage - 1) * PER_PAGE, geoPage * PER_PAGE) ?? [];
  const maxGeo       = geo?.locations[0]?.unique ?? 1;

  const rsvpSlice    = villages.slice((rsvpPage - 1) * PER_PAGE, rsvpPage * PER_PAGE);
  const maxRsvp      = villages[0]?.rsvps ?? 1;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "geo",  label: "IP Geo",        icon: <Globe size={13} />  },
    { key: "rsvp", label: "RSVP Villages", icon: <MapPin size={13} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header + toggle in one row to reduce gap */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <PageHeader
          title="Location Stats"
          sub={tab === "geo" ? "Visitor locations resolved from IP addresses" : "Villages from RSVP registrations"}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Toggle */}
          <div style={{ display: "flex", gap: 3, padding: 3, background: C.bg, borderRadius: 9, border: `1px solid ${C.border}` }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: tab === t.key ? C.surface : "transparent",
                  color: tab === t.key ? C.text : C.textMuted,
                  boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
          {/* Refresh — only for geo */}
          {tab === "geo" && (
            <button
              onClick={() => loadGeo(true)}
              disabled={geoRefresh}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${C.border}`, background: C.surface, color: C.textSub,
                cursor: geoRefresh ? "not-allowed" : "pointer", opacity: geoRefresh ? 0.6 : 1,
              }}
            >
              <RefreshCw size={13} style={{ animation: geoRefresh ? "spin 0.8s linear infinite" : "none" }} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* ── IP Geo tab ─────────────────────────────────────────────────────── */}
      {tab === "geo" && (
        <>
          {geo && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Unique IPs",   value: geo.total },
                { label: "Resolved",     value: geo.resolved },
                { label: "Cities Found", value: geo.locations.length },
              ].map(({ label, value }) => (
                <Pill key={label} label={label} value={value} />
              ))}
            </div>
          )}

          <Card>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
              Top Locations by Unique Visitors
            </p>
            {geoLoading ? <SkeletonRows /> : !geo || geo.locations.length === 0 ? (
              <Empty icon={<Globe size={36} />} text="No location data yet" />
            ) : (
              <>
                <TableLayout
                  header={["Location", "Distribution", "Unique", "Repeat", "Total Views"]}
                  rows={geoSlice.map((loc, i) => ({
                    key: i, primary: loc.city,
                    secondary: loc.region + (loc.country !== "India" ? ` · ${loc.country}` : ""),
                    bar: loc.unique / maxGeo,
                    col1: loc.unique,
                    col2: loc.views - loc.unique,
                    col3: loc.views,
                  }))}
                />
                <Pagination page={geoPage} total={geo.locations.length} perPage={PER_PAGE} onChange={setGeoPage} />
              </>
            )}
          </Card>

          {geo && (
            <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: -4 }}>
              IP geolocation is approximate. Mobile carrier IPs may resolve to the carrier&apos;s gateway city.
            </p>
          )}
        </>
      )}

      {/* ── RSVP Villages tab ──────────────────────────────────────────────── */}
      {tab === "rsvp" && (
        <>
          {!rsvpLoading && villages.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Villages / Areas", value: villages.length },
                { label: "Total RSVPs",      value: villages.reduce((s, v) => s + v.rsvps, 0) },
                { label: "Total Attending",  value: villages.reduce((s, v) => s + v.attending, 0) },
              ].map(({ label, value }) => (
                <Pill key={label} label={label} value={value} />
              ))}
            </div>
          )}

          <Card>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
              Villages / Areas by RSVP Count
            </p>
            {rsvpLoading ? <SkeletonRows /> : villages.length === 0 ? (
              <Empty icon={<MapPin size={36} />} text="No RSVP data yet" />
            ) : (
              <>
                <TableLayout
                  header={["Village / Area", "Distribution", "RSVPs", "Attending"]}
                  rows={rsvpSlice.map((v, i) => ({
                    key: i, primary: v.village, secondary: v.district,
                    bar: v.rsvps / maxRsvp, col1: v.rsvps, col2: v.attending,
                  }))}
                />
                <Pagination page={rsvpPage} total={villages.length} perPage={PER_PAGE} onChange={setRsvpPage} />
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Pill({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.text,
    }}>
      <span style={{ color: C.gold }}>{value}</span>
      <span style={{ color: C.textMuted, fontWeight: 400 }}>{label}</span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={40} />)}
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0", color: C.textMuted }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}

function TableLayout({ header, rows }: {
  header: [string, string, string, string] | [string, string, string, string, string];
  rows: { key: number; primary: string; secondary: string; bar: number; col1: number; col2: number; col3?: number }[];
}) {
  const extra = header.length === 5;
  const grid  = extra ? "1fr 140px 90px 90px 90px" : "1fr 140px 90px 90px";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{
        display: "grid", gridTemplateColumns: grid,
        padding: "6px 10px", gap: 16, fontSize: 11, fontWeight: 700,
        color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <span>{header[0]}</span>
        <span style={{ textAlign: "right" }}>{header[1]}</span>
        <span style={{ textAlign: "right" }}>{header[2]}</span>
        <span style={{ textAlign: "right" }}>{header[3]}</span>
        {extra && <span style={{ textAlign: "right" }}>{header[4]}</span>}
      </div>
      {rows.map((r, i) => (
        <div key={r.key} style={{
          display: "grid", gridTemplateColumns: grid,
          alignItems: "center", padding: "9px 10px", gap: 16,
          borderBottom: `1px solid ${C.borderLight}`,
          background: i % 2 === 0 ? "transparent" : C.bg,
          borderRadius: 6,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.primary}</span>
            {r.secondary && <span style={{ fontSize: 11, color: C.textMuted }}>{r.secondary}</span>}
          </div>
          <div style={{ padding: "0 8px" }}>
            <div style={{ height: 6, borderRadius: 99, background: C.borderLight, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, width: `${r.bar * 100}%`,
                background: `linear-gradient(90deg, ${C.gold}, ${C.orange})`,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textAlign: "right" }}>{r.col1}</span>
          <span style={{ fontSize: 12, color: C.textMuted, textAlign: "right" }}>{r.col2}</span>
          {extra && <span style={{ fontSize: 12, color: C.textMuted, textAlign: "right" }}>{r.col3 ?? 0}</span>}
        </div>
      ))}
    </div>
  );
}
