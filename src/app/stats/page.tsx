"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Globe, MapPin, RefreshCw } from "lucide-react";

const GOLD  = "#C9A96E";
const DARK  = "#0E0E0E";
const DIM   = "#1A1A1A";
const SUB   = "rgba(201,169,110,0.55)";
const MUTED = "rgba(201,169,110,0.3)";

type TrackStats = { views: number; viewHits: number; attending: number; rsvp: number; mapClicks: number; mapHits: number };
type Location   = { city: string; region: string; country: string; unique: number; views: number };
type GeoData    = { locations: Location[]; total: number; resolved: number };
type VillageRow = { village: string; district: string; rsvps: number; attending: number };

type Tab = "geo" | "rsvp";
const PER_PAGE = 15;

export default function StatsPageWrapper() {
  return <Suspense><StatsPage /></Suspense>;
}

function StatsPage() {
  const searchParams            = useSearchParams();
  const [tab, setTab]           = useState<Tab>(() => searchParams.get("tab") === "rsvp" ? "rsvp" : "geo");
  const [track, setTrack]       = useState<TrackStats | null>(null);
  const [geo, setGeo]           = useState<GeoData | null>(null);
  const [geoLoading, setGeoLoad] = useState(true);
  const [geoRefresh, setGeoRef]  = useState(false);
  const [geoPage, setGeoPage]    = useState(1);
  const [villages, setVillages]  = useState<VillageRow[]>([]);
  const [rsvpLoading, setRsvpLoad] = useState(true);
  const [rsvpPage, setRsvpPage]    = useState(1);

  async function loadTrack() {
    const res = await fetch("/api/track").catch(() => null);
    if (res?.ok) setTrack(await res.json());
  }

  async function loadGeo(refresh = false) {
    if (refresh) setGeoRef(true); else setGeoLoad(true);
    const res = await fetch("/api/track/geo").catch(() => null);
    if (res?.ok) { setGeo(await res.json()); setGeoPage(1); }
    setGeoLoad(false); setGeoRef(false);
  }

  async function loadVillages() {
    setRsvpLoad(true);
    const res = await fetch("/api/rsvp/villages").catch(() => null);
    if (res?.ok) { const d = await res.json(); setVillages(d.villages ?? []); setRsvpPage(1); }
    setRsvpLoad(false);
  }

  useEffect(() => { loadTrack(); loadGeo(); loadVillages(); }, []);

  const repeat         = track ? track.viewHits - track.views : 0;
  const mapRepeat      = track ? track.mapHits - track.mapClicks : 0;
  const geoSlice    = geo?.locations.slice((geoPage - 1) * PER_PAGE, geoPage * PER_PAGE) ?? [];
  const maxGeo      = geo?.locations[0]?.unique ?? 1;
  const rsvpSlice   = villages.slice((rsvpPage - 1) * PER_PAGE, rsvpPage * PER_PAGE);
  const maxRsvp     = villages[0]?.rsvps ?? 1;
  const totalRsvps  = villages.reduce((s, v) => s + v.rsvps, 0);
  const totalAtt    = villages.reduce((s, v) => s + v.attending, 0);

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: "#E8D5B0", fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 16px 64px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .gold-text {
          background: linear-gradient(90deg, #9A7840 20%, #C9A96E 40%, #E8D5B0 50%, #C9A96E 60%, #9A7840 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer 4s linear infinite;
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${MUTED})` }} />
            <span style={{ color: GOLD, fontSize: 16 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${MUTED}, transparent)` }} />
          </div>
          <h1 className="gold-text" style={{ fontSize: "clamp(1.6rem,5vw,2.4rem)", fontWeight: 800, margin: "0 0 6px", letterSpacing: "0.04em" }}>
            প্রিয়বোধী মহোৎসব
          </h1>
          <p style={{ fontSize: 13, color: SUB, margin: 0 }}>Live attendance &amp; visitor statistics</p>
        </div>

        {/* Stat pills */}
        {track && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
            {[
              { label: "Unique Views",        value: track.views,     tab: "geo"  as Tab },
              { label: "Repeat Views",        value: repeat,          tab: "geo"  as Tab },
              { label: "Map Clicks (Unique)", value: track.mapClicks, tab: "geo"  as Tab },
              { label: "Map Clicks (Repeat)", value: mapRepeat,       tab: "geo"  as Tab },
              { label: "Attending",           value: track.attending, tab: "rsvp" as Tab },
              { label: "RSVP Registrations",  value: track.rsvp,      tab: "rsvp" as Tab },
            ].map(({ label, value, tab: t }) => (
              <button key={label} onClick={() => { setTab(t); document.getElementById("table-section")?.scrollIntoView({ behavior: "smooth" }); }} style={{
                background: DIM, border: `1px solid rgba(201,169,110,0.18)`,
                borderRadius: 14, padding: "16px 18px", textAlign: "center",
                cursor: "pointer", transition: "border-color 0.15s",
                width: "100%",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,169,110,0.45)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(201,169,110,0.18)")}
              >
                <p style={{ fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 800, color: GOLD, margin: 0, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: SUB, margin: "6px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: MUTED }} />
          <span style={{ fontSize: 11, color: SUB, textTransform: "uppercase", letterSpacing: "0.15em", whiteSpace: "nowrap" }}>Visitor Locations</span>
          <div style={{ flex: 1, height: 1, background: MUTED }} />
        </div>

        {/* Table section anchor */}
        <div id="table-section" />

        {/* Toggle */}
        <div style={{ display: "flex", gap: 3, padding: 4, background: DIM, borderRadius: 10, width: "fit-content", border: `1px solid rgba(201,169,110,0.18)` }}>
          {([
            { key: "geo"  as Tab, label: "IP Geo",        icon: <Globe size={13} />  },
            { key: "rsvp" as Tab, label: "RSVP Villages", icon: <MapPin size={13} /> },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer", transition: "all 0.15s",
              background: tab === t.key ? "rgba(201,169,110,0.15)" : "transparent",
              color: tab === t.key ? GOLD : SUB,
              boxShadow: tab === t.key ? `0 0 0 1px rgba(201,169,110,0.3)` : "none",
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── IP Geo ── */}
        {tab === "geo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              {geo && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "Unique IPs",   value: geo.total },
                    { label: "Resolved",     value: geo.resolved },
                    { label: "Cities",       value: geo.locations.length },
                  ].map(({ label, value }) => <StatChip key={label} label={label} value={value} />)}
                </div>
              )}
              <button onClick={() => loadGeo(true)} disabled={geoRefresh} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                borderRadius: 7, fontSize: 11, fontWeight: 600, border: `1px solid ${MUTED}`,
                background: "transparent", color: SUB, cursor: "pointer", opacity: geoRefresh ? 0.5 : 1,
              }}>
                <RefreshCw size={11} style={{ animation: geoRefresh ? "spin 0.8s linear infinite" : "none" }} />
                Refresh
              </button>
            </div>

            <LocationTable
              header={["Location", "Dist.", "Unique", "Repeat", "Views"]}
              loading={geoLoading}
              empty={<EmptyState icon={<Globe size={32} />} text="No location data yet" />}
              rows={geoSlice.map((loc, i) => ({
                key: i,
                primary: loc.city,
                secondary: loc.region + (loc.country !== "India" ? ` · ${loc.country}` : ""),
                bar: loc.unique / maxGeo,
                col1: loc.unique,
                col2: loc.views - loc.unique,
                col3: loc.views,
              }))}
              page={geoPage} total={geo?.locations.length ?? 0} perPage={PER_PAGE} onPage={setGeoPage}
            />
            <p style={{ fontSize: 11, color: MUTED, textAlign: "center" }}>
              Geolocation is approximate — carrier IPs may show gateway city, not actual location.
            </p>
          </div>
        )}

        {/* ── RSVP Villages ── */}
        {tab === "rsvp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!rsvpLoading && villages.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "Villages / Areas", value: villages.length },
                  { label: "Total RSVPs",      value: totalRsvps       },
                  { label: "Total Attending",  value: totalAtt         },
                ].map(({ label, value }) => <StatChip key={label} label={label} value={value} />)}
              </div>
            )}
            <LocationTable
              header={["Village / Area", "Dist.", "RSVPs", "Attending", ""]}
              loading={rsvpLoading}
              empty={<EmptyState icon={<MapPin size={32} />} text="No registrations yet" />}
              rows={rsvpSlice.map((v, i) => ({
                key: i, primary: v.village, secondary: v.district,
                bar: v.rsvps / maxRsvp, col1: v.rsvps, col2: v.attending, col3: undefined,
              }))}
              page={rsvpPage} total={villages.length} perPage={PER_PAGE} onPage={setRsvpPage}
            />
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 12, color: MUTED, marginTop: 8 }}>
          প্রিয়বোধী মহোৎসব · 20 December 2026 · Alinagar Playground, Bhatar
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7, padding: "5px 12px",
      borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: "rgba(201,169,110,0.08)", border: `1px solid rgba(201,169,110,0.22)`,
    }}>
      <span style={{ color: GOLD }}>{value}</span>
      <span style={{ color: SUB, fontWeight: 400 }}>{label}</span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0", color: MUTED }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, opacity: 0.5 }}>{icon}</div>
      <p style={{ fontSize: 13, margin: 0, color: SUB }}>{text}</p>
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 560px)");
    setMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, []);
  return mobile;
}

function LocationTable({ header, loading, empty, rows, page, total, perPage, onPage }: {
  header: [string, string, string, string, string];
  loading: boolean;
  empty: React.ReactNode;
  rows: { key: number; primary: string; secondary: string; bar: number; col1: number; col2: number; col3?: number }[];
  page: number; total: number; perPage: number; onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  const hasCol3    = rows.some(r => r.col3 !== undefined);
  const mobile     = useIsMobile();
  const grid       = hasCol3 ? "1fr 100px 70px 70px 70px" : "1fr 100px 70px 70px";

  return (
    <div style={{ background: DIM, borderRadius: 14, border: `1px solid rgba(201,169,110,0.15)`, overflow: "hidden" }}>
      {loading ? (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 36, borderRadius: 6, background: "rgba(201,169,110,0.06)" }} />
          ))}
        </div>
      ) : rows.length === 0 ? empty : (
        <>
          {mobile ? (
            /* ── Mobile card layout ── */
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map((r, i) => (
                <div key={r.key} style={{
                  padding: "12px 16px",
                  borderBottom: i < rows.length - 1 ? `1px solid rgba(201,169,110,0.08)` : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(201,169,110,0.02)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#E8D5B0", margin: 0 }}>{r.primary}</p>
                      {r.secondary && <p style={{ fontSize: 11, color: SUB, margin: "2px 0 0" }}>{r.secondary}</p>}
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: GOLD, flexShrink: 0 }}>{r.col1}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: "rgba(201,169,110,0.12)", overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${r.bar * 100}%`, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)` }} />
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>{header[2]} <strong style={{ color: SUB }}>{r.col1}</strong></span>
                    <span style={{ fontSize: 11, color: MUTED }}>{header[3]} <strong style={{ color: SUB }}>{r.col2}</strong></span>
                    {hasCol3 && <span style={{ fontSize: 11, color: MUTED }}>{header[4]} <strong style={{ color: SUB }}>{r.col3 ?? 0}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Desktop grid layout ── */
            <>
              <div style={{
                display: "grid", gridTemplateColumns: grid, gap: 16,
                padding: "10px 16px", fontSize: 10, fontWeight: 700,
                color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em",
                borderBottom: `1px solid rgba(201,169,110,0.1)`, background: "rgba(201,169,110,0.04)",
              }}>
                <span>{header[0]}</span>
                <span style={{ textAlign: "right" }}>{header[1]}</span>
                <span style={{ textAlign: "right" }}>{header[2]}</span>
                <span style={{ textAlign: "right" }}>{header[3]}</span>
                {hasCol3 && <span style={{ textAlign: "right" }}>{header[4]}</span>}
              </div>
              {rows.map((r, i) => (
                <div key={r.key} style={{
                  display: "grid", gridTemplateColumns: grid, gap: 16,
                  alignItems: "center", padding: "11px 16px",
                  borderBottom: i < rows.length - 1 ? `1px solid rgba(201,169,110,0.08)` : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(201,169,110,0.02)",
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#E8D5B0", margin: 0 }}>{r.primary}</p>
                    {r.secondary && <p style={{ fontSize: 11, color: SUB, margin: "2px 0 0" }}>{r.secondary}</p>}
                  </div>
                  <div style={{ padding: "0 4px" }}>
                    <div style={{ height: 4, borderRadius: 99, background: "rgba(201,169,110,0.12)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${r.bar * 100}%`, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, textAlign: "right" }}>{r.col1}</span>
                  <span style={{ fontSize: 12, color: SUB, textAlign: "right" }}>{r.col2}</span>
                  {hasCol3 && <span style={{ fontSize: 12, color: MUTED, textAlign: "right" }}>{r.col3 ?? 0}</span>}
                </div>
              ))}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid rgba(201,169,110,0.1)` }}>
              <span style={{ fontSize: 11, color: MUTED }}>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => onPage(p)} style={{
                    width: 28, height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${p === page ? "rgba(201,169,110,0.5)" : "rgba(201,169,110,0.15)"}`,
                    background: p === page ? "rgba(201,169,110,0.15)" : "transparent",
                    color: p === page ? GOLD : MUTED, cursor: "pointer",
                  }}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
