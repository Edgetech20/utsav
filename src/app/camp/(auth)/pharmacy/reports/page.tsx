"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { RefreshCw, Pill, Users, Package, Search as SearchIcon } from "lucide-react";
import {
  C, Card, Spinner, Search,
  Table, Thead, Tbody, Th, Td, Tr, Empty,
} from "@/app/admin/dashboard/ui";

type DispenseRecord = {
  id: number;
  quantity: number;
  dosage: string | null;
  dispensedAt: string;
  dispensedBy: string | null;
  medicine: { id: number; name: string; unit: string };
  patient: {
    id: number; token: string; name: string; age: number; gender: string;
    department: { name: string };
  };
};

const PAGE_SIZE = 20;

function StatCard({ label, value, sub, icon, color, bg }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, fontVariantNumeric: "tabular-nums" }}>{value}</p>
        <p style={{ fontSize: 12, color: C.textSub, margin: "2px 0 0", fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: C.textMuted, margin: "1px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function PharmacyReportsPage() {
  const [records,  setRecords]  = useState<DispenseRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState("");
  const [medFilter, setMedFilter] = useState("");
  const [page,     setPage]     = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/camp/dispensing");
    if (r.ok) setRecords(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Unique medicines for filter dropdown
  const medicines = useMemo(() => {
    const seen = new Map<number, string>();
    records.forEach(r => seen.set(r.medicine.id, r.medicine.name));
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  const filtered = useMemo(() => {
    let out = records;
    if (medFilter) out = out.filter(r => r.medicine.id === parseInt(medFilter));
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(r =>
        r.patient.name.toLowerCase().includes(lq) ||
        r.patient.token.toLowerCase().includes(lq) ||
        r.medicine.name.toLowerCase().includes(lq) ||
        r.patient.department.name.toLowerCase().includes(lq)
      );
    }
    return out;
  }, [records, q, medFilter]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [q, medFilter]);

  // Summary stats
  const totalPatients  = useMemo(() => new Set(records.map(r => r.patient.id)).size, [records]);
  const totalItems     = records.length;
  const totalUnits     = records.reduce((s, r) => s + r.quantity, 0);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectSt: React.CSSProperties = {
    padding: "7px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.text, background: C.surface, outline: "none", fontFamily: "inherit",
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Pharmacy Report</h1>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "3px 0 0" }}>Complete dispensing history</p>
        </div>
        <button
          onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: C.textSub, cursor: "pointer" }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard
          label="Patients Served"  value={totalPatients}
          icon={<Users size={18} color="#6366F1" strokeWidth={1.8} />}
          color="#6366F1" bg="#EEF2FF"
        />
        <StatCard
          label="Dispensing Records" value={totalItems}
          sub="Individual medicine entries"
          icon={<Pill size={18} color={C.gold} strokeWidth={1.8} />}
          color={C.gold} bg={C.goldBg}
        />
        <StatCard
          label="Total Units Dispensed" value={totalUnits}
          sub="Across all medicines"
          icon={<Package size={18} color="#10B981" strokeWidth={1.8} />}
          color="#10B981" bg="#ECFDF5"
        />
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Search value={q} onChange={e => setQ(e.target.value)} placeholder="Search patient, token, medicine…" />
          </div>
          <select style={selectSt} value={medFilter} onChange={e => setMedFilter(e.target.value)}>
            <option value="">All Medicines</option>
            {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {(q || medFilter) && (
            <button
              onClick={() => { setQ(""); setMedFilter(""); }}
              style={{ fontSize: 12, color: C.textMuted, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}
            >
              Clear
            </button>
          )}
          <span style={{ fontSize: 12, color: C.textMuted, flexShrink: 0 }}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} /></div></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <Empty
            icon={<Pill size={32} color={C.textMuted} />}
            title="No records found"
            subtitle={q || medFilter ? "Adjust your filters" : "No medicines have been dispensed yet"}
          />
        </Card>
      ) : (
        <>
          <Card padding={0} style={{ marginBottom: 12 }}>
            <Table>
              <Thead>
                <Tr>
                  <Th>Token</Th>
                  <Th>Patient</Th>
                  <Th>Department</Th>
                  <Th>Medicine</Th>
                  <Th>Qty</Th>
                  <Th>Instructions</Th>
                  <Th>Dispensed At</Th>
                  <Th>By</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginated.map(r => (
                  <Tr key={r.id}>
                    <Td>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.gold, letterSpacing: 1, fontVariantNumeric: "tabular-nums" }}>
                        {r.patient.token}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.patient.name}</span>
                      <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{r.patient.age} · {r.patient.gender}</p>
                    </Td>
                    <Td><span style={{ fontSize: 12, color: C.textSub }}>{r.patient.department.name}</span></Td>
                    <Td>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.medicine.name}</span>
                      <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{r.medicine.unit}</p>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                        {r.quantity}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 12, color: C.textSub, fontStyle: r.dosage ? "normal" : "italic" }}>
                        {r.dosage ?? "—"}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 12, color: C.textSub }}>
                        {new Date(r.dispensedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 11, color: C.textMuted }}>
                        {r.dispensedBy ? r.dispensedBy.split("@")[0] : "—"}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "5px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: page === 1 ? C.textMuted : C.text, cursor: page === 1 ? "default" : "pointer" }}
                >
                  Prev
                </button>
                <span style={{ padding: "5px 10px", fontSize: 12, color: C.textSub }}>Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "5px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: page === totalPages ? C.textMuted : C.text, cursor: page === totalPages ? "default" : "pointer" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
