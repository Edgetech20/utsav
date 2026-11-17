"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, Stethoscope } from "lucide-react";
import { C, Button, PageHeader, Card, Input, Spinner, Table, Thead, Tbody, Th, Td, Tr, Empty, Badge, useDesktop } from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";

type Dept   = { id: number; code: string; name: string };
type Doctor = { id: number; name: string; email: string | null; isActive: boolean; department: Dept };

const EMPTY_FORM = { name: "", departmentId: "", email: "" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}
      onClick={onClose}
    >
      <Card padding={0} style={{ width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{title}</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </Card>
    </div>
  );
}

function DoctorForm({ form, setForm, depts, saving, onSubmit, onCancel, submitLabel }: {
  form: typeof EMPTY_FORM;
  setForm: (f: typeof EMPTY_FORM) => void;
  depts: Dept[];
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 14, color: C.text, background: C.surface, outline: "none", fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Input
        label="Doctor Name *"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Dr. Ramesh Kumar"
      />
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Department *
        </label>
        <select
          style={selectStyle}
          value={form.departmentId}
          onChange={e => setForm({ ...form, departmentId: e.target.value })}
        >
          <option value="">Select department…</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
        </select>
      </div>
      <Input
        label="Login Email (optional)"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        placeholder="doctor@example.com — links to their camp login"
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

export default function ManageDoctorsPage() {
  const desktop   = useDesktop();
  const { toast } = useToast();
  const [list,     setList]     = useState<Doctor[]>([]);
  const [depts,    setDepts]    = useState<Dept[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [addOpen,  setAddOpen]  = useState(false);
  const [editItem, setEditItem] = useState<Doctor | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/camp/doctors");
    if (r.ok) setList(await r.json());
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/camp/departments").then(r => r.json()).then((d: Dept[]) => setDepts(d.filter(x => x.isActive)));
    load();
  }, []);

  async function add() {
    setSaving(true);
    const res  = await fetch("/api/camp/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
    toast("Doctor added", "success");
    setAddOpen(false); setForm(EMPTY_FORM); load();
  }

  async function save() {
    if (!editItem) return;
    setSaving(true);
    const res  = await fetch("/api/camp/doctors", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem.id, ...form }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
    toast("Saved", "success");
    setEditItem(null); setForm(EMPTY_FORM); load();
  }

  async function toggleActive(doc: Doctor) {
    const res = await fetch("/api/camp/doctors", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: doc.id, isActive: !doc.isActive }) });
    if (!res.ok) { toast("Failed to update", "error"); return; }
    toast(doc.isActive ? "Deactivated" : "Activated", "success");
    load();
  }

  async function del() {
    if (!deleteId) return;
    setSaving(true);
    const res  = await fetch("/api/camp/doctors", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteId }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
    toast("Deleted", "success");
    setDeleteId(null); load();
  }

  return (
    <>
      <PageHeader
        title="Doctors"
        sub="Assign doctors to departments"
        actions={<Button size="sm" icon={<Plus size={14} />} onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>Add Doctor</Button>}
      />

      {loading ? (
        <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} /></div></Card>
      ) : list.length === 0 ? (
        <Card><Empty icon={<Stethoscope size={32} color={C.textMuted} />} title="No doctors yet" subtitle="Add doctors and assign them to departments" /></Card>
      ) : (
        <Card padding={0}>
          <Table>
            <Thead>
              <Tr>
                <Th>Doctor Name</Th>
                <Th>Department</Th>
                <Th>Status</Th>
                <Th style={{ textAlign: "right" }}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {list.map(doc => (
                <Tr key={doc.id}>
                  <Td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{doc.name}</span>
                    {doc.email && <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{doc.email}</p>}
                  </Td>
                  <Td>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginRight: 6 }}>{doc.department.code}</span>
                    <span style={{ fontSize: 13, color: C.textSub }}>{doc.department.name}</span>
                  </Td>
                  <Td>
                    <Badge variant={doc.isActive ? "green" : "gray"} dot>
                      {doc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Button
                        variant="ghost" size="sm"
                        icon={doc.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        onClick={() => toggleActive(doc)}
                      >
                        {desktop ? (doc.isActive ? "Deactivate" : "Activate") : ""}
                      </Button>
                      <Button
                        variant="ghost" size="sm" icon={<Pencil size={13} />}
                        onClick={() => { setEditItem(doc); setForm({ name: doc.name, departmentId: String(doc.department.id), email: doc.email ?? "" }); }}
                      >
                        {desktop ? "Edit" : ""}
                      </Button>
                      <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleteId(doc.id)}>
                        {desktop ? "Delete" : ""}
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {addOpen && (
        <Modal title="Add Doctor" onClose={() => setAddOpen(false)}>
          <DoctorForm form={form} setForm={setForm} depts={depts} saving={saving} onSubmit={add} onCancel={() => setAddOpen(false)} submitLabel="Add" />
        </Modal>
      )}
      {editItem && (
        <Modal title="Edit Doctor" onClose={() => setEditItem(null)}>
          <DoctorForm form={form} setForm={setForm} depts={depts} saving={saving} onSubmit={save} onCancel={() => setEditItem(null)} submitLabel="Save" />
        </Modal>
      )}
      {deleteId !== null && (
        <Modal title="Delete Doctor" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>This will permanently delete the doctor record.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={saving} onClick={del}>Delete</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
