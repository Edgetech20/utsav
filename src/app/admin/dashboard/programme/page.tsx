"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, CalendarDays } from "lucide-react";
import { C, Button, PageHeader, Card, Input, Spinner, Table, Thead, Tbody, Th, Td, Tr, Empty, useDesktop } from "../ui";
import { useToast } from "../toast";

type Programme = { id: number; title: string; time: string; description: string | null; venue: string | null; order: number };

const EMPTY_FORM = { title: "", time: "", description: "", venue: "" };

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}
      onClick={onClose}
    >
      <Card padding={0} style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{title}</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}><X size={17} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </Card>
    </div>
  );
}

// ── Form fields ───────────────────────────────────────────────────────────────
function ProgrammeForm({ form, setForm, saving, onSubmit, onCancel, submitLabel }: {
  form: typeof EMPTY_FORM;
  setForm: (f: typeof EMPTY_FORM) => void;
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Input label="Programme Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Inauguration Ceremony" />
      <Input label="Time *" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="e.g. 10:00 AM – 11:00 AM" />
      <Input label="Venue (optional)" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Thakur Bari" />
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description (optional)</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of this programme…"
          rows={3}
          style={{ padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: "none", background: C.surface, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", width: "100%" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProgrammePage() {
  const desktop = useDesktop();
  const { toast } = useToast();
  const [list, setList]       = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Programme | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm]       = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/programmes");
    setList(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY_FORM); setAddOpen(true); }
  function openEdit(p: Programme) {
    setForm({ title: p.title, time: p.time, description: p.description ?? "", venue: p.venue ?? "" });
    setEditItem(p);
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.time.trim()) { toast("Title and time are required", "error"); return; }
    setSaving(true);
    const r = await fetch("/api/programmes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!r.ok) { toast("Failed to add", "error"); return; }
    toast("Programme added");
    setAddOpen(false);
    load();
  }

  async function handleEdit() {
    if (!editItem) return;
    if (!form.title.trim() || !form.time.trim()) { toast("Title and time are required", "error"); return; }
    setSaving(true);
    const r = await fetch("/api/programmes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem.id, ...form }) });
    setSaving(false);
    if (!r.ok) { toast("Failed to update", "error"); return; }
    toast("Programme updated");
    setEditItem(null);
    load();
  }

  async function handleDelete() {
    if (deleteId == null) return;
    setSaving(true);
    const r = await fetch("/api/programmes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteId }) });
    setSaving(false);
    if (!r.ok) { toast("Failed to delete", "error"); return; }
    toast("Programme deleted");
    setDeleteId(null);
    load();
  }

  async function move(idx: number, dir: -1 | 1) {
    const next = [...list];
    const swap = idx + dir;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const reorder = next.map((p, i) => ({ id: p.id, order: i }));
    setList(next.map((p, i) => ({ ...p, order: i })));
    await fetch("/api/programmes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reorder) });
  }

  return (
    <div>
      <PageHeader
        title="Programme Schedule"
        sub={`${list.length} programme${list.length !== 1 ? "s" : ""}`}
        actions={<Button size="sm" icon={<Plus size={14} />} onClick={openAdd}>Add Programme</Button>}
      />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={24} /></div>
      ) : list.length === 0 ? (
        <Card>
          <Empty icon={<CalendarDays size={40} />} title="No programmes yet" sub="Add the event schedule for guests to see." />
        </Card>
      ) : desktop ? (
        // ── Desktop table ─────────────────────────────────────────────────────
        <Table>
          <Thead>
            <tr>
              <Th style={{ width: 60 }}>Order</Th>
              <Th>Programme</Th>
              <Th>Time</Th>
              <Th>Venue</Th>
              <Th>Description</Th>
              <Th style={{ width: 100 }}>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {list.map((p, idx) => (
              <Tr key={p.id}>
                <Td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button disabled={idx === 0} onClick={() => move(idx, -1)} style={{ border: "none", background: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? C.textMuted : C.textSub, padding: 2, display: "flex" }}><ChevronUp size={14} /></button>
                    <button disabled={idx === list.length - 1} onClick={() => move(idx, 1)} style={{ border: "none", background: "none", cursor: idx === list.length - 1 ? "default" : "pointer", color: idx === list.length - 1 ? C.textMuted : C.textSub, padding: 2, display: "flex" }}><ChevronDown size={14} /></button>
                  </div>
                </Td>
                <Td><span style={{ fontWeight: 600, color: C.text }}>{p.title}</span></Td>
                <Td><span style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>{p.time}</span></Td>
                <Td><span style={{ color: C.textSub, fontSize: 12 }}>{p.venue || "—"}</span></Td>
                <Td><span style={{ color: C.textMuted, fontSize: 12 }}>{p.description || "—"}</span></Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleteId(p.id)}>Delete</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        // ── Mobile cards ──────────────────────────────────────────────────────
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((p, idx) => (
            <Card key={p.id} padding={14}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {/* order controls */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button disabled={idx === 0} onClick={() => move(idx, -1)} style={{ border: "none", background: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? C.textMuted : C.textSub, padding: 2, display: "flex" }}><ChevronUp size={14} /></button>
                  <button disabled={idx === list.length - 1} onClick={() => move(idx, 1)} style={{ border: "none", background: "none", cursor: idx === list.length - 1 ? "default" : "pointer", color: idx === list.length - 1 ? C.textMuted : C.textSub, padding: 2, display: "flex" }}><ChevronDown size={14} /></button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{p.title}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: C.goldBg, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{p.time}</span>
                  </div>
                  {p.venue && <p style={{ fontSize: 12, color: C.textSub, margin: "4px 0 0" }}>{p.venue}</p>}
                  {p.description && <p style={{ fontSize: 12, color: C.textMuted, margin: "4px 0 0" }}>{p.description}</p>}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <Button variant="ghost" size="sm" icon={<Pencil size={12} />} onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => setDeleteId(p.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <Modal title="Add Programme" onClose={() => setAddOpen(false)}>
          <ProgrammeForm form={form} setForm={setForm} saving={saving} onSubmit={handleAdd} onCancel={() => setAddOpen(false)} submitLabel="Add Programme" />
        </Modal>
      )}

      {/* Edit modal */}
      {editItem && (
        <Modal title="Edit Programme" onClose={() => setEditItem(null)}>
          <ProgrammeForm form={form} setForm={setForm} saving={saving} onSubmit={handleEdit} onCancel={() => setEditItem(null)} submitLabel="Save Changes" />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId != null && (
        <Modal title="Delete Programme" onClose={() => setDeleteId(null)}>
          <p style={{ color: C.textSub, fontSize: 13, marginTop: 0 }}>
            Are you sure? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={saving} onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
