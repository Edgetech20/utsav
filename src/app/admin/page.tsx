// Public page — stats only, no auth required
export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:2000";
    const res = await fetch(`${base}/api/track`, { cache: "no-store" });
    return res.json();
  } catch {
    return { views: 0, viewHits: 0, attending: 0, mapClicks: 0, mapHits: 0 };
  }
}

export default async function AdminPage() {
  const stats = await getStats();

  const rows = [
    { label: "Unique Views",        value: stats.views,                                              color: "#3B82F6" },
    { label: "Repeat Views",        value: Math.max(0, (stats.viewHits ?? 0) - stats.views),        color: "#F97316" },
    { label: "Map Clicks (Unique)", value: stats.mapClicks ?? 0,                                     color: "#8B5CF6" },
    { label: "Map Clicks (Repeat)", value: Math.max(0, (stats.mapHits ?? 0) - (stats.mapClicks ?? 0)), color: "#EC4899" },
    { label: "Attending",           value: stats.attending,                                          color: "#10B981" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: "36px 32px", width: "100%", maxWidth: 380 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "#C9A96E",
          }}>প</div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0 }}>Invitation Stats</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>প্রিয়বোধী মহোৎসব · 20 Dec 2026</p>
        </div>

        {/* Stats list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {rows.map(({ label, value, color }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 10, background: "#F8FAFC",
            }}>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color }}>{value}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#CBD5E1", marginTop: 20 }}>
          Tracked by unique IP address
        </p>
      </div>

      <a href="/admin/login?from=/admin/dashboard" style={{ marginTop: 16, fontSize: 12, color: "#94A3B8", textDecoration: "none" }}>
        Admin Login →
      </a>
    </div>
  );
}
