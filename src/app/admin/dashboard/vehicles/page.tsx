"use client";

import { useEffect, useState } from "react";
import { Trash2, Car, Bus } from "lucide-react";

type Entry = {
  id: number; contactName: string; mobile: string; vehicleType: string;
  vehicleNo: string; totalPassengers: number; comingFrom: string;
  arrivalAt: string; departureAt: string; remark: string; submittedAt: string;
};

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function VehiclesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/vehicle").then(r => r.json()).catch(() => ({}));
    setEntries(res?.entries ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this vehicle registration?")) return;
    setActing(id);
    await fetch("/api/vehicle", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setActing(null);
  }

  const filtered = entries.filter(e =>
    e.contactName.toLowerCase().includes(search.toLowerCase()) ||
    e.mobile.includes(search) ||
    e.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
    e.comingFrom.toLowerCase().includes(search.toLowerCase())
  );

  const cars = entries.filter(e => e.vehicleType === "car").length;
  const buses = entries.filter(e => e.vehicleType === "bus").length;
  const totalPassengers = entries.reduce((s, e) => s + e.totalPassengers, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Vehicle & Parking</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
            {entries.length} registrations · {cars} cars · {buses} buses · {totalPassengers} passengers
          </p>
        </div>
        <span style={{ background: "#0F172A", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>
          {entries.length} total
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, phone, vehicle no or city…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "10px 16px", borderRadius: 10,
          border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A",
          background: "#fff", outline: "none", boxSizing: "border-box",
        }}
      />

      {/* Cards */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#CBD5E1", fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#94A3B8" }}>{search ? "No results found" : "No registrations yet"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(e => (
            <div key={e.id} style={{
              background: "#fff", borderRadius: 14, border: "1px solid #E8ECF0",
              padding: "16px 20px", opacity: acting === e.id ? 0.5 : 1, transition: "opacity 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flex: 1, flexWrap: "wrap" }}>
                  {/* Vehicle badge */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
                    borderRadius: 20, background: e.vehicleType === "bus" ? "#EEF2FF" : "#F0FDF4",
                    color: e.vehicleType === "bus" ? "#4F46E5" : "#16A34A", fontWeight: 600, fontSize: 12,
                  }}>
                    {e.vehicleType === "bus" ? <Bus size={13} /> : <Car size={13} />}
                    {e.vehicleType.toUpperCase()} · {e.vehicleNo}
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{e.contactName}</p>
                    <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{e.mobile} · from {e.comingFrom}</p>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{e.totalPassengers} passenger{e.totalPassengers !== 1 ? "s" : ""}</p>
                  </div>

                  <div style={{ minWidth: 160 }}>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Arrival</p>
                    <p style={{ fontSize: 12, color: "#0F172A", marginTop: 2 }}>{fmtDT(e.arrivalAt)}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>Departure</p>
                    <p style={{ fontSize: 12, color: "#0F172A", marginTop: 2 }}>{fmtDT(e.departureAt)}</p>
                  </div>

                  <div style={{ flex: 1, minWidth: 140 }}>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Remark</p>
                    <p style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{e.remark}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={acting === e.id}
                    title="Delete"
                    style={{ padding: "6px", borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", display: "flex", alignItems: "center", color: "#EF4444" }}
                  >
                    <Trash2 size={13} />
                  </button>
                  <p style={{ fontSize: 10, color: "#CBD5E1" }}>{fmtDT(e.submittedAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
