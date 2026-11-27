"use client";

import { useEffect, useState, useSyncExternalStore, Fragment } from "react";
import { Trash2, RefreshCw, CheckCircle, Clock, Users, SlidersHorizontal, Save, X, Plus, Pencil, MessageSquare, Download, Shuffle, PhoneCall, Phone } from "lucide-react";
import { C, Badge, Button, Search, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Avatar, Pagination, Card } from "../ui";
import { useToast } from "../toast";
import { callCount } from "@/lib/permissions";

type Entry = { id: number; name: string; whatsapp: string; address: string; village: string | null; postOffice: string | null; district: string | null; pinCode: string | null; totalAttending: number | null; extraData: string | null; notes: string | null; location: string | null; submittedAt: string; waSent: boolean; assignedTo: string | null; assignee: { email: string; name: string | null } | null };
type CallerStat = { email: string; name: string | null; total: number; calls: [number, number, number, number] };

const CALL_STYLE: Array<[string, string, string]> = [ // [label, fg, bg] for 0, 1, 2, 3+ calls
  ["Not called",  "#64748B", "#F1F5F9"],
  ["1 call done", "#2563EB", "#DBEAFE"],
  ["2 calls done", "#7C3AED", "#EDE9FE"],
  ["3+ calls done", "#047857", "#D1FAE5"],
];
function CallBadge({ n }: { n: number }) {
  const [label, fg, bg] = CALL_STYLE[Math.min(n, 3)];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: fg, background: bg, whiteSpace: "nowrap" }}>
      {n > 0 && <PhoneCall size={10} />}{n > 3 ? `${n} calls done` : label}
    </span>
  );
}
const callerLabel = (c: { email: string; name: string | null }) => c.name || c.email.split("@")[0];

const TABLE_MIN = "(min-width: 1180px)";
const subscribeTable = (cb: () => void) => { const m = window.matchMedia(TABLE_MIN); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const useTableLayout = () => useSyncExternalStore(subscribeTable, () => window.matchMedia(TABLE_MIN).matches, () => false);

function SkeletonRows() {
  return (
    <>{Array.from({ length: 5 }).map((_, i) => (
      <Tr key={i}>
        <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Skeleton width={32} height={32} radius={99} /><Skeleton width={120} height={13} /></div></Td>
        <Td><Skeleton width={110} height={13} /></Td>
        <Td><Skeleton width={160} height={13} /></Td>
        <Td><Skeleton width={130} height={13} /></Td>
        <Td><Skeleton width={60} height={22} radius={20} /></Td>
        <Td><Skeleton width={80} height={13} /></Td>
        <Td><Skeleton width={90} height={28} radius={7} /></Td>
      </Tr>
    ))}</>
  );
}

type FieldConfig = { key: string; label: string; type: string; required: boolean; visible: boolean; custom?: true };

const FIXED_KEYS = ["name", "whatsapp", "village", "postOffice", "pinCode", "district", "totalAttending"];

const DEFAULT_FIELDS: FieldConfig[] = [
  { key: "name",           label: "Full Name",             type: "text",   required: true,  visible: true },
  { key: "whatsapp",       label: "WhatsApp No.",          type: "tel",    required: true,  visible: true },
  { key: "village",        label: "Village / Town / Area", type: "text",   required: true,  visible: true },
  { key: "postOffice",     label: "Post Office",           type: "text",   required: false, visible: true },
  { key: "pinCode",        label: "PIN Code",              type: "text",   required: true,  visible: true },
  { key: "district",       label: "District",              type: "text",   required: false, visible: true },
  { key: "totalAttending", label: "Total Attending",       type: "number", required: true,  visible: true },
];

export default function RsvpPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterKey, setFilterKey] = useState("village");
  const [filterVal, setFilterVal] = useState("");
  const [exportChoice, setExportChoice] = useState(false);
  const [acting, setActing]     = useState<number | null>(null);
  const [toConfirm, setToConfirm] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;
  const desktop = useTableLayout(); // cards below 1180px: phones, tablets, small laptops

  const [showEditor, setShowEditor] = useState(false);
  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>(DEFAULT_FIELDS); // for table display
  const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);           // for editor
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [me, setMe] = useState<{ email: string; role: string; permissions: { resource: string; action: string }[] } | null>(null);
  const hasRsvp   = (a: string) => me?.role === "super" || !!me?.permissions.some(p => p.resource === "rsvp" && p.action === a);
  const canEdit   = hasRsvp("edit");
  const canDelete = hasRsvp("delete");
  const canAssign = hasRsvp("assign");
  const canEditForm = me?.role === "super" || !!me?.permissions.some(p => p.resource === "settings" && p.action === "edit");
  const [scoped, setScoped]         = useState(false);
  const [callFilter, setCallFilter] = useState("all");     // all | 0 | 1 | 2 | 3
  const [callerFilter, setCallerFilter] = useState("");    // "" all | email | "__none"
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [summary, setSummary]       = useState<{ callers: CallerStat[]; unassigned: number } | null>(null);
  const [rebalancing, setRebalancing] = useState(false);
  const [editingNote, setEditingNote] = useState<{ index: number; text: string } | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [noteEntry, setNoteEntry] = useState<Entry | null>(null);
  const [noteType, setNoteType] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function load() {
    const res = await fetch("/api/rsvp").then(r => r.json()).catch(() => ({}));
    setEntries(res?.entries ?? []);
    setScoped(!!res?.scoped);
    setLoading(false);
  }

  async function loadSummary() {
    const r = await fetch("/api/rsvp/assign");
    if (r.ok) setSummary(await r.json());
  }

  async function assign(ids: number[], email: string | null) {
    const r = await fetch("/api/rsvp/assign", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, email }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { toast(data.error ?? "Could not assign", "error"); return; }
    toast(`${data.updated} RSVP${data.updated === 1 ? "" : "s"} ${email ? "assigned" : "unassigned"}`, "success");
    setSelected(new Set());
    await Promise.all([load(), loadSummary()]);
  }

  async function runRebalance() {
    setRebalancing(true);
    const r = await fetch("/api/rsvp/assign", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "rebalance" }),
    });
    const data = await r.json().catch(() => ({}));
    setRebalancing(false);
    if (!r.ok) { toast(data.error ?? "Rebalance failed", "error"); return; }
    toast(data.pool ? `${data.moved} RSVP${data.moved === 1 ? "" : "s"} moved across ${data.pool} caller${data.pool === 1 ? "" : "s"}` : "No callers — add a role with the Caller permission", data.pool ? "success" : "info");
    await Promise.all([load(), loadSummary()]);
  }

  function parseConfig(raw: string): FieldConfig[] {
    const cfg: FieldConfig[] = JSON.parse(raw);
    return [...DEFAULT_FIELDS.map(d => cfg.find(c => c.key === d.key) ?? d), ...cfg.filter(c => c.custom)];
  }

  async function loadConfig() {
    const s = await fetch("/api/settings").then(r => r.json()).catch(() => ({}));
    try {
      const cfg = s.rsvp_field_config ? parseConfig(s.rsvp_field_config) : DEFAULT_FIELDS;
      setFieldConfig(cfg);
      return cfg;
    } catch { return DEFAULT_FIELDS; }
  }

  async function openEditor() {
    const cfg = await loadConfig();
    setFields(cfg);
    setShowEditor(true);
  }

  async function saveFields() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvp_field_config: JSON.stringify(fields) }),
    });
    setFieldConfig(fields);
    setSaving(false);
    setShowEditor(false);
    toast("Form fields saved", "success");
  }

  function setField(i: number, patch: Partial<FieldConfig>) {
    setFields(prev => prev.map((f, j) => j === i ? { ...f, ...patch } : f));
  }

  function addField() {
    const key = `custom_${Date.now()}`;
    setFields(prev => [...prev, { key, label: "New Field", type: "text", required: false, visible: true, custom: true }]);
  }

  function removeField(i: number) {
    setFields(prev => prev.filter((_, j) => j !== i));
  }

  function openEdit(e: Entry) {
    const extra: Record<string, string> = e.extraData ? (() => { try { return JSON.parse(e.extraData!); } catch { return {}; } })() : {};
    setEditForm({
      name: e.name, whatsapp: e.whatsapp,
      village: e.village ?? "", postOffice: e.postOffice ?? "",
      district: e.district ?? "", pinCode: e.pinCode ?? "",
      totalAttending: e.totalAttending?.toString() ?? "",
      ...extra,
    });
    setEditEntry(e);
  }

  async function saveEdit() {
    if (!editEntry) return;
    setSavingEdit(true);
    const extra: Record<string, string> = {};
    for (const [k, v] of Object.entries(editForm)) {
      if (k.startsWith("custom_")) extra[k] = v;
    }
    await fetch("/api/rsvp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editEntry.id,
        name: editForm.name, whatsapp: editForm.whatsapp,
        village: editForm.village, postOffice: editForm.postOffice,
        district: editForm.district, pinCode: editForm.pinCode,
        totalAttending: editForm.totalAttending,
        extraData: Object.keys(extra).length ? JSON.stringify(extra) : null,
      }),
    });
    setSavingEdit(false);
    setEditEntry(null);
    toast("Entry updated", "success");
    await load();
  }

  async function refreshNotes() {
    const res = await fetch("/api/rsvp").then(r => r.json()).catch(() => ({}));
    const refreshed: Entry[] = res?.entries ?? [];
    setEntries(refreshed);
    const updated = refreshed.find(e => e.id === noteEntry?.id);
    if (updated) setNoteEntry(updated);
  }

  async function saveNoteEdit() {
    if (!noteEntry || !editingNote?.text.trim()) return;
    setSavingNote(true);
    const r = await fetch("/api/rsvp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: noteEntry.id, noteEdit: editingNote }),
    });
    setSavingNote(false);
    if (!r.ok) { toast((await r.json().catch(() => ({}))).error ?? "Could not save note", "error"); return; }
    setEditingNote(null);
    await refreshNotes();
  }

  async function addNote(type: string) {
    if (!noteEntry || !noteText.trim()) return;
    setSavingNote(true);
    await fetch("/api/rsvp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: noteEntry.id, noteAppend: { text: noteText.trim(), type } }),
    });
    setNoteText("");
    setNoteType(null);
    setSavingNote(false);
    await refreshNotes(); // keep modal open with updated notes
  }

  useEffect(() => {
    load();
    loadConfig();
    fetch("/api/admin/me").then(r => r.json()).then(setMe);
  }, []);

  useEffect(() => {
    if (canAssign) fetch("/api/rsvp/assign").then(r => r.ok ? r.json() : null).then(setSummary).catch(() => {});
  }, [canAssign]);

  async function handleDelete(id: number) {
    setActing(id); setToConfirm(null);
    await fetch("/api/rsvp", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast("Registration deleted", "success");
    await load();
    setActing(null);
  }

  async function handleResend(id: number) {
    setActing(id);
    await fetch("/api/rsvp/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast("WhatsApp message queued", "info");
    await load();
    setActing(null);
  }

  function exportExcel(list: Entry[], suffix = "") {
    setExportChoice(false);
    const cols = fieldConfig.filter(f => f.visible && f.key !== "totalAttending");
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = list.map(e => {
      const extra: Record<string, string> = (() => { try { return JSON.parse(e.extraData ?? "{}"); } catch { return {}; } })();
      return [
        ...cols.map(f => {
          const v = f.custom ? extra[f.key] : (e as unknown as Record<string, unknown>)[f.key];
          // ="..." keeps Excel from turning phone numbers into 9.19E+11
          return f.type === "tel" && v ? `="${v}"` : esc(v);
        }),
        esc(new Date(e.submittedAt).toLocaleString("en-IN")),
        esc(CALL_STYLE[Math.min(callCount(e.notes), 3)][0]),
        ...(canAssign ? [esc(e.assignee ? callerLabel(e.assignee) : "Unassigned")] : []),
      ].join(",");
    });
    const header = [...cols.map(f => f.label), "Registered", "Calls", ...(canAssign ? ["Assigned to"] : [])].map(esc).join(",");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + [header, ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `rsvp${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const q = search.toLowerCase();
  const fq = filterVal.trim().toLowerCase();
  const fieldVal = (e: Entry, key: string) => {
    if (!key.startsWith("custom_")) return String((e as unknown as Record<string, unknown>)[key] ?? "");
    try { return String(JSON.parse(e.extraData ?? "{}")[key] ?? ""); } catch { return ""; }
  };
  const filtered = entries
    .filter(e => callFilter === "all" || Math.min(callCount(e.notes), 3) === +callFilter)
    .filter(e => !callerFilter || (callerFilter === "__none" ? !e.assignedTo : e.assignedTo === callerFilter))
    .filter(e => !fq || fieldVal(e, filterKey).toLowerCase().includes(fq)).filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.whatsapp.includes(q) ||
    e.address.toLowerCase().includes(q) ||
    e.village?.toLowerCase().includes(q) ||
    e.postOffice?.toLowerCase().includes(q) ||
    e.district?.toLowerCase().includes(q) ||
    e.pinCode?.includes(q)
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const sent    = entries.filter(e => e.waSent).length;
  const pending = entries.length - sent;
  const notCalled = entries.filter(e => callCount(e.notes) === 0).length;
  const pageIds = paginated.map(e => e.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const toggleSel = (id: number) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const callers = summary?.callers ?? [];
  const selectStyle: React.CSSProperties = { padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface };
  const assigneeSelect = (e: Entry) => (
    <select value={e.assignedTo ?? ""} onClick={ev => ev.stopPropagation()} aria-label={`Assign ${e.name} to caller`}
      onChange={ev => assign([e.id], ev.target.value || null)}
      style={{ ...selectStyle, padding: "4px 6px", fontSize: 12, maxWidth: 150, color: e.assignedTo ? C.text : C.textMuted }}>
      <option value="">Unassigned</option>
      {callers.map(c => <option key={c.email} value={c.email}>{callerLabel(c)}</option>)}
      {e.assignee && !callers.some(c => c.email === e.assignedTo) && <option value={e.assignee.email}>{callerLabel(e.assignee)}</option>}
    </select>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="RSVP Registrations"
        sub={scoped
          ? `${entries.length} assigned to you · ${notCalled} not called yet`
          : `${entries.length} total · ${sent} messaged · ${pending} pending · ${notCalled} not called`}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Search placeholder="Search name, phone, address…" value={search} onChange={e => setSearch(e.target.value)} />
            <select value={filterKey} onChange={e => { setFilterKey(e.target.value); setPage(1); }} title="Filter field"
              style={{ padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface }}>
              {fieldConfig.filter(f => f.visible).map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <input value={filterVal} onChange={e => { setFilterVal(e.target.value); setPage(1); }} placeholder="Filter value (e.g. Bhatar)"
              style={{ padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: "none", width: 170 }} />
            {filterVal && <Button variant="ghost" size="sm" icon={<X size={12} />} onClick={() => setFilterVal("")} title="Clear filter">{filtered.length}</Button>}
            <select value={callFilter} onChange={e => { setCallFilter(e.target.value); setPage(1); }} aria-label="Filter by call status" style={selectStyle}>
              <option value="all">All call status</option>
              {CALL_STYLE.map(([label], i) => <option key={i} value={i}>{label}</option>)}
            </select>
            {canAssign && (
              <select value={callerFilter} onChange={e => { setCallerFilter(e.target.value); setPage(1); }} aria-label="Filter by caller" style={selectStyle}>
                <option value="">All callers</option>
                <option value="__none">Unassigned</option>
                {callers.map(c => <option key={c.email} value={c.email}>{callerLabel(c)}</option>)}
              </select>
            )}
            <Button variant="ghost" icon={<Download size={14} />} onClick={() => filtered.length !== entries.length ? setExportChoice(true) : exportExcel(entries)} disabled={!entries.length}>Export Excel</Button>
            {canEditForm && <Button variant="ghost" icon={<SlidersHorizontal size={14} />} onClick={openEditor}>Edit Form</Button>}
          </div>
        }
      />

      {exportChoice && (
        <div onClick={() => setExportChoice(false)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: C.text, margin: "0 0 6px" }}>Export to Excel</p>
            <Button icon={<Download size={14} />} disabled={!filtered.length} onClick={() => exportExcel(filtered, "-filtered")}>Filtered ({filtered.length})</Button>
            <Button variant="secondary" icon={<Download size={14} />} onClick={() => exportExcel(entries)}>Complete ({entries.length})</Button>
            <Button variant="ghost" onClick={() => setExportChoice(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {showEditor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>Edit RSVP Form Fields</p>
              <button onClick={() => setShowEditor(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10, maxHeight: "60vh", overflowY: "auto" }}>
              {fields.map((f, i) => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: `1px solid ${f.custom ? C.goldBorder : C.border}`, background: f.visible ? C.bg : "#F8FAFC", opacity: f.visible ? 1 : 0.55 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      value={f.label}
                      onChange={e => setField(i, { label: e.target.value })}
                      style={{ width: "100%", border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: C.text, outline: "none" }}
                    />
                    {f.custom ? (
                      <select value={f.type} onChange={e => setField(i, { type: e.target.value })} style={{ fontSize: 11, color: C.textMuted, border: "none", background: "transparent", padding: 0, margin: "2px 0 0", cursor: "pointer", outline: "none" }}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="tel">Phone</option>
                        <option value="email">Email</option>
                        <option value="location">Location</option>
                      </select>
                    ) : (
                      <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{f.key} · {f.type}</p>
                    )}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={f.required} onChange={e => setField(i, { required: e.target.checked })} />
                    Req
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={f.visible} onChange={e => setField(i, { visible: e.target.checked })} />
                    Show
                  </label>
                  {f.custom && (
                    <button onClick={() => removeField(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 2 }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addField}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 13 }}
              >
                <Plus size={14} /> Add Field
              </button>
            </div>
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button variant="ghost" onClick={() => setShowEditor(false)}>Cancel</Button>
              <Button icon={<Save size={14} />} loading={saving} onClick={saveFields}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editEntry && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>Edit Registration</p>
              <button onClick={() => setEditEntry(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12, maxHeight: "65vh", overflowY: "auto" }}>
              {fieldConfig.filter(f => f.visible).map(f => (
                <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em" }}>{f.label}</label>
                  <input
                    type={f.type === "tel" ? "tel" : f.type === "number" ? "number" : "text"}
                    value={editForm[f.key] ?? ""}
                    onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: "none" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button variant="ghost" onClick={() => setEditEntry(null)}>Cancel</Button>
              <Button icon={<Save size={14} />} loading={savingEdit} onClick={saveEdit}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteEntry && (() => {
        let log: { text: string; type: string; author: string; authorName?: string | null; createdAt: string; editedAt?: string }[] = [];
        try { log = JSON.parse(noteEntry.notes ?? "[]"); } catch {}
        const TYPE_LABEL: Record<string, string> = { note: "Note", call1: "Call 1", call2: "Call 2", call3: "Call 3" };
        const TYPE_COLOR: Record<string, [string, string]> = {
          note:  [C.border,  C.textSub],
          call1: ["#DBEAFE", "#2563EB"],
          call2: ["#EDE9FE", "#7C3AED"],
          call3: ["#CFFAFE", "#0E7490"],
        };
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
              {/* Header */}
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>Notes</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{noteEntry.name}</p>
                </div>
                <button onClick={() => setNoteEntry(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}><X size={16} /></button>
              </div>

              {/* Log */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 24px", display: "flex", flexDirection: "column", gap: 10, minHeight: 60 }}>
                {log.length === 0
                  ? <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "12px 0", margin: 0 }}>No notes yet</p>
                  : log.map((n, i) => {
                      const [bg, fg] = TYPE_COLOR[n.type] ?? TYPE_COLOR.note;
                      return (
                        <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: bg, color: fg }}>{TYPE_LABEL[n.type] ?? n.type}</span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            {n.editedAt && <span style={{ fontSize: 11, color: C.textMuted }}>· edited</span>}
                            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                              {me?.role === "super" && <span style={{ fontSize: 11, color: C.textMuted }}>{n.authorName || n.author.split("@")[0]}</span>}
                              {canEdit && (me?.role === "super" || n.author === me?.email) && editingNote?.index !== i && (
                                <button onClick={() => setEditingNote({ index: i, text: n.text })} title="Edit note" aria-label="Edit note"
                                  style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 2 }}>
                                  <Pencil size={12} />
                                </button>
                              )}
                            </span>
                          </div>
                          {editingNote?.index === i ? (
                            <>
                              <textarea autoFocus rows={3} value={editingNote.text}
                                onChange={e => setEditingNote({ index: i, text: e.target.value })}
                                style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
                              <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                                <Button size="sm" variant="ghost" onClick={() => setEditingNote(null)}>Cancel</Button>
                                <Button size="sm" loading={savingNote} disabled={!editingNote.text.trim()} onClick={saveNoteEdit}>Save</Button>
                              </div>
                            </>
                          ) : (
                            <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.text}</p>
                          )}
                        </div>
                      );
                    })
                }
              </div>

              {/* Input */}
              <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                {!canEdit ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button size="sm" variant="ghost" onClick={() => setNoteEntry(null)}>Close</Button>
                  </div>
                ) : noteType === null ? (
                  // Step 1 — pick type
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.textMuted, marginRight: 4 }}>Add:</span>
                    <Button size="sm" variant="secondary" onClick={() => setNoteType("note")}>Note</Button>
                    {(() => {
                      const maxCall = log.reduce((max, n) => { const m = n.type.match(/^call(\d+)$/); return m ? Math.max(max, +m[1]) : max; }, 0);
                      const next = maxCall + 1;
                      const callStyle: Record<number, [string, string]> = { 1: ["#2563EB","#BFDBFE"], 2: ["#7C3AED","#DDD6FE"], 3: ["#0E7490","#A5F3FC"] };
                      const [color, border] = callStyle[next] ?? ["#64748B","#E2E8F0"];
                      return <Button size="sm" variant="ghost" onClick={() => setNoteType(`call${next}`)} style={{ color, borderColor: border }}>📞 Call {next}</Button>;
                    })()}
                    <Button size="sm" variant="ghost" onClick={() => setNoteEntry(null)} style={{ marginLeft: "auto" }}>Close</Button>
                  </div>
                ) : (
                  // Step 2 — write text
                  <>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      {noteType === "note" ? "Note" : `📞 ${noteType.replace("call", "Call ")}`}
                    </p>
                    <textarea
                      autoFocus
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Write here…"
                      rows={3}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.text, background: C.bg, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Button size="sm" variant="ghost" onClick={() => { setNoteType(null); setNoteText(""); }}>← Back</Button>
                      <Button size="sm" loading={savingNote} disabled={!noteText.trim()} onClick={() => addNote(noteType)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setNoteEntry(null)} style={{ marginLeft: "auto" }}>Close</Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}


      {canAssign && summary && (
        <Card padding={0}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Caller assignments</p>
              <p style={{ fontSize: 12, color: C.textSub, margin: "2px 0 0" }}>
                {callers.length
                  ? "New RSVPs go to the caller with the fewest. Click a caller to filter the list."
                  : "No callers yet. Give a user a role that includes \"Caller\" to start auto-assigning."}
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={<Shuffle size={13} />} loading={rebalancing} onClick={runRebalance}
              title="Even out not-yet-called RSVPs across callers">Rebalance now</Button>
          </div>
          {callers.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
                <thead>
                  <tr>{["Caller", "Assigned", ...CALL_STYLE.map(c => c[0])].map((h, i) => (
                    <th key={h} style={{ padding: "8px 16px", textAlign: i ? "right" : "left", fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.borderLight}` }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {[...callers.map(c => ({ key: c.email, label: callerLabel(c), total: c.total, calls: c.calls as number[] | null })),
                    ...(summary.unassigned ? [{ key: "__none", label: "Unassigned", total: summary.unassigned, calls: null }] : [])].map(row => {
                    const on = callerFilter === row.key;
                    return (
                      <tr key={row.key} onClick={() => { setCallerFilter(on ? "" : row.key); setPage(1); }}
                        style={{ cursor: "pointer", background: on ? C.goldBg : undefined }}>
                        <td style={{ padding: "8px 16px", fontWeight: 600, color: row.calls ? C.text : C.orange }}>{row.label}</td>
                        <td style={{ padding: "8px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{row.total}</td>
                        {CALL_STYLE.map((_, i) => (
                          <td key={i} style={{ padding: "8px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: C.textSub }}>{row.calls ? row.calls[i] : "—"}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {canAssign && selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 14px", borderRadius: 10, background: C.text, color: "#fff", position: "sticky", top: 8, zIndex: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{selected.size} selected</span>
          <select defaultValue="" aria-label="Assign selected RSVPs to"
            onChange={e => { const v = e.target.value; e.target.value = ""; if (v) assign([...selected], v === "__none" ? null : v); }}
            style={{ ...selectStyle, padding: "6px 8px" }}>
            <option value="" disabled>Assign selected to…</option>
            {callers.map(c => <option key={c.email} value={c.email}>{callerLabel(c)}</option>)}
            <option value="__none">Unassign</option>
          </select>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} style={{ color: "#E2E8F0", borderColor: "rgba(255,255,255,0.25)" }}>Clear</Button>
        </div>
      )}

      {/* Table (desktop) / Cards (mobile) */}
      {desktop ? (
        <Table>
          <Thead>
            <Tr>
              {canAssign && <Th style={{ width: 36 }}>
                <input type="checkbox" checked={allPageSelected} aria-label="Select all on this page"
                  onChange={() => setSelected(prev => { const n = new Set(prev); pageIds.forEach(id => allPageSelected ? n.delete(id) : n.add(id)); return n; })} />
              </Th>}
              <Th>Name</Th><Th>Phone</Th><Th>Address</Th><Th>Location</Th><Th>Attending</Th><Th>Calls</Th>{canAssign && <Th>Assigned to</Th>}<Th>Status</Th><Th>Registered</Th>
              <Th style={{ textAlign: "right" }}>Actions</Th>
            </Tr>
          </Thead>
          <tbody>
            {loading ? <SkeletonRows /> : filtered.length === 0 ? (
              <Tr><Td style={{ padding: 0, border: "none" }} colSpan={canAssign ? 11 : 9}>
                <Empty icon={<Users size={40} />} title={search ? "No results" : "No registrations yet"} sub={search ? "Try a different search term" : "Registrations will appear here"} />
              </Td></Tr>
            ) : paginated.map(e => {
              const busy = acting === e.id; const confirm = toConfirm === e.id;
              const extra: Record<string, string> = e.extraData ? (() => { try { return JSON.parse(e.extraData); } catch { return {}; } })() : {};
              const customFields = fieldConfig.filter(f => f.custom && f.visible);
              const loc: { lat: number; lng: number; displayName: string } | null = e.location ? (() => { try { return JSON.parse(e.location); } catch { return null; } })() : null;
              const hasExtra = customFields.length > 0;
              const isExpanded = expanded === e.id;
              return (
                <Fragment key={e.id}>
                  <Tr style={{ opacity: busy ? 0.5 : 1, cursor: hasExtra ? "pointer" : "default", background: selected.has(e.id) ? C.goldBg : undefined }} onClick={() => hasExtra && setExpanded(isExpanded ? null : e.id)}>
                    {canAssign && <Td onClick={ev => ev.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSel(e.id)} aria-label={`Select ${e.name}`} />
                    </Td>}
                    <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={e.name} size={32} /><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{e.name}</span></div></Td>
                    <Td><span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSub }}>{e.whatsapp}</span></Td>
                    <Td style={{ maxWidth: 200 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.textSub, fontSize: 12 }}>{[e.village, e.postOffice, e.district, e.pinCode].filter(Boolean).join(", ") || e.address}</span>
                    </Td>
                    <Td style={{ maxWidth: 200 }}>
                      {loc
                        ? <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noopener noreferrer" onClick={ev => ev.stopPropagation()} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: C.gold, textDecoration: "none" }} title={loc.displayName}>📍 {loc.displayName}</a>
                        : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                      }
                    </Td>
                    <Td style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>{e.totalAttending ?? "—"}</Td>
                    <Td><CallBadge n={callCount(e.notes)} /></Td>
                    {canAssign && <Td>{assigneeSelect(e)}</Td>}
                    <Td>{e.waSent ? <Badge variant="green" icon={<CheckCircle size={10} />}>Sent</Badge> : <Badge variant="orange" icon={<Clock size={10} />}>Pending</Badge>}</Td>
                    <Td style={{ color: C.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Td>
                    <Td><div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={ev => ev.stopPropagation()}>
                      {confirm && canDelete
                        ? (<><Button variant="danger" size="sm" loading={busy} onClick={() => handleDelete(e.id)}>Confirm</Button><Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button></>)
                        : (<>
                            {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={12} />} style={{ padding: "5px 8px" }} onClick={() => openEdit(e)} title="Edit" />}
                            <Button variant="ghost" size="sm" icon={<MessageSquare size={12} />} style={{ padding: "5px 8px", color: e.notes ? C.gold : undefined }} onClick={() => { setNoteEntry(e); setNoteText(""); setNoteType(null); setEditingNote(null); }} title={e.notes ? "Notes" : "Add note"} />
                            {me?.role === "super" && <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />} style={{ padding: "5px 8px" }} loading={busy} onClick={() => handleResend(e.id)} title="Resend WhatsApp" />}
                            {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} style={{ padding: "5px 8px", color: C.red }} onClick={() => setToConfirm(e.id)} title="Delete" />}
                          </>)
                      }
                    </div></Td>
                  </Tr>
                  {isExpanded && hasExtra && (
                    <Tr>
                      <Td colSpan={canAssign ? 11 : 9} style={{ background: C.bg, padding: "10px 20px 14px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                          {customFields.map(f => (
                            <div key={f.key}>
                              <p style={{ fontSize: 10, color: C.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>{f.label}</p>
                              <p style={{ fontSize: 13, color: C.text, margin: "3px 0 0", fontWeight: 500 }}>{extra[f.key] || "—"}</p>
                            </div>
                          ))}
                        </div>
                      </Td>
                    </Tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? Array.from({ length: 4 }).map((_, i) => <Card key={i} padding={16}><Skeleton height={80} /></Card>) :
           filtered.length === 0 ? <Empty icon={<Users size={40} />} title={search ? "No results" : "No registrations yet"} /> :
           paginated.map(e => {
            const busy = acting === e.id; const confirm = toConfirm === e.id;
            const extra: Record<string, string> = e.extraData ? (() => { try { return JSON.parse(e.extraData); } catch { return {}; } })() : {};
            const customFields = fieldConfig.filter(f => f.custom && f.visible);
            const loc: { lat: number; lng: number; displayName: string } | null = e.location ? (() => { try { return JSON.parse(e.location); } catch { return null; } })() : null;
            return (
              <Card key={e.id} padding={14} style={{ opacity: busy ? 0.5 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  {canAssign && <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSel(e.id)} aria-label={`Select ${e.name}`} />}
                  <Avatar name={e.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{e.name}</p>
                    <a href={`tel:${e.whatsapp.replace(/[^\d+]/g, "")}`} style={{ display: "inline-block", fontSize: 13, color: C.textSub, margin: "2px 0 0", fontVariantNumeric: "tabular-nums", textDecoration: "none" }}>{e.whatsapp}</a>
                  </div>
                  {e.waSent ? <Badge variant="green" icon={<CheckCircle size={10} />}>Sent</Badge> : <Badge variant="orange" icon={<Clock size={10} />}>Pending</Badge>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "0 0 8px" }}>
                  <CallBadge n={callCount(e.notes)} />
                  {canAssign && assigneeSelect(e)}
                </div>
                <p style={{ fontSize: 12, color: C.textSub, margin: "0 0 6px", lineHeight: 1.5 }}>{[e.village, e.postOffice, e.district, e.pinCode].filter(Boolean).join(", ") || e.address}</p>
                {e.totalAttending && <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 6px" }}>Attending: <strong>{e.totalAttending}</strong></p>}
                {loc && (
                  <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 11, color: C.gold, textDecoration: "none", margin: "0 0 6px", lineHeight: 1.5 }}>
                    <span>📍</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{loc.displayName}</span>
                  </a>
                )}
                {customFields.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
                    {customFields.map(f => extra[f.key] ? (
                      <div key={f.key}>
                        <p style={{ fontSize: 10, color: C.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</p>
                        <p style={{ fontSize: 12, color: C.text, margin: "2px 0 0", fontWeight: 500 }}>{extra[f.key]}</p>
                      </div>
                    ) : null)}
                  </div>
                )}
                <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 10px" }}>Registered {new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                {confirm && canDelete ? (
                  <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ flex: 1, fontSize: 13, color: C.red, alignSelf: "center" }}>Delete this RSVP?</span>
                    <Button variant="secondary" onClick={() => setToConfirm(null)}>Cancel</Button>
                    <Button variant="danger" loading={busy} onClick={() => handleDelete(e.id)}>Delete</Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                    <a href={`tel:${e.whatsapp.replace(/[^\d+]/g, "")}`} style={{
                      flex: 1, minWidth: 96, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "9px 12px", borderRadius: 8, background: C.primary, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none",
                    }}><Phone size={14} /> Call</a>
                    <Button variant="secondary" icon={<MessageSquare size={14} />} style={{ flex: 1, minWidth: 96, color: e.notes ? "#9A7B45" : undefined }}
                      onClick={() => { setNoteEntry(e); setNoteText(""); setNoteType(null); setEditingNote(null); }}>
                      {e.notes ? "Notes" : "Add note"}
                    </Button>
                    {canEdit && <Button variant="ghost" icon={<Pencil size={14} />} onClick={() => openEdit(e)} aria-label="Edit" title="Edit" style={{ padding: "9px 12px" }} />}
                    {me?.role === "super" && <Button variant="ghost" icon={<RefreshCw size={14} />} loading={busy} onClick={() => handleResend(e.id)} aria-label="Resend WhatsApp" title="Resend WhatsApp" style={{ padding: "9px 12px" }} />}
                    {canDelete && <Button variant="ghost" icon={<Trash2 size={14} />} onClick={() => setToConfirm(e.id)} aria-label="Delete" title="Delete" style={{ padding: "9px 12px", color: C.red }} />}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={p => setPage(p)} />
    </div>
  );
}
