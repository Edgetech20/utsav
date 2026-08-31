// Simple admin stats page — visit /admin to see counts
// No auth: keep this URL private or add basic auth via middleware later

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center space-y-6">
        <h1 className="text-xl font-bold text-gray-800">Invitation Stats</h1>
        <p className="text-gray-400 text-sm">Utsav of Shri Shri Thakur Anukul Chandra</p>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Unique Views" value={stats.views} color="text-blue-600" />
          <Stat label="Repeat Views" value={Math.max(0, (stats.viewHits ?? 0) - stats.views)} color="text-orange-500" />
          <Stat label="Map Clicks (Unique)" value={stats.mapClicks ?? 0} color="text-purple-600" />
          <Stat label="Map Clicks (Repeat)" value={Math.max(0, (stats.mapHits ?? 0) - (stats.mapClicks ?? 0))} color="text-pink-500" />
          <Stat label="Attending" value={stats.attending} color="text-green-600" />
        </div>

        <p className="text-xs text-gray-300">Tracked by unique IP address</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
