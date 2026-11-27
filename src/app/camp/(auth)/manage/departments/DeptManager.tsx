"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, Tent } from "lucide-react";
import { C, Button, PageHeader, Card, Input, Spinner, Table, Thead, Tbody, Th, Td, Tr, Empty, Badge, useDesktop } from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";

type Dept = { id: number; code: string; name: string; isActive: boolean; order: number; cardBg?: string | null; cardText?: string | null; cardLayout?: string | null };

const EMPTY_FORM = { code: "", name: "", cardBg: "", cardText: "", cardLayout: "" };
export type DeptFormState = typeof EMPTY_FORM;
/** Extra fields a module adds to the department form (e.g. volunteer ID card design). */
export type DeptExtra = (form: DeptFormState, setForm: (f: DeptFormState) => void) => React.ReactNode;

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}
      onClick={onClose}
    >
      <Card padding={0} style={{ width: "100%", maxWidth: wide ? 560 : 420, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{title}</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </Card>
    </div>
  );
}

function genCode(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map(w => w[0]).join("").toUpperCase().slice(0, 4);
}

function DeptForm({ form, setForm, saving, onSubmit, onCancel, submitLabel, extra }: {
  form: typeof EMPTY_FORM;
  setForm: (f: typeof EMPTY_FORM) => void;
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  extra?: DeptExtra;
}) {
  const codeManual = useRef(submitLabel === "Save"); // in edit mode, treat code as manual from start

  function handleName(name: string) {
    if (!codeManual.current) {
      setForm({ ...form, name, code: genCode(name) });
    } else {
      setForm({ ...form, name });
    }
  }

  function handleCode(code: string) {
    codeManual.current = true;
    setForm({ ...form, code: code.toUpperCase() });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Input label="Department Name *" value={form.name} onChange={e => handleName(e.target.value)} placeholder="e.g. General Medicine" autoFocus />
      <Input label="Code *" value={form.code} onChange={e => handleCode(e.target.value)} placeholder="Auto-generated, or override" style={{ textTransform: "uppercase" }} />
      {extra?.(form, setForm)}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

// Shared by Medical Camp and Volunteer modules — `api` decides which department table.
export default function DeptManager({ api, sub, members, idLabel, extra }: { api: string; sub: string; members: string; idLabel: string; extra?: DeptExtra }) {
  const desktop   = useDesktop();
  const { toast } = useToast();
  const [list,     setList]     = useState<Dept[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [addOpen,  setAddOpen]  = useState(false);
  const [editItem, setEditItem] = useState<Dept | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    const r = await fetch(api);
    setList(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    setSaving(true);
    const res = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
    toast("Department added", "success");
    setAddOpen(false); setForm(EMPTY_FORM); load();
  }

  async function save() {
    if (!editItem) return;
    setSaving(true);
    const res = await fetch(api, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem.id, ...form }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
    toast("Saved", "success");
    setEditItem(null); setForm(EMPTY_FORM); load();
  }

  async function toggleActive(dept: Dept) {
    const res = await fetch(api, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: dept.id, isActive: !dept.isActive }) });
    if (!res.ok) { toast("Failed to update", "error"); return; }
    toast(dept.isActive ? "Deactivated" : "Activated", "success");
    load();
  }

  async function del() {
    if (!deleteId) return;
    setSaving(true);
    const res = await fetch(api, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteId }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
    toast("Deleted", "success");
    setDeleteId(null); load();
  }

  return (
    <>
      <PageHeader
        title="Departments"
        sub={sub}
        actions={<Button size="sm" icon={<Plus size={14} />} onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>Add Department</Button>}
      />

      {loading ? (
        <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} /></div></Card>
      ) : list.length === 0 ? (
        <Card><Empty icon={<Tent size={32} color={C.textMuted} />} title="No departments yet" sub="Add your first department to get started" /></Card>
      ) : (
        <Card padding={0}>
          <Table>
            <Thead><Tr><Th>Code</Th><Th>Name</Th><Th>Status</Th><Th style={{ textAlign: "right" }}>Actions</Th></Tr></Thead>
            <Tbody>
              {list.map(dept => (
                <Tr key={dept.id}>
                  <Td><span style={{ fontSize: 13, fontWeight: 800, color: C.gold, letterSpacing: "0.08em" }}>{dept.code}</span></Td>
                  <Td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{dept.name}</span>
                    {dept.cardBg && <Badge variant="gray" style={{ marginLeft: 8 }}>ID card design</Badge>}
                    <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>{idLabel}: {dept.code}-001, {dept.code}-002…</span>
                  </Td>
                  <Td><Badge variant={dept.isActive ? "green" : "gray"} dot>{dept.isActive ? "Active" : "Inactive"}</Badge></Td>
                  <Td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Button variant="ghost" size="sm" icon={dept.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />} onClick={() => toggleActive(dept)}>
                        {desktop ? (dept.isActive ? "Deactivate" : "Activate") : ""}
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => { setEditItem(dept); setForm({ code: dept.code, name: dept.name, cardBg: dept.cardBg ?? "", cardText: dept.cardText ?? "", cardLayout: dept.cardLayout ?? "" }); }}>
                        {desktop ? "Edit" : ""}
                      </Button>
                      <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleteId(dept.id)}>
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
        <Modal title="Add Department" onClose={() => setAddOpen(false)} wide={!!extra}>
          <DeptForm form={form} setForm={setForm} saving={saving} onSubmit={add} onCancel={() => setAddOpen(false)} submitLabel="Add" extra={extra} />
        </Modal>
      )}
      {editItem && (
        <Modal title="Edit Department" onClose={() => setEditItem(null)} wide={!!extra}>
          <DeptForm form={form} setForm={setForm} saving={saving} onSubmit={save} onCancel={() => setEditItem(null)} submitLabel="Save" extra={extra} />
        </Modal>
      )}
      {deleteId !== null && (
        <Modal title="Delete Department" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>{`Departments with ${members} cannot be deleted — deactivate them instead.`}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={saving} onClick={del}>Delete</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
