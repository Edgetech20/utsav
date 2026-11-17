"use client";

import { useEffect, useState, useCallback } from "react";
import { Pill, X, Plus, Trash2, RefreshCw, Search as SearchIcon } from "lucide-react";
import {
  C, Button, Card, Spinner, Search,
  Table, Thead, Tbody, Th, Td, Tr, Empty, Badge,
} from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";

type Medicine = { id: number; name: string; unit: string; stock: number };
type Patient  = {
  id: number; token: string; name: string; age: number; gender: string;
  mobile: string; problem: string | null; status: string;
  department: { name: string };
};
type LineItem = { medicineId: number; name: string; unit: string; quantity: number; dosage: string };

// ── Dispense Modal ─────────────────────────────────────────────────────────────
function DispenseModal({ patient, medicines, onClose, onSuccess }: {
  patient: Patient;
  medicines: Medicine[];
  onClose: () => void;
  onSuccess: (p: Patient) => void;
}) {
  const [items,      setItems]      = useState<LineItem[]>([]);
  const [medQ,       setMedQ]       = useState("");
  const [noMedicine, setNoMedicine] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const filtered = medicines.filter(m =>
    m.name.toLowerCase().includes(medQ.toLowerCase()) &&
    !items.some(i => i.medicineId === m.id)
  );

  function addMed(m: Medicine) {
    setItems(prev => [...prev, { medicineId: m.id, name: m.name, unit: m.unit, quantity: 1, dosage: "" }]);
    setMedQ("");
  }

  function updateItem(idx: number, field: "quantity" | "dosage", val: string) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: field === "quantity" ? Math.max(1, parseInt(val) || 1) : val } : item
    ));
  }

  async function dispense() {
    if (!noMedicine && items.length === 0) { setError("Add at least one medicine or check No Medicine"); return; }
    setSaving(true); setError("");
    const r = await fetch("/api/camp/dispensing", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noMedicine
        ? { patientId: patient.id, noMedicine: true }
        : { patientId: patient.id, items: items.map(i => ({ medicineId: i.medicineId, quantity: i.quantity, dosage: i.dosage })) }
      ),
    });
    const data = await r.json();
    setSaving(false);
    if (!r.ok) { setError(data.error ?? "Failed"); return; }
    onSuccess(data);
  }

  const inputSt: React.CSSProperties = {
    padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.text, background: C.surface, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 540, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>
              Dispense Medicines
              <span style={{ fontSize: 13, fontWeight: 800, color: C.gold, marginLeft: 10, letterSpacing: 1 }}>{patient.token}</span>
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 0" }}>{patient.name} · {patient.department.name}</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Problem reminder */}
          {patient.problem && (
            <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 12px" }}>
              <p style={{ fontSize: 11, color: "#92400E", margin: 0 }}>
                <strong>Chief Complaint:</strong> {patient.problem}
              </p>
            </div>
          )}

          {/* No medicine checkbox */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: noMedicine ? "#F0FDF4" : "#F8FAFC", border: `1px solid ${noMedicine ? "rgba(16,185,129,0.4)" : C.border}`, borderRadius: 9, cursor: "pointer" }}>
            <input
              type="checkbox" checked={noMedicine}
              onChange={e => { setNoMedicine(e.target.checked); setItems([]); setError(""); }}
              style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#10B981" }}
            />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>No Medicine</p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>Patient does not require any medicines — will be marked complete</p>
            </div>
          </label>

          {/* Medicine search */}
          {!noMedicine && <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.textSub, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Add Medicine</p>
            <div style={{ position: "relative" }}>
              <SearchIcon size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
              <input
                style={{ ...inputSt, paddingLeft: 30 }}
                placeholder="Search medicine name…"
                value={medQ}
                onChange={e => setMedQ(e.target.value)}
              />
            </div>
            {medQ && filtered.length > 0 && (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, marginTop: 4, maxHeight: 160, overflowY: "auto", background: C.surface }}>
                {filtered.map(m => (
                  <button
                    key={m.id}
                    onClick={() => addMed(m)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: C.text, textAlign: "left" }}
                  >
                    <span>{m.name}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{m.stock} {m.unit}s in stock</span>
                  </button>
                ))}
              </div>
            )}
            {medQ && filtered.length === 0 && (
              <p style={{ fontSize: 12, color: C.textMuted, margin: "6px 0 0" }}>No medicines found.</p>
            )}
          </div>}

          {/* Line items */}
          {!noMedicine && items.length === 0 && (
            <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: "12px 0" }}>Search above to add medicines.</p>
          )}
          {!noMedicine && items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item, idx) => (
                <div key={item.medicineId} style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</span>
                    <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 2, display: "flex" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase" }}>Qty ({item.unit})</p>
                      <input
                        type="number" min={1} style={inputSt}
                        value={item.quantity}
                        onChange={e => updateItem(idx, "quantity", e.target.value)}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase" }}>Instructions</p>
                      <input
                        style={inputSt}
                        placeholder="e.g. 1 tab twice daily for 3 days"
                        value={item.dosage}
                        onChange={e => updateItem(idx, "dosage", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={dispense} icon={<Pill size={14} />}>
            {noMedicine ? "No Medicine — Mark Complete" : "Dispense & Complete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PharmacyPage() {
  const { toast }   = useToast();
  const [patients,  setPatients]  = useState<Patient[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [q,         setQ]         = useState("");
  const [dispense,  setDispense]  = useState<Patient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [pr, mr] = await Promise.all([
      fetch("/api/camp/patients?status=doctor_done"),
      fetch("/api/camp/medicines"),
    ]);
    if (pr.ok) setPatients(await pr.json());
    if (mr.ok) setMedicines(await mr.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = q
    ? patients.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.token.toLowerCase().includes(q.toLowerCase()) ||
        p.mobile?.toLowerCase().includes(q.toLowerCase())
      )
    : patients;

  function handleDispensed(updated: Patient) {
    setDispense(null);
    setPatients(prev => prev.filter(p => p.id !== updated.id));
    toast(`Medicines dispensed for ${updated.token}`, "success");
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.2 }}>Pharmacy Queue</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{patients.length} waiting for medicines</p>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Search value={q} onChange={e => setQ(e.target.value)} placeholder="Search token, name…" />
          </div>
          <button
            onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: C.textSub, cursor: "pointer", flexShrink: 0 }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </Card>

      {loading ? (
        <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} /></div></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <Empty
            icon={<Pill size={32} color={C.textMuted} />}
            title={q ? "No patients match" : "Queue is clear"}
            subtitle={q ? "Adjust your search" : "No patients waiting for medicines"}
          />
        </Card>
      ) : (
        <Card padding={0}>
          <Table>
            <Thead>
              <Tr>
                <Th>Token</Th>
                <Th>Patient</Th>
                <Th>Department</Th>
                <Th>Problem</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map(p => (
                <Tr key={p.id}>
                  <Td><span style={{ fontSize: 13, fontWeight: 800, color: C.gold, letterSpacing: 1, fontVariantNumeric: "tabular-nums" }}>{p.token}</span></Td>
                  <Td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</span>
                    <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{p.age} · {p.gender}</p>
                  </Td>
                  <Td><span style={{ fontSize: 12, color: C.textSub }}>{p.department.name}</span></Td>
                  <Td><span style={{ fontSize: 12, color: C.textSub, fontStyle: p.problem ? "normal" : "italic" }}>{p.problem ?? "—"}</span></Td>
                  <Td>
                    <button
                      onClick={() => setDispense(p)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: C.text, cursor: "pointer" }}
                    >
                      <Pill size={13} color={C.gold} />
                      Dispense
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {dispense && (
        <DispenseModal
          patient={dispense}
          medicines={medicines}
          onClose={() => setDispense(null)}
          onSuccess={handleDispensed}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
