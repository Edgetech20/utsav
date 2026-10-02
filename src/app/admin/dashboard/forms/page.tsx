"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, ClipboardList, X, Eye } from "lucide-react";
import {
  C, Button, Badge, Card, PageHeader, Table, Thead, Th, Tbody, Td, Tr,
  Skeleton, Empty, Spinner, useDesktop,
} from "../ui";
import { useToast } from "../toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type FieldType = "text" | "date" | "datetime" | "textarea" | "select";
type TextFormat = "none" | "email" | "phone" | "numeric";

type FieldValidation = {
  format?: TextFormat;
  minLength?: number;
  maxLength?: number;
  minDate?: string;
  maxDate?: string;
  disallowPast?: boolean;
  disallowFuture?: boolean;
};

type Field = {
  id?: number;
  label: string;
  type: FieldType;
  placeholder: string;
  options: string[];
  validation: FieldValidation;
  required: boolean;
  order: number;
};

type Form = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  enabled: boolean;
  waEnabled: boolean;
  waTemplate: string | null;
  waNameField: string | null;
  waPhoneField: string | null;
  fieldCount: number;
  responseCount: number;
  createdAt: string;
};

type FullForm = Omit<Form, "fieldCount" | "responseCount"> & {
  fields: (Field & { id: number })[];
};

type Response = {
  id: number;
  data: string;
  submittedAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function emptyField(order: number): Field {
  return { label: "", type: "text", placeholder: "", options: [], validation: {}, required: true, order };
}

function parseOptions(raw: string | null | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

function parseValidation(raw: string | null | FieldValidation): FieldValidation {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

// ── Field editor row ──────────────────────────────────────────────────────────
function FieldRow({
  field, index, total,
  onChange, onRemove, onMove,
}: {
  field: Field; index: number; total: number;
  onChange: (f: Field) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const v = field.validation;
  const set = (patch: Partial<Field>) => onChange({ ...field, ...patch });
  const setV = (patch: Partial<FieldValidation>) => set({ validation: { ...v, ...patch } });

  const cell: React.CSSProperties = {
    padding: "6px 9px", border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 12, color: C.text, outline: "none", background: "#fff",
    boxSizing: "border-box", height: 32,
  };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 10px", background: C.bg, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>

      {/* reorder */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <button onClick={() => onMove(-1)} disabled={index === 0} style={{ border: "none", background: "none", cursor: index === 0 ? "not-allowed" : "pointer", color: C.textMuted, padding: 1, lineHeight: 1 }}><ChevronUp size={12} /></button>
        <button onClick={() => onMove(1)} disabled={index === total - 1} style={{ border: "none", background: "none", cursor: index === total - 1 ? "not-allowed" : "pointer", color: C.textMuted, padding: 1, lineHeight: 1 }}><ChevronDown size={12} /></button>
      </div>

      {/* label */}
      <input style={{ ...cell, width: 240 }} placeholder="Field label *" value={field.label}
        onChange={e => set({ label: e.target.value })} />

      {/* placeholder — text / textarea only */}
      {(field.type === "text" || field.type === "textarea") && (
        <input style={{ ...cell, width: 240 }} placeholder="Placeholder…"
          value={field.placeholder ?? ""} onChange={e => set({ placeholder: e.target.value })} />
      )}

      {/* right section fills remaining space */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>

        {/* type */}
        <select style={{ ...cell, flex: 1, minWidth: 100 }} value={field.type}
          onChange={e => set({ type: e.target.value as FieldType, options: [], validation: {} })}>
          <option value="text">Text</option>
          <option value="textarea">Text Box</option>
          <option value="date">Date</option>
          <option value="datetime">Date &amp; Time</option>
          <option value="select">Select</option>
        </select>

        {/* format — text only */}
        {field.type === "text" && (
          <select style={{ ...cell, flex: 1, minWidth: 100 }} value={v.format ?? "none"}
            onChange={e => setV({ format: e.target.value as TextFormat })}>
            <option value="none">Any text</option>
            <option value="email">Email</option>
            <option value="phone">Phone (IN)</option>
            <option value="numeric">Numeric</option>
          </select>
        )}

        {/* min / max length — text + textarea */}
        {(field.type === "text" || field.type === "textarea") && (
          <>
            <input type="number" min={0} style={{ ...cell, width: 64 }} value={v.minLength ?? ""} placeholder="Min"
              onChange={e => setV({ minLength: e.target.value ? Number(e.target.value) : undefined })} />
            <input type="number" min={0} style={{ ...cell, width: 64 }} value={v.maxLength ?? ""} placeholder="Max"
              onChange={e => setV({ maxLength: e.target.value ? Number(e.target.value) : undefined })} />
          </>
        )}

        {/* date constraints */}
        {field.type === "date" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={!!v.disallowPast} style={{ accentColor: C.primary }}
                onChange={e => setV({ disallowPast: e.target.checked || undefined })} /> No past
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={!!v.disallowFuture} style={{ accentColor: C.primary }}
                onChange={e => setV({ disallowFuture: e.target.checked || undefined })} /> No future
            </label>
          </>
        )}

        {/* datetime constraints — only past/future toggles, no min/max pickers */}
        {field.type === "datetime" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={!!v.disallowPast} style={{ accentColor: C.primary }}
                onChange={e => setV({ disallowPast: e.target.checked || undefined })} /> No past
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={!!v.disallowFuture} style={{ accentColor: C.primary }}
                onChange={e => setV({ disallowFuture: e.target.checked || undefined })} /> No future
            </label>
          </>
        )}

        {/* select options — inline comma-separated */}
        {field.type === "select" && (
          <input style={{ ...cell, flex: 1, minWidth: 120 }}
            placeholder="Option A, Option B, Option C"
            value={field.options.join(", ")}
            onChange={e => set({ options: e.target.value.split(",").map(s => s.trimStart()) })} />
        )}

        {/* required */}
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={field.required} style={{ accentColor: C.primary }}
            onChange={e => set({ required: e.target.checked })} /> Req
        </label>

        {/* remove */}
        <button onClick={onRemove} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 3, lineHeight: 1, marginLeft: "auto" }}>
          <X size={13} />
        </button>

      </div>
    </div>
  );
}

// ── Form Preview ──────────────────────────────────────────────────────────────
function FormPreview({ name, description, fields }: { name: string; description: string; fields: Field[] }) {
  const previewInput: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "7px 10px",
    border: "1px solid #CBD5E1", borderRadius: 7, fontSize: 13,
    color: "#94A3B8", background: "#F8FAFC", outline: "none", fontFamily: "inherit",
  };
  const previewLabel: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4, display: "block",
  };

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* form card */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "20px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: "0 0 4px" }}>
          {name.trim() || <span style={{ color: "#CBD5E1" }}>Form name…</span>}
        </h3>
        {description && (
          <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 16px", lineHeight: 1.5 }}>{description}</p>
        )}
        {!description && <div style={{ marginBottom: 16 }} />}

        {fields.length === 0 ? (
          <p style={{ fontSize: 12, color: "#CBD5E1", textAlign: "center", padding: "20px 0", border: "1px dashed #E2E8F0", borderRadius: 8 }}>
            Fields will appear here
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fields.map((f, i) => (
              <div key={i}>
                <label style={previewLabel}>
                  {f.label || <span style={{ color: "#CBD5E1" }}>Untitled field</span>}
                  {f.required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea disabled style={{ ...previewInput, height: 72, resize: "none" }}
                    placeholder={f.placeholder || "Your answer…"} />
                ) : f.type === "date" ? (
                  <input disabled type="date" style={previewInput} />
                ) : f.type === "datetime" ? (
                  <input disabled type="datetime-local" style={previewInput} />
                ) : f.type === "select" ? (
                  <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: "1px solid #CBD5E1", background: "#F8FAFC" }}>
                    {f.options.filter(o => o.trim()).map((o, j, arr) => (
                      <div key={j} style={{
                        flex: 1, textAlign: "center", padding: "7px 4px", fontSize: 12,
                        color: j === 0 ? "#475569" : "#94A3B8",
                        background: j === 0 ? "#E2E8F0" : "transparent",
                        borderRight: j < arr.length - 1 ? "1px solid #CBD5E1" : "none",
                      }}>{o}</div>
                    ))}
                  </div>
                ) : (
                  <input disabled type="text" style={previewInput}
                    placeholder={f.placeholder || "Your answer…"} />
                )}
              </div>
            ))}
            <button disabled style={{ marginTop: 4, padding: "9px 18px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "not-allowed", opacity: 0.7, alignSelf: "flex-start" }}>
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form Builder Modal ────────────────────────────────────────────────────────
function BuilderModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: FullForm | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName]         = useState(initial?.name ?? "");
  const [description, setDesc]  = useState(initial?.description ?? "");
  const [fields, setFields]     = useState<Field[]>(
    initial?.fields.map(f => ({
      ...f,
      options:    parseOptions(f.options as unknown as string | null),
      validation: parseValidation(f.validation as unknown as string | null),
    })) ?? []
  );
  const [waEnabled, setWaEnabled]       = useState(initial?.waEnabled ?? false);
  const [waNameField, setWaNameField]   = useState(initial?.waNameField ?? "");
  const [waPhoneField, setWaPhoneField] = useState(initial?.waPhoneField ?? "");
  const [saving, setSaving]             = useState(false);

  const isEdit = !!initial;
  const fieldLabels = fields.map(f => f.label).filter(Boolean);

  function addField() {
    setFields(prev => [...prev, emptyField(prev.length)]);
  }
  function removeField(i: number) {
    setFields(prev => prev.filter((_, idx) => idx !== i).map((f, idx) => ({ ...f, order: idx })));
  }
  function updateField(i: number, f: Field) {
    setFields(prev => prev.map((old, idx) => idx === i ? f : old));
  }
  function moveField(i: number, dir: -1 | 1) {
    setFields(prev => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((f, idx) => ({ ...f, order: idx }));
    });
  }

  async function save() {
    if (!name.trim()) { toast("Form name is required", "error"); return; }
    if (fields.some(f => !f.label.trim())) { toast("All fields need a label", "error"); return; }
    setSaving(true);
    const payload = {
      name, description,
      fields: fields.map((f, i) => ({
        ...f,
        order: i,
        options: f.type === "select" ? f.options.filter(o => o.trim()) : [],
        validation: Object.keys(f.validation).length ? f.validation : null,
      })),
      waEnabled, waNameField, waPhoneField,
    };

    const url  = isEdit ? `/api/forms/${initial!.slug}` : "/api/forms";
    const method = isEdit ? "PUT" : "POST";
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) { const e = await res.json(); toast(e.error ?? "Save failed", "error"); return; }
    toast(isEdit ? "Form updated" : "Form created", "success");
    onSaved();
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.text, outline: "none", background: "#fff",
    width: "100%", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: C.textSub, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", padding: "16px" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "95vw", height: "95vh", maxWidth: "none", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{isEdit ? "Edit Form" : "New Form"}</h2>
          <button onClick={onClose} style={{ border: "none", background: "#F1F5F9", borderRadius: 7, padding: 8, cursor: "pointer", display: "flex" }}>
            <X size={14} color={C.textSub} />
          </button>
        </div>

        {/* Two-column body */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", overflow: "hidden" }}>

          {/* Left — builder */}
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>

            {/* Basic info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Form Name *</label>
                <input style={inputStyle} placeholder="e.g. Volunteer Registration" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Description (optional)</label>
                <textarea style={{ ...inputStyle, height: 60, resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Brief description shown at the top of the form"
                  value={description} onChange={e => setDesc(e.target.value)} />
              </div>
            </div>

            {/* Fields */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Form Fields</p>
                <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={addField}>Add Field</Button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fields.length === 0 && (
                  <div style={{ textAlign: "center", padding: "28px 0", color: C.textMuted, fontSize: 13, border: `2px dashed ${C.border}`, borderRadius: 10 }}>
                    No fields yet. Click "Add Field" to start.
                  </div>
                )}
                {fields.map((f, i) => (
                  <FieldRow
                    key={i} field={f} index={i} total={fields.length}
                    onChange={updated => updateField(i, updated)}
                    onRemove={() => removeField(i)}
                    onMove={dir => moveField(i, dir)}
                  />
                ))}
              </div>
            </div>

            {/* WhatsApp config */}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: waEnabled ? 14 : 0 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>WhatsApp Notification</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: "3px 0 0" }}>Send a message on submission</p>
                </div>
                <button onClick={() => setWaEnabled(v => !v)} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: waEnabled ? C.green : C.textMuted }}>
                  {waEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              {waEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Which field is the person's name?</label>
                      <select style={{ ...inputStyle, fontSize: 12 }} value={waNameField} onChange={e => setWaNameField(e.target.value)}>
                        <option value="">— select —</option>
                        {fieldLabels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <p style={{ fontSize: 11, color: C.textMuted, margin: "4px 0 0" }}>Used to greet them in the message</p>
                    </div>
                    <div>
                      <label style={labelStyle}>Which field is their WhatsApp number?</label>
                      <select style={{ ...inputStyle, fontSize: 12 }} value={waPhoneField} onChange={e => setWaPhoneField(e.target.value)}>
                        <option value="">— select —</option>
                        {fieldLabels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <p style={{ fontSize: 11, color: C.textMuted, margin: "4px 0 0" }}>Message will be sent to this number</p>
                    </div>
                  </div>
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
                    <p style={{ fontSize: 12, color: C.textSub, margin: 0, lineHeight: 1.6 }}>
                      A sample template is auto-created in <strong>Operations → Templates</strong> as <em>&ldquo;{name.trim() || "Form Name"} Auto-Message&rdquo;</em>. Edit the body and enable it there.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — live preview */}
          <div style={{ borderLeft: `1px solid ${C.border}`, background: C.bg, overflowY: "auto", padding: "20px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Preview</p>
            <FormPreview name={name} description={description} fields={fields} />
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{isEdit ? "Save Changes" : "Create Form"}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Responses Modal ───────────────────────────────────────────────────────────
function ResponsesModal({ form, onClose }: { form: Form; onClose: () => void }) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState<number | null>(null);
  const desktop = useDesktop();

  useEffect(() => {
    fetch(`/api/forms/${form.slug}/responses`)
      .then(r => r.json())
      .then(data => { setResponses(Array.isArray(data) ? data : []); setLoading(false); });
  }, [form.slug]);

  async function del(id: number) {
    setDeleting(id);
    await fetch(`/api/forms/${form.slug}/responses`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    setResponses(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
    toast("Response deleted", "success");
  }

  // derive column headers from first response
  const cols = responses.length > 0 ? Object.keys(JSON.parse(responses[0].data)) : [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,23,42,0.5)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{form.name}</h2>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "3px 0 0" }}>{responses.length} responses</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#F1F5F9", borderRadius: 7, padding: 8, cursor: "pointer", display: "flex" }}>
            <X size={14} color={C.textSub} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
          ) : responses.length === 0 ? (
            <Empty icon={<ClipboardList size={40} />} title="No responses yet" sub="Submissions will appear here" />
          ) : desktop ? (
            <Table>
              <Thead>
                <Tr>
                  {cols.map(c => <Th key={c}>{c}</Th>)}
                  <Th>Submitted</Th>
                  <Th style={{ textAlign: "right" }}></Th>
                </Tr>
              </Thead>
              <Tbody>
                {responses.map(r => {
                  const d = JSON.parse(r.data);
                  return (
                    <Tr key={r.id} style={{ opacity: deleting === r.id ? 0.4 : 1 }}>
                      {cols.map(c => (
                        <Td key={c} style={{ maxWidth: 180 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: C.textSub }}>
                            {d[c] || "—"}
                          </span>
                        </Td>
                      ))}
                      <Td style={{ fontSize: 11, color: C.textMuted, whiteSpace: "nowrap" }}>
                        {new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </Td>
                      <Td>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={11} />}
                          loading={deleting === r.id}
                          onClick={() => del(r.id)} style={{ color: C.red }}>Delete</Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          ) : (
            // mobile cards
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {responses.map(r => {
                const d = JSON.parse(r.data);
                return (
                  <Card key={r.id} padding={14} style={{ opacity: deleting === r.id ? 0.4 : 1 }}>
                    {cols.map(c => (
                      <div key={c} style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c}</span>
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: C.text }}>{d[c] || "—"}</p>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 11, color: C.textMuted }}>
                        {new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={11} />}
                        loading={deleting === r.id}
                        onClick={() => del(r.id)} style={{ color: C.red }}>Delete</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FormsPage() {
  const { toast } = useToast();
  const desktop = useDesktop();
  const [forms, setForms]               = useState<Form[]>([]);
  const [loading, setLoading]           = useState(true);
  const [builder, setBuilder]           = useState<FullForm | null | "new">(null);
  const [responses, setResponses]       = useState<Form | null>(null);
  const [toggling, setToggling]         = useState<number | null>(null);
  const [deleting, setDeleting]         = useState<number | null>(null);
  const [toConfirm, setToConfirm]       = useState<number | null>(null);

  async function load() {
    const data = await fetch("/api/forms").then(r => r.json()).catch(() => []);
    setForms(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(form: Form) {
    setToggling(form.id);
    await fetch(`/api/forms/${form.slug}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !form.enabled }),
    });
    toast(form.enabled ? "Form disabled" : "Form enabled", "success");
    await load();
    setToggling(null);
  }

  async function openEdit(form: Form) {
    const data = await fetch(`/api/forms/${form.slug}`).then(r => r.json());
    setBuilder({ ...data, fieldCount: form.fieldCount, responseCount: form.responseCount });
  }

  async function del(form: Form) {
    setDeleting(form.id); setToConfirm(null);
    await fetch(`/api/forms/${form.slug}`, { method: "DELETE" });
    toast("Form deleted", "success");
    await load();
    setDeleting(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Form Builder"
        sub={`${forms.length} form${forms.length !== 1 ? "s" : ""} · ${forms.filter(f => f.enabled).length} active`}
        actions={
          <Button icon={<Plus size={14} />} onClick={() => setBuilder("new")}>New Form</Button>
        }
      />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => <Card key={i} padding={16}><Skeleton height={60} /></Card>)}
        </div>
      ) : forms.length === 0 ? (
        <Card>
          <Empty
            icon={<ClipboardList size={40} />}
            title="No forms yet"
            sub="Create your first form to start collecting responses"
          />
        </Card>
      ) : desktop ? (
        <Table>
          <Thead>
            <Tr>
              <Th>Form Name</Th>
              <Th>Slug</Th>
              <Th>Fields</Th>
              <Th>Responses</Th>
              <Th>Status</Th>
              <Th>WhatsApp</Th>
              <Th style={{ textAlign: "right" }}>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {forms.map(form => {
              const busy = toggling === form.id || deleting === form.id;
              const confirm = toConfirm === form.id;
              return (
                <Tr key={form.id} style={{ opacity: busy ? 0.5 : 1 }}>
                  <Td>
                    <p style={{ fontWeight: 600, color: C.text, margin: 0 }}>{form.name}</p>
                    {form.description && <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{form.description}</p>}
                  </Td>
                  <Td><code style={{ fontSize: 11, background: C.bg, padding: "2px 6px", borderRadius: 4, color: C.textSub }}>{form.slug}</code></Td>
                  <Td><Badge variant="gray">{form.fieldCount}</Badge></Td>
                  <Td>
                    <button onClick={() => setResponses(form)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <Badge variant="blue">{form.responseCount}</Badge>
                    </button>
                  </Td>
                  <Td>
                    <button onClick={() => toggle(form)} disabled={!!toggling} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: form.enabled ? C.green : C.textMuted }}>
                      {toggling === form.id ? <Spinner size={14} /> : form.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      <span style={{ fontSize: 12 }}>{form.enabled ? "Active" : "Disabled"}</span>
                    </button>
                  </Td>
                  <Td>{form.waEnabled ? <Badge variant="green" dot>On</Badge> : <Badge variant="gray">Off</Badge>}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Button variant="ghost" size="sm" icon={<Eye size={11} />} onClick={() => setResponses(form)}>Responses</Button>
                      <Button variant="ghost" size="sm" icon={<Edit2 size={11} />} onClick={() => openEdit(form)}>Edit</Button>
                      {confirm
                        ? <><Button variant="danger" size="sm" loading={deleting === form.id} onClick={() => del(form)}>Confirm</Button>
                            <Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button></>
                        : <Button variant="ghost" size="sm" icon={<Trash2 size={11} />} onClick={() => setToConfirm(form.id)} style={{ color: C.red }}>Delete</Button>
                      }
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      ) : (
        // mobile cards
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {forms.map(form => {
            const busy = toggling === form.id || deleting === form.id;
            const confirm = toConfirm === form.id;
            return (
              <Card key={form.id} padding={14} style={{ opacity: busy ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{form.name}</p>
                    <code style={{ fontSize: 10, color: C.textMuted }}>{form.slug}</code>
                  </div>
                  <button onClick={() => toggle(form)} disabled={!!toggling} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: form.enabled ? C.green : C.textMuted }}>
                    {toggling === form.id ? <Spinner size={18} /> : form.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <Badge variant="gray">{form.fieldCount} fields</Badge>
                  <Badge variant="blue">{form.responseCount} responses</Badge>
                  {form.waEnabled && <Badge variant="green" dot>WA On</Badge>}
                  {!form.enabled && <Badge variant="orange">Disabled</Badge>}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Button variant="ghost" size="sm" icon={<Eye size={11} />} onClick={() => setResponses(form)}>Responses</Button>
                  <Button variant="ghost" size="sm" icon={<Edit2 size={11} />} onClick={() => openEdit(form)}>Edit</Button>
                  {confirm
                    ? <><Button variant="danger" size="sm" loading={deleting === form.id} onClick={() => del(form)}>Confirm Delete</Button>
                        <Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button></>
                    : <Button variant="ghost" size="sm" icon={<Trash2 size={11} />} onClick={() => setToConfirm(form.id)} style={{ color: C.red }}>Delete</Button>
                  }
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Builder modal */}
      {builder !== null && (
        <BuilderModal
          initial={builder === "new" ? null : builder}
          onClose={() => setBuilder(null)}
          onSaved={load}
        />
      )}

      {/* Responses modal */}
      {responses !== null && (
        <ResponsesModal form={responses} onClose={() => setResponses(null)} />
      )}
    </div>
  );
}
