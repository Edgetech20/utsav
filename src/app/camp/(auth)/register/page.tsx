"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { UserPlus, Printer, CheckCircle2, X, Search as SearchIcon, Link2, ClipboardList, Eye, Pencil, Trash2 } from "lucide-react";
import {
  C, Button, PageHeader, Card, Input, Spinner,
  Table, Thead, Tbody, Th, Td, Tr, Empty, Badge, Search, useDesktop,
} from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";
import { useCampUser } from "../CampNav";

type Dept    = { id: number; code: string; name: string; isActive: boolean };
type Doctor  = { id: number; name: string; departmentId: number; isActive: boolean };
type FormOpt = { id: number; name: string; slug: string };
type PreReg  = {
  responseId: number; name: string; age: string; gender: string;
  mobile: string; address: string; problem: string;
  alreadyRegistered: boolean; submittedAt: string;
};
type Patient = {
  id: number; token: string; name: string; age: number; gender: string;
  mobile: string; address: string | null; problem: string | null; status: string;
  doctorName: string | null;
  registeredAt: string; calledAt: string | null; doctorDoneAt: string | null;
  dispensedAt: string | null; completedAt: string | null;
  department: { id: number; code: string; name: string };
};

type PatientMedicine = {
  id: number; quantity: number; dosage: string | null;
  dispensedAt: string; dispensedBy: string | null;
  medicine: { id: number; name: string; unit: string };
};

const STATUS_BADGE: Record<string, "orange" | "blue" | "green" | "gray"> = {
  waiting:     "orange",
  called:      "blue",
  doctor_done: "gray",
  completed:   "green",
};

const EMPTY = { name: "", age: "", gender: "", mobile: "", address: "", problem: "", departmentId: "", doctorName: "" };

// ── Token slip ────────────────────────────────────────────────────────────────
function TokenSlip({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const slipRef = useRef<HTMLDivElement>(null);

  function print() {
    const html = slipRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank", "width=400,height=300");
    if (!w) return;
    w.document.write(`
      <html><head><title>Token Slip</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; color: #0F172A; }
        .token { font-size: 48px; font-weight: 900; letter-spacing: 2px; margin: 12px 0; }
        .dept  { font-size: 14px; color: #64748B; margin-bottom: 4px; }
        .name  { font-size: 16px; font-weight: 700; margin-top: 12px; }
        .meta  { font-size: 13px; color: #64748B; margin-top: 4px; }
        hr     { border: none; border-top: 1px dashed #E8ECF0; margin: 16px 0; }
      </style></head><body>${html}</body></html>
    `);
    w.document.close(); w.focus(); w.print(); w.close();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={18} color="#10B981" />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Registration Successful</span>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div ref={slipRef}>
            <p style={{ fontSize: 12, color: C.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{patient.department.name}</p>
            <p style={{ fontSize: 52, fontWeight: 900, letterSpacing: 3, color: C.text, margin: "8px 0 4px", fontVariantNumeric: "tabular-nums" }}>{patient.token}</p>
            <hr style={{ border: "none", borderTop: `1px dashed ${C.border}`, margin: "16px 0" }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{patient.name}</p>
            <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>Age {patient.age} · {patient.gender} · {patient.mobile}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <button onClick={print} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSub, cursor: "pointer" }}>
            <Printer size={14} /> Print slip
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 16px", borderRadius: 9, border: "none", background: C.primary, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            Next patient
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Patient modal ───────────────────────────────────────────────────
function AddPatientModal({ depts, doctors, onClose, onSuccess, prefill, editPatient }: {
  depts: Dept[];
  doctors: Doctor[];
  onClose: () => void;
  onSuccess: (p: Patient) => void;
  prefill?: Partial<typeof EMPTY>;
  editPatient?: Patient;
}) {
  const isEdit = !!editPatient;
  const [form,   setForm]   = useState(isEdit ? {
    name: editPatient.name, age: String(editPatient.age), gender: editPatient.gender,
    mobile: editPatient.mobile, address: editPatient.address ?? "", problem: editPatient.problem ?? "",
    departmentId: String(editPatient.department.id), doctorName: editPatient.doctorName ?? "",
  } : { ...EMPTY, ...prefill });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function set(k: keyof typeof EMPTY, v: string) { setForm(f => ({ ...f, [k]: v })); setError(""); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/camp/patients", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit
        ? { id: editPatient.id, name: form.name, age: parseInt(form.age), gender: form.gender, mobile: form.mobile, address: form.address || null, problem: form.problem || null, departmentId: parseInt(form.departmentId), doctorName: form.doctorName || null }
        : { name: form.name, age: parseInt(form.age), gender: form.gender, mobile: form.mobile, address: form.address || undefined, problem: form.problem || undefined, departmentId: parseInt(form.departmentId), doctorName: form.doctorName || undefined }
      ),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? (isEdit ? "Failed to update" : "Failed to register")); return; }
    onSuccess(data as Patient);
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
      <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface, zIndex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{isEdit ? "Edit Patient" : "Add Patient"}</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#EF4444" }}>{error}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>{lbl("Full Name *")}<input style={inputSt} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Patient's full name" required /></div>
            <div>{lbl("Age *")}<input style={inputSt} type="number" min={0} max={120} value={form.age} onChange={e => set("age", e.target.value)} placeholder="e.g. 45" required /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>{lbl("Gender *")}<select style={inputSt} value={form.gender} onChange={e => set("gender", e.target.value)} required><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div>{lbl("Mobile *")}<input style={inputSt} type="tel" value={form.mobile} onChange={e => set("mobile", e.target.value)} placeholder="10-digit number" required /></div>
          </div>
          <div>{lbl("Department *")}<select style={inputSt} value={form.departmentId} onChange={e => { setForm(f => ({ ...f, departmentId: e.target.value, doctorName: "" })); setError(""); }} required><option value="">Select department</option>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          {form.departmentId && (() => {
            const deptDocs = doctors.filter(d => d.isActive && d.departmentId === parseInt(form.departmentId));
            if (deptDocs.length === 0) return null;
            return (
              <div>{lbl("Doctor (optional)")}<select style={inputSt} value={form.doctorName} onChange={e => set("doctorName", e.target.value)}><option value="">Select doctor</option>{deptDocs.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
            );
          })()}
          <div>{lbl("Address (optional)")}<input style={inputSt} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Village / locality" /></div>
          <div>
            {lbl("Issue / Problem (optional)")}
            <textarea
              style={{ ...inputSt, resize: "vertical", minHeight: 60 }}
              value={form.problem}
              onChange={e => set("problem", e.target.value)}
              placeholder="e.g. fever, eye pain, tooth ache…"
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <Button variant="ghost" size="sm" onClick={onClose} type="button">Cancel</Button>
            <Button size="sm" loading={saving} type="submit">{isEdit ? "Save Changes" : "Register & Generate Token"}</Button>
          </div>
        </form>

      </div>
    </div>
  );
}

// ── View Patient modal (lifecycle) ────────────────────────────────────────────
function fmt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Prescription builder (shared by modal + table row) ───────────────────────
function buildPrescriptionHTML(
  patient: Patient,
  meds: PatientMedicine[],
  doctorDisplay: string,
  campTitle: string,
  campSubtitle: string,
  campVenue: string,
): string {
  const date = new Date(patient.dispensedAt ?? patient.completedAt ?? Date.now())
    .toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  return `<!DOCTYPE html><html><head><title>Prescription</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;color:#0F172A;padding:32px 44px;max-width:640px;margin:0 auto}
  .hdr{text-align:center;border-bottom:3px solid #0F172A;padding-bottom:14px;margin-bottom:18px}
  .camp{font-size:22px;font-weight:900;letter-spacing:.4px}
  .sub{font-size:13px;color:#475569;margin-top:4px}
  .venue{font-size:12px;color:#64748B;margin-top:2px}
  .date-row{text-align:right;font-size:12px;color:#64748B;margin-bottom:18px}
  .pat-box{border:1px solid #E8ECF0;border-radius:8px;padding:12px 16px;margin-bottom:14px}
  .pat-name{font-size:19px;font-weight:800;margin-bottom:5px}
  .pat-line{font-size:13px;color:#475569;margin-top:3px}
  .complaint{background:#FFFBEB;border:1px solid rgba(245,158,11,.35);border-radius:6px;padding:10px 14px;margin-bottom:18px}
  .c-lbl{font-size:10px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
  .c-val{font-size:13px;color:#92400E}
  .rx-hdr{display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .rx-sym{font-size:26px;font-weight:900;font-style:italic;line-height:1}
  .rx-line{flex:1;height:2px;background:#0F172A}
  .med{display:flex;gap:10px;padding:8px 0;border-bottom:1px dashed #E8ECF0}
  .med:last-child{border-bottom:none}
  .med-n{font-size:12px;font-weight:700;color:#94A3B8;min-width:22px;padding-top:2px}
  .med-name{font-size:14px;font-weight:700;margin-bottom:2px}
  .med-qty{font-size:12px;color:#475569}
  .med-dose{font-size:12px;color:#64748B;font-style:italic;margin-top:1px}
  .no-med{font-size:13px;color:#065F46;background:#F0FDF4;border:1px solid rgba(16,185,129,.3);border-radius:6px;padding:10px 14px}
  @media print{body{padding:20px}}
</style></head><body>

<div class="hdr">
  <div class="camp">${[campTitle].filter(Boolean).join(" ") || "Medical Camp"}</div>
  ${campSubtitle ? `<div class="sub">${campSubtitle}</div>` : ""}
  ${campVenue    ? `<div class="venue">${campVenue}</div>`   : ""}
</div>

<div class="date-row">Date of Visit: <strong>${date}</strong></div>

<div class="pat-box">
  <div class="pat-name">${patient.name}</div>
  <div class="pat-line">Age: ${patient.age} years &nbsp;·&nbsp; ${patient.gender}</div>
  <div class="pat-line">Mobile: ${patient.mobile}</div>
  ${patient.address ? `<div class="pat-line">Address: ${patient.address}</div>` : ""}
  <div class="pat-line" style="color:#94A3B8;font-size:12px;margin-top:5px">Department: ${patient.department.name}</div>
</div>

${patient.problem ? `
<div class="complaint">
  <div class="c-lbl">Chief Complaint</div>
  <div class="c-val">${patient.problem}</div>
</div>` : ""}

<div class="rx-hdr">
  <span class="rx-sym">Rx</span>
  <div class="rx-line"></div>
</div>

${meds.length === 0
  ? `<div class="no-med">No medication prescribed.</div>`
  : `<div>${meds.map((m, i) => `
    <div class="med">
      <div class="med-n">${i + 1}.</div>
      <div>
        <div class="med-name">${m.medicine.name}</div>
        <div class="med-qty">${m.quantity} ${m.medicine.unit}${m.quantity > 1 ? "s" : ""}</div>
        ${m.dosage ? `<div class="med-dose">${m.dosage}</div>` : ""}
      </div>
    </div>`).join("")}</div>`}

${doctorDisplay ? `<div style="margin-top:28px;font-size:13px;color:#475569">Consulted by: <strong>Dr. ${doctorDisplay}</strong></div>` : ""}

</body></html>`;
}

function ViewPatientModal({ patient: initial, hasEdit, campTitle, campSubtitle, campVenue, deptDoctorMap, onClose, onUpdate, onEdit }: {
  patient: Patient;
  hasEdit: boolean;
  campTitle: string;
  campSubtitle: string;
  campVenue: string;
  deptDoctorMap: Record<number, string>;
  onClose: () => void;
  onUpdate: (p: Patient) => void;
  onEdit: () => void;
}) {
  const [patient,      setPatient]      = useState(initial);
  const [advancing,    setAdvancing]    = useState(false);
  const [advError,     setAdvError]     = useState("");
  const [meds,         setMeds]         = useState<PatientMedicine[] | null>(null);
  const [editingDoc,   setEditingDoc]   = useState(false);
  const [doctorVal,    setDoctorVal]    = useState(initial.doctorName ?? "");
  const [savingDoc,    setSavingDoc]    = useState(false);

  useEffect(() => {
    fetch(`/api/camp/dispensing?patientId=${patient.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setMeds);
  }, [patient.id, patient.dispensedAt]);

  async function saveDoctor() {
    setSavingDoc(true);
    const r = await fetch("/api/camp/patients", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: patient.id, doctorName: doctorVal.trim() || null }),
    });
    const data = await r.json();
    setSavingDoc(false);
    if (!r.ok) return;
    setPatient(data); onUpdate(data); setEditingDoc(false);
  }

  async function advance(newStatus: string) {
    setAdvancing(true); setAdvError("");
    const r = await fetch("/api/camp/patients", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: patient.id, status: newStatus }),
    });
    const data = await r.json();
    setAdvancing(false);
    if (!r.ok) { setAdvError(data.error ?? "Failed"); return; }
    setPatient(data);
    onUpdate(data);
  }

  function printPrescription() {
    const doctorDisplay = patient.doctorName ?? deptDoctorMap[patient.department.id] ?? "";
    const w = window.open("", "_blank", "width=720,height=860");
    if (!w) return;
    w.document.write(buildPrescriptionHTML(patient, meds ?? [], doctorDisplay, campTitle, campSubtitle, campVenue));
    w.document.close(); w.focus(); w.print(); w.close();
  }

  const steps = [
    { label: "Registered",  sub: "Patient added to system",   time: patient.registeredAt,  done: true,                   color: C.green   },
    { label: "Waiting",     sub: "In queue for department",    time: null,                  done: !!patient.calledAt,     color: C.orange  },
    { label: "Being Seen",  sub: "Consulting with doctor",     time: patient.calledAt,      done: !!patient.calledAt,     color: C.blue    },
    { label: "Doctor Done", sub: "Consultation finished",      time: patient.doctorDoneAt,  done: !!patient.doctorDoneAt, color: "#8B5CF6" },
    { label: "Dispensed",   sub: "Medicines from pharmacy",    time: patient.dispensedAt,   done: !!patient.dispensedAt,  color: C.gold    },
    { label: "Completed",   sub: "Patient discharged",         time: patient.completedAt,   done: !!patient.completedAt,  color: C.green   },
  ];

  const statusLabel = patient.status === "called" ? "Being Seen"
    : patient.status === "doctor_done" ? "Doctor Done"
    : patient.status.charAt(0).toUpperCase() + patient.status.slice(1);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 860, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: C.gold, letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>{patient.token}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{patient.name}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{patient.department.name} · Age {patient.age} · {patient.gender}</p>
          </div>
          <Badge variant={STATUS_BADGE[patient.status] ?? "gray"} dot>{statusLabel}</Badge>
          {hasEdit && (
            <button onClick={onEdit} title="Edit" style={{ border: "none", background: "none", cursor: "pointer", color: C.textSub, display: "flex", padding: 6, borderRadius: 7 }}>
              <Pencil size={15} />
            </button>
          )}
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>

        {/* Two-column body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, minHeight: 0 }}>

          {/* Left — details + medicines */}
          <div style={{ overflowY: "auto", borderRight: `1px solid ${C.border}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Patient info */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Patient Details</p>
              {patient.problem && (
                <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#92400E", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Chief Complaint</p>
                  <p style={{ fontSize: 13, color: "#92400E", margin: 0 }}>{patient.problem}</p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                {[
                  { label: "Mobile",     value: patient.mobile },
                  { label: "Department", value: patient.department.name },
                  ...(patient.address ? [{ label: "Address", value: patient.address }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={label === "Address" ? { gridColumn: "1/-1" } : {}}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                    <p style={{ fontSize: 13, color: C.text, margin: 0, fontWeight: 500 }}>{value}</p>
                  </div>
                ))}

                {/* Doctor — always shown, inline-editable */}
                <div style={{ gridColumn: "1/-1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Doctor</p>
                    {hasEdit && !editingDoc && (
                      <button onClick={() => { setDoctorVal(patient.doctorName ?? deptDoctorMap[patient.department.id] ?? ""); setEditingDoc(true); }} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 2, display: "flex" }}>
                        <Pencil size={11} />
                      </button>
                    )}
                  </div>
                  {editingDoc ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        autoFocus
                        value={doctorVal}
                        onChange={e => setDoctorVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveDoctor(); if (e.key === "Escape") setEditingDoc(false); }}
                        placeholder="Doctor's name"
                        style={{ flex: 1, padding: "5px 9px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.surface, outline: "none", fontFamily: "inherit" }}
                      />
                      <button onClick={saveDoctor} disabled={savingDoc} style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: C.primary, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {savingDoc ? "…" : "Save"}
                      </button>
                      <button onClick={() => setEditingDoc(false)} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={13} /></button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: patient.doctorName ?? deptDoctorMap[patient.department.id] ? C.text : C.textMuted, margin: 0, fontWeight: 500, fontStyle: patient.doctorName ?? deptDoctorMap[patient.department.id] ? "normal" : "italic" }}>
                      {patient.doctorName ?? deptDoctorMap[patient.department.id] ?? "Not assigned"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Medicines */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Medicines</p>
              {meds === null ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}><Spinner size={16} /></div>
              ) : !patient.dispensedAt ? (
                <p style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", margin: 0 }}>Not yet dispensed.</p>
              ) : meds.length === 0 ? (
                <div style={{ background: "#F0FDF4", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ fontSize: 13, color: "#065F46", margin: 0, fontWeight: 500 }}>No medication prescribed.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {meds.map(m => (
                    <div key={m.id} style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.medicine.name}</span>
                        <span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>{m.quantity} {m.medicine.unit}{m.quantity > 1 ? "s" : ""}</span>
                      </div>
                      {m.dosage && <p style={{ fontSize: 11, color: C.textSub, margin: "3px 0 0" }}>{m.dosage}</p>}
                    </div>
                  ))}
                  {meds[0]?.dispensedBy && (
                    <p style={{ fontSize: 11, color: C.textMuted, margin: "4px 0 0" }}>Dispensed by: {meds[0].dispensedBy}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right — timeline */}
          <div style={{ overflowY: "auto", padding: "16px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Patient Journey</p>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 14, minHeight: i < steps.length - 1 ? 52 : "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 20 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${step.done ? step.color : C.border}`, background: step.done ? step.color : C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {step.done && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, width: 2, background: steps[i + 1].done ? steps[i + 1].color + "55" : C.border, margin: "3px 0" }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < steps.length - 1 ? 12 : 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: step.done ? C.text : C.textMuted, margin: 0 }}>{step.label}</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{step.time ? fmt(step.time) : step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, flexShrink: 0, display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {patient.status === "completed" && (
              <button
                onClick={printPrescription}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSub, cursor: "pointer" }}
              >
                <Printer size={14} /> Print Prescription
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {advError && <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{advError}</p>}
            {hasEdit && patient.status !== "completed" && (
              <>
                {patient.status === "waiting" && (
                  <Button size="sm" loading={advancing} onClick={() => advance("called")}>Call Patient →</Button>
                )}
                {patient.status === "called" && (
                  <Button size="sm" loading={advancing} onClick={() => advance("doctor_done")}>Finish Consultation ✓</Button>
                )}
                {patient.status === "doctor_done" && (
                  <Button size="sm" loading={advancing} onClick={() => advance("completed")}>Mark Complete (No Medicines) →</Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pre-registration modal ────────────────────────────────────────────────────
function PreRegModal({ results, formName, loading, q, onQ, onRegister, onDisconnect, onClose }: {
  results: PreReg[]; formName: string; loading: boolean;
  q: string; onQ: (v: string) => void;
  onRegister: (pr: PreReg) => void;
  onDisconnect: () => void;
  onClose: () => void;
}) {
  const pending = results.filter(r => !r.alreadyRegistered).length;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 540, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <Link2 size={15} color={C.gold} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Pre-registered</p>
              {formName && <p style={{ fontSize: 11, color: C.textMuted, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formName} · {pending} pending</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button onClick={onDisconnect} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 11, color: C.textMuted, padding: "4px 6px" }}>Disconnect</button>
            <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
          </div>
        </div>
        {/* Search */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <SearchIcon size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
            <input
              style={{ width: "100%", padding: "8px 12px 8px 32px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              placeholder="Search name, mobile, problem…"
              value={q}
              onChange={e => onQ(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading && <p style={{ fontSize: 13, color: C.textMuted, margin: "20px auto" }}>Fetching…</p>}
          {!loading && pending === 0 && (
            <p style={{ fontSize: 13, color: C.textMuted, margin: "20px auto" }}>
              {q ? "No results matching your search." : "No pending pre-registrations."}
            </p>
          )}
          {!loading && results.filter(r => !r.alreadyRegistered).map(pr => (
            <div
              key={pr.responseId}
              style={{ background: C.surface, borderRadius: 9, border: `1px solid ${C.border}`, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{pr.name || "—"}</span>
                  {pr.age    && <span style={{ fontSize: 11, color: C.textSub }}>Age {pr.age}</span>}
                  {pr.gender && <span style={{ fontSize: 11, color: C.textSub }}>{pr.gender}</span>}
                  {pr.mobile && <span style={{ fontSize: 11, color: C.textSub }}>{pr.mobile}</span>}
                </div>
                {pr.problem && <p style={{ fontSize: 11, color: C.textMuted, margin: "3px 0 0", fontStyle: "italic" }}>{pr.problem}</p>}
                {pr.address && <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{pr.address}</p>}
              </div>
              <button
                onClick={() => onRegister(pr)}
                style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: C.primary, border: "none", padding: "6px 14px", borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap" as const, flexShrink: 0 }}
              >
                Register →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PatientPage() {
  const desktop    = useDesktop();
  const { toast }  = useToast();
  const campUser   = useCampUser();
  const hasEdit    = campUser.role === "super" || campUser.permissions.some(p => p.resource === "camp" && p.action === "edit");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [depts,    setDepts]    = useState<Dept[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState("");
  const [deptId,   setDeptId]   = useState("");
  const [status,   setStatus]   = useState("");
  const [addOpen,     setAddOpen]     = useState(false);
  const [preRegOpen,  setPreRegOpen]  = useState(false);
  const [prefill,     setPrefill]     = useState<Partial<typeof EMPTY> | undefined>();
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [slip,        setSlip]        = useState<Patient | null>(null);

  // ── Pre-registration (always-on once connected) ───────────────────────────
  const [forms,         setForms]         = useState<FormOpt[]>([]);
  const [importSlug,    setImportSlug]    = useState<string | null>(null); // null = not yet loaded from DB
  const [importQ,       setImportQ]       = useState("");
  const [importResults, setImportResults] = useState<PreReg[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importFormName, setImportFormName] = useState("");
  const [connecting,    setConnecting]    = useState(false);
  const [connectSlug,   setConnectSlug]   = useState(""); // temp value in setup card
  const [campTitle,     setCampTitle]     = useState("");
  const [campSubtitle,  setCampSubtitle]  = useState("");
  const [campVenue,     setCampVenue]     = useState("");
  const [deptDoctorMap, setDeptDoctorMap] = useState<Record<number, string>>({});
  const [doctors,       setDoctors]       = useState<Doctor[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (deptId) params.set("departmentId", deptId);
    if (status) params.set("status", status);
    if (q)      params.set("q", q);
    const r = await fetch(`/api/camp/patients?${params}`);
    if (r.ok) setPatients(await r.json());
    setLoading(false);
  }, [deptId, status, q]);

  const loadPreregs = useCallback(async (slug: string, search: string, silent = false) => {
    if (!silent) setImportLoading(true);
    const params = new URLSearchParams({ formSlug: slug });
    if (search) params.set("q", search);
    const r = await fetch(`/api/camp/preregistrations?${params}`);
    if (r.ok) {
      const data = await r.json();
      setImportResults(data.results);
      setImportFormName(data.formName);
    }
    if (!silent) setImportLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetch("/api/camp/departments").then(r => r.json()).then(setDepts);
    fetch("/api/camp/doctors")
      .then(r => r.ok ? r.json() : [])
      .then((docs: Doctor[]) => {
        setDoctors(docs);
        const map: Record<number, string> = {};
        for (const d of docs.filter(x => x.isActive)) {
          map[d.departmentId] = map[d.departmentId] ? `${map[d.departmentId]}, ${d.name}` : d.name;
        }
        setDeptDoctorMap(map);
      });
    // Load forms list for setup card
    fetch("/api/forms").then(r => r.ok ? r.json() : []).then(setForms);
    // Load camp form slug
    fetch("/api/camp/settings")
      .then(r => r.ok ? r.json() : {})
      .then((s: Record<string, string>) => setImportSlug(s.camp_form_slug ?? ""));
    // Load event info from admin settings for prescription header
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : {})
      .then((s: Record<string, string>) => {
        const t1 = s.event_title?.trim() ?? "";
        const t2 = s.event_title_sub?.trim() ?? "";
        setCampTitle([t1, t2].filter(Boolean).join(" "));
        setCampSubtitle(s.event_subtitle?.trim() ?? "");
        setCampVenue(s.event_venue?.trim() ?? "");
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-fetch pre-regs when slug or search changes
  useEffect(() => {
    if (!importSlug) return; // null (loading) or "" (not set)
    loadPreregs(importSlug, importQ);
  }, [importSlug, importQ, loadPreregs]);

  // Auto-refresh pre-regs every 60s
  useEffect(() => {
    if (!importSlug) return;
    const t = setInterval(() => loadPreregs(importSlug, importQ, true), 60000);
    return () => clearInterval(t);
  }, [importSlug, importQ, loadPreregs]);

  async function handlePrint(p: Patient) {
    const meds: PatientMedicine[] = await fetch(`/api/camp/dispensing?patientId=${p.id}`)
      .then(r => r.ok ? r.json() : []);
    const doctorDisplay = p.doctorName ?? deptDoctorMap[p.department.id] ?? "";
    const w = window.open("", "_blank", "width=720,height=860");
    if (!w) return;
    w.document.write(buildPrescriptionHTML(p, meds, doctorDisplay, campTitle, campSubtitle, campVenue));
    w.document.close(); w.focus(); w.print(); w.close();
  }

  async function connectForm() {
    if (!connectSlug) return;
    setConnecting(true);
    await fetch("/api/camp/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camp_form_slug: connectSlug }),
    });
    setImportSlug(connectSlug);
    setConnecting(false);
  }

  async function disconnectForm() {
    await fetch("/api/camp/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camp_form_slug: "" }),
    });
    setImportSlug("");
    setImportResults([]);
    setImportFormName("");
  }

  function handleSuccess(p: Patient) {
    const wasEdit = !!editPatient;
    setAddOpen(false); setEditPatient(null); setPrefill(undefined);
    if (wasEdit) {
      setPatients(ps => ps.map(x => x.id === p.id ? p : x));
      toast("Patient updated", "success");
    } else {
      setSlip(p);
      load();
      toast(`Token ${p.token} generated`, "success");
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    const r = await fetch(`/api/camp/patients?id=${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!r.ok) { toast("Failed to delete", "error"); return; }
    setDeleteId(null);
    setPatients(ps => ps.filter(p => p.id !== id));
    toast("Patient removed", "success");
  }

  function openWithPrefill(pr: PreReg) {
    setPreRegOpen(false);
    setPrefill({ name: pr.name, age: pr.age, gender: pr.gender, mobile: pr.mobile, address: pr.address, problem: pr.problem });
    setAddOpen(true);
  }

  const selectStyle: React.CSSProperties = {
    padding: "7px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.text, background: C.surface, outline: "none", fontFamily: "inherit",
  };

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.2 }}>Patients</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{patients.length} found</p>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Search value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, token, mobile…" />
          </div>
          <select style={selectStyle} value={deptId} onChange={e => setDeptId(e.target.value)}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="called">Being Seen</option>
            <option value="completed">Completed</option>
          </select>
          {importSlug && (
            <Button
              variant="ghost" size="sm"
              style={{ flexShrink: 0 }}
              icon={<ClipboardList size={14} />}
              onClick={() => setPreRegOpen(true)}
            >
              Pre Register
              {importResults.filter(r => !r.alreadyRegistered).length > 0 && (
                <span style={{ marginLeft: 5, background: C.gold, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 6px" }}>
                  {importResults.filter(r => !r.alreadyRegistered).length}
                </span>
              )}
            </Button>
          )}
          <Button style={{ flexShrink: 0 }} size="sm" icon={<UserPlus size={14} />} onClick={() => setAddOpen(true)}>Add Patient</Button>
        </div>
      </Card>

      {/* Not connected — one-time setup card */}
      {importSlug === "" && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Link2 size={15} color={C.gold} />
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Connect Pre-registration Form</p>
          </div>
          <p style={{ fontSize: 12, color: C.textSub, margin: "0 0 14px" }}>
            Link the online camp registration form once — the system will automatically fetch new submissions here.
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const }}>
            <select
              style={{ flex: 1, minWidth: 180, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: "none", fontFamily: "inherit" }}
              value={connectSlug}
              onChange={e => setConnectSlug(e.target.value)}
            >
              <option value="">Select a form…</option>
              {forms.map(f => <option key={f.slug} value={f.slug}>{f.name}</option>)}
            </select>
            <Button size="sm" loading={connecting} onClick={connectForm} disabled={!connectSlug}>Connect</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} /></div></Card>
      ) : patients.length === 0 ? (
        <Card><Empty icon={<UserPlus size={32} color={C.textMuted} />} title="No patients found" subtitle="Add a patient or adjust filters" /></Card>
      ) : (
        <Card padding={0}>
          <Table>
            <Thead>
              <Tr>
                <Th>Token</Th><Th>Name</Th>
                {desktop && <Th>Age / Gender</Th>}
                {desktop && <Th>Mobile</Th>}
                <Th>Department</Th><Th>Status</Th>
                {desktop && <Th>Registered</Th>}
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {patients.map(p => (
                <Tr key={p.id}>
                  <Td><span style={{ fontSize: 13, fontWeight: 800, color: C.gold, letterSpacing: 1, fontVariantNumeric: "tabular-nums" }}>{p.token}</span></Td>
                  <Td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</span>
                    {p.problem && <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{p.problem}</p>}
                  </Td>
                  {desktop && <Td><span style={{ fontSize: 13, color: C.textSub }}>{p.age} · {p.gender}</span></Td>}
                  {desktop && <Td><span style={{ fontSize: 13, color: C.textSub }}>{p.mobile}</span></Td>}
                  <Td><span style={{ fontSize: 12, fontWeight: 600, color: C.textSub }}>{p.department.name}</span></Td>
                  <Td>
                    <Badge variant={STATUS_BADGE[p.status] ?? "gray"} dot>
                      {p.status === "called" ? "Being Seen" : p.status === "doctor_done" ? "Doctor Done" : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Badge>
                  </Td>
                  {desktop && <Td><span style={{ fontSize: 12, color: C.textMuted }}>{new Date(p.registeredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span></Td>}
                  <Td>
                    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <button onClick={() => setViewPatient(p)} title="View" style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 6, borderRadius: 6, display: "flex" }}>
                        <Eye size={14} />
                      </button>
                      {p.status === "completed" && (
                        <button onClick={() => handlePrint(p)} title="Print prescription" style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 6, borderRadius: 6, display: "flex" }}>
                          <Printer size={14} />
                        </button>
                      )}
                      {hasEdit && (
                        <>
                          <button onClick={() => { setEditPatient(p); setAddOpen(true); }} title="Edit" style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 6, borderRadius: 6, display: "flex" }}>
                            <Pencil size={14} />
                          </button>
                          {deleteId === p.id ? (
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <button onClick={() => handleDelete(p.id)} disabled={deleting} style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#EF4444", border: "none", padding: "3px 8px", borderRadius: 5, cursor: "pointer" }}>
                                {deleting ? "…" : "Confirm"}
                              </button>
                              <button onClick={() => setDeleteId(null)} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 4, display: "flex" }}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteId(p.id)} title="Delete" style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 6, borderRadius: 6, display: "flex" }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {preRegOpen && importSlug && (
        <PreRegModal
          results={importResults}
          formName={importFormName}
          loading={importLoading}
          q={importQ}
          onQ={setImportQ}
          onRegister={openWithPrefill}
          onDisconnect={() => { disconnectForm(); setPreRegOpen(false); }}
          onClose={() => setPreRegOpen(false)}
        />
      )}
      {viewPatient && (
        <ViewPatientModal
          patient={viewPatient}
          hasEdit={hasEdit}
          campTitle={campTitle}
          campSubtitle={campSubtitle}
          campVenue={campVenue}
          deptDoctorMap={deptDoctorMap}
          onClose={() => setViewPatient(null)}
          onUpdate={p => { setViewPatient(p); setPatients(ps => ps.map(x => x.id === p.id ? p : x)); }}
          onEdit={() => { setEditPatient(viewPatient); setViewPatient(null); setAddOpen(true); }}
        />
      )}
      {addOpen && (
        <AddPatientModal
          key={editPatient ? `edit-${editPatient.id}` : prefill ? JSON.stringify(prefill) : "manual"}
          depts={depts.filter(d => d.isActive)}
          doctors={doctors}
          onClose={() => { setAddOpen(false); setEditPatient(null); setPrefill(undefined); }}
          onSuccess={handleSuccess}
          prefill={prefill}
          editPatient={editPatient ?? undefined}
        />
      )}
      {slip && <TokenSlip patient={slip} onClose={() => setSlip(null)} />}
    </>
  );
}
