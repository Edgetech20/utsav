"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, X, Pencil, Pill, AlertTriangle, Upload, Download } from "lucide-react";
import {
  C, Button, Card, Spinner, PageHeader,
  Table, Thead, Tbody, Th, Td, Tr, Empty, Badge,
} from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";

type Medicine = { id: number; name: string; unit: string; stock: number; isActive: boolean; dispensedTotal: number };

const UNITS      = ["tablet", "capsule", "ml", "sachet", "cream", "drops", "injection"];
const LOW_STOCK  = 10;
const PAGE_SIZE  = 15;

const EMPTY_FORM = { name: "", unit: "tablet", stock: "" };

const SAMPLE_CSV = `name,unit,stock
Paracetamol 500mg,tablet,200
Amoxicillin 250mg,capsule,100
ORS Sachet,sachet,150
Antacid Syrup,ml,500
Betadine,drops,50
Ibuprofen 400mg,tablet,100`;

type ImportRow = { name: string; unit: string; stock: number; error?: string };

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "medicines_sample.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  // Skip header row
  return lines.slice(1).map(line => {
    const [name, unit, stockStr] = line.split(",").map(s => s.trim());
    const stock = parseInt(stockStr);
    const error = !name ? "Name required"
      : !unit ? "Unit required"
      : isNaN(stock) || stock < 0 ? "Stock must be a number ≥ 0"
      : undefined;
    return { name: name ?? "", unit: unit ?? "tablet", stock: isNaN(stock) ? 0 : stock, error };
  });
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: (rows: Medicine[]) => void }) {
  const fileRef              = useRef<HTMLInputElement>(null);
  const [rows,    setRows]   = useState<ImportRow[]>([]);
  const [saving,  setSaving] = useState(false);
  const [error,   setError]  = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target?.result as string);
      setRows(parsed);
      setError(parsed.length === 0 ? "No data rows found in file." : "");
    };
    reader.readAsText(file);
  }

  const validRows  = rows.filter(r => !r.error);
  const errorRows  = rows.filter(r => r.error);

  async function submit() {
    if (validRows.length === 0) { setError("No valid rows to import."); return; }
    setSaving(true); setError("");
    const r = await fetch("/api/camp/medicines", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: validRows }),
    });
    setSaving(false);
    const text = await r.text();
    if (!r.ok) { setError(text ? (JSON.parse(text).error ?? "Import failed") : `Server error (${r.status})`); return; }
    if (!text) { setError("Server returned empty response — restart the dev server and try again"); return; }
    onImported(JSON.parse(text));
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 540, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>Import Medicines</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Sample download */}
          <div style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 9, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>CSV format: name, unit, stock</p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>Units: tablet · capsule · ml · sachet · cream · drops · injection</p>
            </div>
            <button
              onClick={downloadSample}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              <Download size={13} /> Sample CSV
            </button>
          </div>

          {/* File picker */}
          <div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{ width: "100%", padding: "28px 20px", border: `2px dashed ${C.border}`, borderRadius: 10, background: "#FAFAFA", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <Upload size={20} color={C.textMuted} />
              <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: 0 }}>Click to choose CSV file</p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>or drag and drop</p>
            </button>
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.textSub, margin: "0 0 8px" }}>
                Preview — {validRows.length} valid, {errorRows.length} skipped
              </p>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      {["Name", "Unit", "Stock", ""].map(h => (
                        <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: C.textSub, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} style={{ background: row.error ? "#FFF5F5" : "transparent" }}>
                        <td style={{ padding: "6px 12px", color: C.text, borderBottom: `1px solid ${C.border}` }}>{row.name || "—"}</td>
                        <td style={{ padding: "6px 12px", color: C.textSub, borderBottom: `1px solid ${C.border}` }}>{row.unit}</td>
                        <td style={{ padding: "6px 12px", color: C.text, borderBottom: `1px solid ${C.border}`, fontVariantNumeric: "tabular-nums" }}>{row.stock}</td>
                        <td style={{ padding: "6px 12px", borderBottom: `1px solid ${C.border}` }}>
                          {row.error
                            ? <span style={{ color: "#EF4444", fontSize: 11 }}>{row.error}</span>
                            : <span style={{ color: "#10B981", fontSize: 11 }}>✓</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={submit} disabled={validRows.length === 0} icon={<Upload size={14} />}>
            Import {validRows.length > 0 ? `${validRows.length} Medicines` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MedicineModal({ med, onClose, onSaved }: {
  med?: Medicine;
  onClose: () => void;
  onSaved: (m: Medicine) => void;
}) {
  const isEdit = !!med;
  const [form,   setForm]   = useState(isEdit ? { name: med.name, unit: med.unit, stock: String(med.stock) } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function set(k: keyof typeof EMPTY_FORM, v: string) { setForm(f => ({ ...f, [k]: v })); setError(""); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const r = await fetch("/api/camp/medicines", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit
        ? { id: med.id, name: form.name, unit: form.unit, stock: parseInt(form.stock) || 0 }
        : { name: form.name, unit: form.unit, stock: parseInt(form.stock) || 0 }
      ),
    });
    const data = await r.json();
    setSaving(false);
    if (!r.ok) { setError(data.error ?? "Failed"); return; }
    onSaved(data);
  }

  const inputSt: React.CSSProperties = {
    padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.text, background: C.surface, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  };
  const lbl = (t: string) => (
    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{t}</label>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{isEdit ? "Edit Medicine" : "Add Medicine"}</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#EF4444" }}>{error}</div>
          )}
          <div>
            {lbl("Medicine Name *")}
            <input style={inputSt} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Paracetamol 500mg" required autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              {lbl("Unit *")}
              <select style={inputSt} value={form.unit} onChange={e => set("unit", e.target.value)} required>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              {lbl(isEdit ? "Current Stock" : "Opening Stock")}
              <input style={inputSt} type="number" min={0} value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <Button variant="ghost" size="sm" onClick={onClose} type="button">Cancel</Button>
            <Button size="sm" loading={saving} type="submit">{isEdit ? "Save Changes" : "Add Medicine"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Restock modal — just updates stock field
function RestockModal({ med, onClose, onSaved }: { med: Medicine; onClose: () => void; onSaved: (m: Medicine) => void }) {
  const [qty,    setQty]    = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const add = parseInt(qty);
    if (!add || add <= 0) { setError("Enter a valid quantity"); return; }
    setSaving(true);
    const r = await fetch("/api/camp/medicines", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: med.id, stock: med.stock + add }),
    });
    const data = await r.json();
    setSaving(false);
    if (!r.ok) { setError(data.error ?? "Failed"); return; }
    onSaved(data);
  }

  const inputSt: React.CSSProperties = {
    padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.text, background: C.surface, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 340, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>Restock</p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 0" }}>{med.name} · current: {med.stock} {med.unit}s</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {error && <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{error}</p>}
          <input
            style={inputSt} type="number" min={1} autoFocus
            placeholder={`Add how many ${med.unit}s?`}
            value={qty} onChange={e => setQty(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" size="sm" onClick={onClose} type="button">Cancel</Button>
            <Button size="sm" loading={saving} type="submit">Add Stock</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MedicinesPage() {
  const { toast }    = useToast();
  const [medicines,  setMedicines]  = useState<Medicine[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [addOpen,    setAddOpen]    = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editMed,    setEditMed]    = useState<Medicine | null>(null);
  const [restockMed, setRestockMed] = useState<Medicine | null>(null);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/camp/medicines?all=1");
    if (r.ok) setMedicines(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSaved(m: Medicine) {
    setMedicines(prev => {
      const idx = prev.findIndex(x => x.id === m.id);
      if (idx >= 0) return prev.map(x => x.id === m.id ? m : x);
      setPage(1);
      return [...prev, m];
    });
    setAddOpen(false); setEditMed(null); setRestockMed(null);
    toast("Saved", "success");
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    const r = await fetch(`/api/camp/medicines?id=${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!r.ok) { toast("Failed to remove", "error"); return; }
    setDeleteId(null);
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, isActive: false } : m));
    toast("Medicine removed", "success");
  }

  const active      = medicines.filter(m => m.isActive);
  const inactive    = medicines.filter(m => !m.isActive);
  const lowStock    = active.filter(m => m.stock <= LOW_STOCK);
  const totalPages  = Math.max(1, Math.ceil(active.length / PAGE_SIZE));
  const paginated   = active.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Medicines"
        sub={`${active.length} active · ${lowStock.length} low stock`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" size="sm" icon={<Upload size={14} />} onClick={() => setImportOpen(true)}>Import CSV</Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Medicine</Button>
          </div>
        }
      />

      {lowStock.length > 0 && (
        <Card style={{ marginBottom: 16, borderColor: "rgba(245,158,11,0.4)", background: "#FFFBEB" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", margin: "0 0 4px" }}>Low Stock Warning</p>
              <p style={{ fontSize: 12, color: "#B45309", margin: 0 }}>
                {lowStock.map(m => `${m.name} (${m.stock} left)`).join(" · ")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} /></div></Card>
      ) : active.length === 0 ? (
        <Card><Empty icon={<Pill size={32} color={C.textMuted} />} title="No medicines yet" sub="Add medicines to build your inventory" /></Card>
      ) : (
        <Card padding={0} style={{ marginBottom: 16 }}>
          <Table>
            <Thead>
              <Tr>
                <Th>Medicine</Th>
                <Th>Unit</Th>
                <Th>Dispensed</Th>
                <Th>Remaining</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginated.map(m => (
                <Tr key={m.id}>
                  <Td><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</span></Td>
                  <Td><span style={{ fontSize: 12, color: C.textSub }}>{m.unit}</span></Td>
                  <Td>
                    <span style={{ fontSize: 13, color: C.textSub, fontVariantNumeric: "tabular-nums" }}>
                      {m.dispensedTotal}
                    </span>
                  </Td>
                  <Td>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: m.stock === 0 ? "#EF4444" : m.stock <= LOW_STOCK ? "#F59E0B" : C.text,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {m.stock}
                    </span>
                    {m.stock <= LOW_STOCK && m.stock > 0 && (
                      <span style={{ fontSize: 10, color: "#F59E0B", marginLeft: 6, fontWeight: 600 }}>LOW</span>
                    )}
                    {m.stock === 0 && (
                      <span style={{ fontSize: 10, color: "#EF4444", marginLeft: 6, fontWeight: 600 }}>OUT</span>
                    )}
                  </Td>
                  <Td>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button
                        onClick={() => setRestockMed(m)}
                        style={{ fontSize: 12, fontWeight: 600, color: C.text, background: "#F1F5F9", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}
                      >
                        + Restock
                      </button>
                      <button onClick={() => setEditMed(m)} title="Edit" style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 6, borderRadius: 6, display: "flex" }}>
                        <Pencil size={13} />
                      </button>
                      {deleteId === m.id ? (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <button onClick={() => handleDelete(m.id)} disabled={deleting} style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#EF4444", border: "none", padding: "3px 8px", borderRadius: 5, cursor: "pointer" }}>
                            {deleting ? "…" : "Confirm"}
                          </button>
                          <button onClick={() => setDeleteId(null)} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 4, display: "flex" }}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(m.id)} title="Remove" style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 6, borderRadius: 6, display: "flex" }}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {active.length > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px" }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, active.length)} of {active.length}
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

      {inactive.length > 0 && (
        <p style={{ fontSize: 11, color: C.textMuted, margin: "8px 0 0" }}>{inactive.length} inactive medicine{inactive.length > 1 ? "s" : ""} hidden.</p>
      )}

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImported={rows => {
            setMedicines(prev => [...prev, ...rows]);
            setImportOpen(false);
            toast(`${rows.length} medicines imported`, "success");
          }}
        />
      )}
      {(addOpen || editMed) && (
        <MedicineModal
          med={editMed ?? undefined}
          onClose={() => { setAddOpen(false); setEditMed(null); }}
          onSaved={handleSaved}
        />
      )}
      {restockMed && (
        <RestockModal med={restockMed} onClose={() => setRestockMed(null)} onSaved={handleSaved} />
      )}
    </>
  );
}
