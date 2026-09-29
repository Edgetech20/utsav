"use client";

import { useEffect, useState } from "react";
import { Trash2, Car, Bus, BedDouble } from "lucide-react";

type Entry = {
  id: number; primaryName: string; mobile: string; comingFrom: string;
  totalPersons: number; maleMem: number; femaleMem: number; children: number; seniorCitizens: number;
  arrivalAt: string; departureAt: string;
  needsAssistance: boolean; assistanceDetails: string | null;
  hasVehicle: boolean; vehicleType: string | null; vehicleNo: string | null;
  additionalInfo: string | null; submittedAt: string;
};

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AccommodationPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/accommodation").then(r => r.json()).catch(() => ({}));
    setEntries(res?.entries ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this accommodation registration?")) return;
    setActing(id);
    await fetch("/api/accommodation", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setActing(null);
  }

  const filtered = entries.filter(e =>
    e.primaryName.toLowerCase().includes(search.toLowerCase()) ||
    e.mobile.includes(search) ||
    e.comingFrom.toLowerCase().includes(search.toLowerCase())
  );

  const totalPersons = entries.reduce((s, e) => s + e.totalPersons, 0);
  const needingHelp = entries.filter(e => e.needsAssistance).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Accommodation</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
            {entries.length} registrations · {totalPersons} persons · {needingHelp} need assistance
          </p>
        </div>
        <span style={{ background: "#0F172A", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>
          {entries.length} total
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, phone or city…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "10px 16px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A", background: "#fff", outline: "none", boxSizing: "border-box" }}
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
            <div key={e.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8ECF0", padding: "16px 20px", opacity: acting === e.id ? 0.5 : 1, transition: "opacity 0.2s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", gap: 14, flex: 1, flexWrap: "wrap" }}>

                  {/* Person count badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "#EFF6FF", color: "#3B82F6", fontWeight: 600, fontSize: 12, alignSelf: "flex-start" }}>
                    <BedDouble size={13} /> {e.totalPersons} person{e.totalPersons !== 1 ? "s" : ""}
                  </div>

                  <div style={{ flex: 1, minWidth: 180 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{e.primaryName}</p>
                    <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{e.mobile} · from {e.comingFrom}</p>
                    {(e.maleMem > 0 || e.femaleMem > 0 || e.children > 0 || e.seniorCitizens > 0) && (
                      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
                        {[
                          e.maleMem > 0 && `${e.maleMem}M`,
                          e.femaleMem > 0 && `${e.femaleMem}F`,
                          e.children > 0 && `${e.children} children`,
                          e.seniorCitizens > 0 && `${e.seniorCitizens} senior`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <div style={{ minWidth: 160 }}>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Arrival</p>
                    <p style={{ fontSize: 12, color: "#0F172A", marginTop: 2 }}>{fmtDT(e.arrivalAt)}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>Departure</p>
                    <p style={{ fontSize: 12, color: "#0F172A", marginTop: 2 }}>{fmtDT(e.departureAt)}</p>
                  </div>

                  <div style={{ minWidth: 140, display: "flex", flexDirection: "column", gap: 4 }}>
                    {e.needsAssistance && (
                      <span style={{ fontSize: 11, color: "#D97706", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 6, padding: "2px 8px", display: "inline-block" }}>
                        Needs assistance
                      </span>
                    )}
                    {e.hasVehicle && (
                      <span style={{ fontSize: 11, color: "#6366F1", background: "#EEF2FF", borderRadius: 6, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {e.vehicleType === "bus" ? <Bus size={11} /> : <Car size={11} />}
                        {e.vehicleNo}
                      </span>
                    )}
                    {e.additionalInfo && (
                      <p style={{ fontSize: 11, color: "#64748B" }}>{e.additionalInfo}</p>
                    )}
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

              {e.needsAssistance && e.assistanceDetails && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A" }}>
                  <p style={{ fontSize: 11, color: "#92400E" }}><strong>Assistance:</strong> {e.assistanceDetails}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
