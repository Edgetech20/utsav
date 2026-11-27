"use client";

import { useEffect, useState } from "react";
import { UserPlus, Pencil, Trash2, Printer, Inbox, X, Save, Users } from "lucide-react";
import { C, Button, Search, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Card, Empty, Spinner, Pagination, useDesktop } from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";
import { useCampUser } from "@/app/camp/(auth)/CampNav";
import { volCanEdit } from "../VolNav";
import { printCards, type CardOpts } from "../card";

type Dept = { id: number; code: string; name: string; isActive: boolean };
type Vol  = { id: number; code: string; name: string; mobile: string; address: string | null; departmentId: number; department: Dept };
type Pending = { responseId: number; name: string; mobile: string; address: string; department: string; departmentId: number | null };

const EMPTY = { name: "", mobile: "", address: "", departmentId: "" };
const field: React.CSSProperties = { padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: "none", width: "100%", boxSizing: "border-box" };
const PER_PAGE = 25;

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: wide ? 760 : 440, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "16px 22px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

export default function VolunteerListPage() {
  const user = useCampUser();
  const edit = volCanEdit(user);
  const desktop = useDesktop();
  const { toast } = useToast();

  const [vols,    setVols]    = useState<Vol[]>([]);
  const [depts,   setDepts]   = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [deptF,   setDeptF]   = useState("");
  const [page,    setPage]    = useState(1);
  const [sel,     setSel]     = useState<Set<number>>(new Set());
  const [cardOpts, setCardOpts] = useState<CardOpts>({});

  const [form,    setForm]    = useState<typeof EMPTY | null>(null);
  const [editId,  setEditId]  = useState<number | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [delId,   setDelId]   = useState<number | null>(null);

  const [pending, setPending] = useState<Pending[] | null>(null);
  const [formName, setFormName] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [busyResp, setBusyResp] = useState<number | null>(null);

  async function load() {
    const [v, d] = await Promise.all([fetch("/api/volunteer").then(r => r.json()), fetch("/api/volunteer/departments").then(r => r.json())]);
    setVols(Array.isArray(v) ? v : []);
    setDepts(Array.isArray(d) ? d : []);
    setLoading(false);
  }
  async function loadPending() {
    const p = await fetch("/api/volunteer/pending").then(r => r.json()).catch(() => null);
    setPending(p?.results ?? []);
    setFormName(p?.formName ?? null);
  }

  useEffect(() => {
    load();
    if (edit) loadPending();
    fetch("/api/volunteer/settings").then(r => r.json()).then(s =>
      setCardOpts({ title: s.event_title, titleSub: s.event_title_sub }));
    const q = new URLSearchParams(window.location.search);
    if (q.get("dept")) setDeptF(q.get("dept")!);
    if (q.get("import")) setShowImport(true);
  }, [edit]);

  const activeDepts = depts.filter(d => d.isActive);
  const q = search.trim().toLowerCase();
  const filtered = vols.filter(v =>
    (!deptF || String(v.departmentId) === deptF) &&
    (!q || v.name.toLowerCase().includes(q) || v.mobile.includes(q) || v.code.toLowerCase().includes(q) || (v.address ?? "").toLowerCase().includes(q))
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allSel = filtered.length > 0 && filtered.every(v => sel.has(v.id));

  function toggle(id: number) {
    setSel(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function print(list: Vol[]) {
    if (!list.length) return;
    if (!printCards(list, cardOpts)) toast("Allow pop-ups for this site to print", "error");
  }

  function openAdd() { setEditId(null); setForm({ ...EMPTY, departmentId: deptF }); }
  function openEdit(v: Vol) { setEditId(v.id); setForm({ name: v.name, mobile: v.mobile, address: v.address ?? "", departmentId: String(v.departmentId) }); }

  async function save() {
    if (!form) return;
    setSaving(true);
    const res = await fetch("/api/volunteer", {
      method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(editId && { id: editId }), ...form, departmentId: Number(form.departmentId) || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
    toast(editId ? `Saved · ${data.code}` : `Registered · ID ${data.code}`, "success");
    setForm(null);
    load();
  }

  async function del() {
    if (!delId) return;
    setSaving(true);
    const res = await fetch("/api/volunteer", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: delId }) });
    setSaving(false);
    if (!res.ok) { toast("Failed to delete", "error"); return; }
    toast("Volunteer removed", "success");
    setDelId(null); setSel(p => { const n = new Set(p); n.delete(delId); return n; });
    load(); loadPending();
  }

  async function importOne(p: Pending) {
    if (!p.departmentId) { toast("Pick a department first", "error"); return; }
    setBusyResp(p.responseId);
    const res = await fetch("/api/volunteer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: p.name, mobile: p.mobile, address: p.address, departmentId: p.departmentId, responseId: p.responseId }),
    });
    const data = await res.json();
    setBusyResp(null);
    if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
    setPending(list => list?.filter(x => x.responseId !== p.responseId) ?? null);
    toast(`${data.name} · ${data.code}`, "success");
    load();
  }

  async function importAllMatched() {
    for (const p of pending?.filter(x => x.departmentId && x.name && x.mobile) ?? []) await importOne(p);
  }

  const selected = filtered.filter(v => sel.has(v.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="Volunteers"
        sub={`${vols.length} registered${filtered.length !== vols.length ? ` · ${filtered.length} shown` : ""}`}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Search placeholder="Search name, mobile, ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <select value={deptF} onChange={e => { setDeptF(e.target.value); setPage(1); }} style={{ ...field, width: "auto" }}>
              <option value="">All departments</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <Button variant="ghost" icon={<Printer size={14} />} disabled={!filtered.length}
              onClick={() => print(selected.length ? selected : filtered)}>
              Print ID Cards ({selected.length || filtered.length})
            </Button>
            {edit && formName && (
              <Button variant="ghost" icon={<Inbox size={14} />} onClick={() => setShowImport(true)}>Import ({pending?.length ?? 0})</Button>
            )}
            {edit && <Button icon={<UserPlus size={14} />} onClick={openAdd} disabled={!activeDepts.length} title={activeDepts.length ? "" : "Add a department first"}>Add</Button>}
          </div>
        }
      />

      {loading ? (
        <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={22} /></div></Card>
      ) : filtered.length === 0 ? (
        <Card><Empty icon={<Users size={36} />} title={vols.length ? "No matches" : "No volunteers yet"} sub={vols.length ? "Try a different search or department" : activeDepts.length ? "Add volunteers or import them from the linked form" : "Start by adding departments"} /></Card>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th style={{ width: 32 }}><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(filtered.map(v => v.id)))} title="Select all shown" /></Th>
              <Th>ID</Th><Th>Name</Th><Th>Mobile</Th><Th>Department</Th>{desktop && <Th>Address</Th>}
              <Th style={{ textAlign: "right" }}>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginated.map(v => (
              <Tr key={v.id}>
                <Td><input type="checkbox" checked={sel.has(v.id)} onChange={() => toggle(v.id)} /></Td>
                <Td><span style={{ fontWeight: 800, color: C.gold, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{v.code}</span></Td>
                <Td><span style={{ fontWeight: 600 }}>{v.name}</span></Td>
                <Td><span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSub }}>{v.mobile}</span></Td>
                <Td><span style={{ fontSize: 12, color: C.textSub }}>{v.department.name}</span></Td>
                {desktop && <Td style={{ maxWidth: 220 }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: C.textSub }}>{v.address || "—"}</span></Td>}
                <Td>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <Button variant="ghost" size="sm" icon={<Printer size={12} />} style={{ padding: "5px 8px" }} onClick={() => print([v])} title="Print ID card" />
                    {edit && <Button variant="ghost" size="sm" icon={<Pencil size={12} />} style={{ padding: "5px 8px" }} onClick={() => openEdit(v)} title="Edit" />}
                    {edit && <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} style={{ padding: "5px 8px", color: C.red }} onClick={() => setDelId(v.id)} title="Delete" />}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      {form && (
        <Modal title={editId ? "Edit Volunteer" : "Register Volunteer"} onClose={() => setForm(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([["name", "Full Name *", "text"], ["mobile", "Mobile *", "tel"], ["address", "Address", "text"]] as const).map(([k, l, t]) => (
              <label key={k} style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {l}
                <input type={t} value={form[k]} autoFocus={k === "name"} onChange={e => setForm({ ...form, [k]: e.target.value })} style={field} />
              </label>
            ))}
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Department *
              <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} style={field}>
                <option value="">Select…</option>
                {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </select>
            </label>
            {editId && <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>Changing department issues a new ID with that department&apos;s prefix.</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
              <Button icon={<Save size={14} />} loading={saving} onClick={save}>{editId ? "Save" : "Register"}</Button>
            </div>
          </div>
        </Modal>
      )}

      {delId !== null && (
        <Modal title="Delete Volunteer" onClose={() => setDelId(null)}>
          <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 18px" }}>This removes the volunteer. Their ID number will not be reused.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setDelId(null)}>Cancel</Button>
            <Button variant="danger" loading={saving} onClick={del}>Delete</Button>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal wide title={`Import from “${formName ?? "linked form"}”`} onClose={() => setShowImport(false)}>
          {!formName ? (
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>No form linked. Link one in Settings.</p>
          ) : !pending?.length ? (
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>All form entries are registered.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{pending.length} waiting · pick a department where it wasn&apos;t matched</p>
                <Button size="sm" onClick={importAllMatched} disabled={busyResp !== null || !pending.some(p => p.departmentId && p.name && p.mobile)}>Register all with department</Button>
              </div>
              {pending.map(p => (
                <div key={p.responseId} style={{ display: "grid", gridTemplateColumns: desktop ? "1fr 180px auto" : "1fr", gap: 8, alignItems: "center", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{p.name || <em style={{ color: C.red }}>no name</em>}</p>
                    <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.mobile || "no mobile"}{p.address && ` · ${p.address}`}{p.department && ` · wants: ${p.department}`}
                    </p>
                  </div>
                  <select value={p.departmentId ?? ""} style={field}
                    onChange={e => setPending(list => list?.map(x => x.responseId === p.responseId ? { ...x, departmentId: Number(e.target.value) || null } : x) ?? null)}>
                    <option value="">Department…</option>
                    {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <Button size="sm" loading={busyResp === p.responseId} disabled={!p.departmentId || !p.name || !p.mobile} onClick={() => importOne(p)}>Register</Button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
