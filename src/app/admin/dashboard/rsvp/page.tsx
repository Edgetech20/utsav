"use client";

import { useEffect, useState, Fragment } from "react";
import { Trash2, RefreshCw, CheckCircle, Clock, Users, SlidersHorizontal, Save, X, Plus, Pencil, MessageSquare } from "lucide-react";
import { C, Badge, Button, Search, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Avatar, Pagination, Card, useDesktop } from "../ui";
import { useToast } from "../toast";

type Entry = { id: number; name: string; whatsapp: string; address: string; village: string | null; postOffice: string | null; district: string | null; pinCode: string | null; totalAttending: number | null; extraData: string | null; notes: string | null; location: string | null; submittedAt: string; waSent: boolean };

function SkeletonRows() {
  return (
    <>{Array.from({ length: 5 }).map((_, i) => (
      <Tr key={i}>
        <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Skeleton width={32} height={32} radius={99} /><Skeleton width={120} height={13} /></div></Td>
        <Td><Skeleton width={110} height={13} /></Td>
        <Td><Skeleton width={160} height={13} /></Td>
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
  const [acting, setActing]     = useState<number | null>(null);
  const [toConfirm, setToConfirm] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;
  const desktop = useDesktop();

  const [showEditor, setShowEditor] = useState(false);
  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>(DEFAULT_FIELDS); // for table display
  const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);           // for editor
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [me, setMe] = useState<{ role: string; permissions: { resource: string; action: string }[] } | null>(null);
  const canDelete = me?.role === "super";
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
    setLoading(false);
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
    // Refresh entries and keep modal open with updated notes
    const res = await fetch("/api/rsvp").then(r => r.json()).catch(() => ({}));
    const refreshed: Entry[] = res?.entries ?? [];
    setEntries(refreshed);
    const updated = refreshed.find(e => e.id === noteEntry!.id);
    if (updated) setNoteEntry(updated);
  }

  useEffect(() => {
    load();
    loadConfig();
    fetch("/api/admin/me").then(r => r.json()).then(setMe);
  }, []);

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

  const q = search.toLowerCase();
  const filtered = entries.filter(e =>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="RSVP Registrations"
        sub={`${entries.length} total · ${sent} messaged · ${pending} pending`}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Search placeholder="Search name, phone, address…" value={search} onChange={e => setSearch(e.target.value)} />
            <Button variant="ghost" icon={<SlidersHorizontal size={14} />} onClick={openEditor}>Edit Form</Button>
          </div>
        }
      />

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
        let log: { text: string; type: string; author: string; authorName?: string | null; createdAt: string }[] = [];
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
                            {me?.role === "super" && <span style={{ fontSize: 11, color: C.textMuted, marginLeft: "auto" }}>{n.authorName || n.author.split("@")[0]}</span>}
                          </div>
                          <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.text}</p>
                        </div>
                      );
                    })
                }
              </div>

              {/* Input */}
              <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                {noteType === null ? (
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

      {/* Summary pills */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Badge variant="gray" dot>{entries.length} Total</Badge>
        <Badge variant="green" dot>{sent} Messaged</Badge>
        <Badge variant="orange" dot>{pending} Pending</Badge>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      {desktop ? (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th><Th>Phone</Th><Th>Address</Th><Th>Attending</Th><Th>Status</Th><Th>Registered</Th>
              <Th style={{ textAlign: "right" }}>Actions</Th>
            </Tr>
          </Thead>
          <tbody>
            {loading ? <SkeletonRows /> : filtered.length === 0 ? (
              <Tr><Td style={{ padding: 0, border: "none" }} colSpan={7}>
                <Empty icon={<Users size={40} />} title={search ? "No results" : "No registrations yet"} sub={search ? "Try a different search term" : "Registrations will appear here"} />
              </Td></Tr>
            ) : paginated.map(e => {
              const busy = acting === e.id; const confirm = toConfirm === e.id;
              const extra: Record<string, string> = e.extraData ? (() => { try { return JSON.parse(e.extraData); } catch { return {}; } })() : {};
              const customFields = fieldConfig.filter(f => f.custom && f.visible);
              const loc: { lat: number; lng: number; displayName: string } | null = e.location ? (() => { try { return JSON.parse(e.location); } catch { return null; } })() : null;
              const hasExtra = customFields.length > 0 || !!loc;
              const isExpanded = expanded === e.id;
              return (
                <Fragment key={e.id}>
                  <Tr style={{ opacity: busy ? 0.5 : 1, cursor: hasExtra ? "pointer" : "default" }} onClick={() => hasExtra && setExpanded(isExpanded ? null : e.id)}>
                    <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={e.name} size={32} /><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{e.name}</span></div></Td>
                    <Td><span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSub }}>{e.whatsapp}</span></Td>
                    <Td style={{ maxWidth: 220 }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.textSub, fontSize: 12 }}>{[e.village, e.postOffice, e.district, e.pinCode].filter(Boolean).join(", ") || e.address}</span></Td>
                    <Td style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>{e.totalAttending ?? "—"}</Td>
                    <Td>{e.waSent ? <Badge variant="green" icon={<CheckCircle size={10} />}>Sent</Badge> : <Badge variant="orange" icon={<Clock size={10} />}>Pending</Badge>}</Td>
                    <Td style={{ color: C.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Td>
                    <Td><div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={ev => ev.stopPropagation()}>
                      {confirm && canDelete
                        ? (<><Button variant="danger" size="sm" loading={busy} onClick={() => handleDelete(e.id)}>Confirm</Button><Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button></>)
                        : (<>
                            <Button variant="ghost" size="sm" icon={<Pencil size={12} />} style={{ padding: "5px 8px" }} onClick={() => openEdit(e)} title="Edit" />
                            <Button variant="ghost" size="sm" icon={<MessageSquare size={12} />} style={{ padding: "5px 8px", color: e.notes ? C.gold : undefined }} onClick={() => { setNoteEntry(e); setNoteText(""); setNoteType(null); }} title={e.notes ? "Edit note" : "Add note"} />
                            {me?.role === "super" && <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />} style={{ padding: "5px 8px" }} loading={busy} onClick={() => handleResend(e.id)} title="Resend WhatsApp" />}
                            {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} style={{ padding: "5px 8px", color: C.red }} onClick={() => setToConfirm(e.id)} title="Delete" />}
                          </>)
                      }
                    </div></Td>
                  </Tr>
                  {isExpanded && hasExtra && (
                    <Tr>
                      <Td colSpan={7} style={{ background: C.bg, padding: "10px 20px 14px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                          {loc && (
                            <div style={{ flex: "0 0 100%", marginBottom: 4 }}>
                              <p style={{ fontSize: 10, color: C.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>Location</p>
                              <a
                                href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 13, color: C.gold, margin: "3px 0 0", fontWeight: 500, display: "flex", alignItems: "flex-start", gap: 5, textDecoration: "none" }}
                                onClick={ev => ev.stopPropagation()}
                              >
                                <span>📍</span>
                                <span style={{ lineHeight: 1.5 }}>{loc.displayName}</span>
                              </a>
                            </div>
                          )}
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
                  <Avatar name={e.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{e.name}</p>
                    <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>{e.whatsapp}</p>
                  </div>
                  {e.waSent ? <Badge variant="green" icon={<CheckCircle size={10} />}>Sent</Badge> : <Badge variant="orange" icon={<Clock size={10} />}>Pending</Badge>}
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {confirm
                      ? (<><Button variant="danger" size="sm" loading={busy} onClick={() => handleDelete(e.id)}>Confirm</Button><Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button></>)
                      : (<>
                          <Button variant="ghost" size="sm" icon={<Pencil size={12} />} style={{ padding: "5px 8px" }} onClick={() => openEdit(e)} title="Edit" />
                          <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />} style={{ padding: "5px 8px" }} loading={busy} onClick={() => handleResend(e.id)} title="Resend WhatsApp" />
                          <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} style={{ padding: "5px 8px", color: C.red }} onClick={() => setToConfirm(e.id)} title="Delete" />
                        </>)
                    }
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={p => setPage(p)} />
    </div>
  );
}
