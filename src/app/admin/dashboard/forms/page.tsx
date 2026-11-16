"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, ClipboardList, X, Eye } from "lucide-react";
import * as Icons from "lucide-react";

// ponytail: imports all lucide icons for dynamic preview; acceptable for admin-only page
function LucideIcon({ name, size = 14 }: { name: string; size?: number }) {
  if (!name?.trim()) return null;
  const key = name.charAt(0).toUpperCase() + name.slice(1);
  const Icon = (Icons as Record<string, unknown>)[key] as React.ComponentType<{ size?: number }> | undefined;
  return Icon ? <Icon size={size} /> : <span style={{ fontSize: 9, color: "#EF4444" }}>?</span>;
}
import {
  C, Button, Badge, Card, PageHeader, Table, Thead, Th, Tbody, Td, Tr,
  Skeleton, Empty, Spinner, Pagination, Search, Avatar, useDesktop,
} from "../ui";
import { useToast } from "../toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type FieldType = "text" | "date" | "datetime" | "textarea" | "select" | "checkbox" | "file" | "section";
type TextFormat = "none" | "email" | "phone" | "numeric";

type FieldValidation = {
  format?: TextFormat;
  minLength?: number;
  maxLength?: number;
  minDate?: string;
  maxDate?: string;
  disallowPast?: boolean;
  disallowFuture?: boolean;
  accept?: "any" | "image" | "pdf" | "doc";
  selectStyle?: "pills" | "dropdown";
  selectIcons?: string[];
  colSpan?: "full" | "half";
  unique?: boolean;
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
  emailNotify: boolean;
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
  field, index, total, desktop,
  onChange, onRemove, onMove,
}: {
  field: Field; index: number; total: number; desktop: boolean;
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

  const icons = v.selectIcons ?? [];
  function addOpt() {
    onChange({ ...field, options: [...field.options, ""], validation: { ...v, selectIcons: [...icons, ""] } });
  }
  function removeOpt(i: number) {
    onChange({ ...field, options: field.options.filter((_, idx) => idx !== i), validation: { ...v, selectIcons: icons.filter((_, idx) => idx !== i) } });
  }
  function updateOptLabel(i: number, val: string) {
    const opts = [...field.options]; opts[i] = val; onChange({ ...field, options: opts });
  }
  function updateOptIcon(i: number, val: string) {
    const ic = [...icons]; ic[i] = val; onChange({ ...field, validation: { ...v, selectIcons: ic } });
  }

  const selectOptionsBuilder = (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {field.options.map((opt, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <input
            style={{ ...cell, width: 80, fontFamily: "monospace", fontSize: 11 }}
            placeholder="Icon name"
            value={icons[i] ?? ""}
            onChange={e => updateOptIcon(i, e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, color: C.textSub, flexShrink: 0 }}>
            <LucideIcon name={icons[i] ?? ""} size={13} />
          </div>
          <input
            style={{ ...cell, flex: 1 }}
            placeholder="Option label"
            value={opt}
            onChange={e => updateOptLabel(i, e.target.value)}
          />
          <button onClick={() => removeOpt(i)} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 2, lineHeight: 1, flexShrink: 0 }}>
            <X size={12} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addOpt}
        style={{ alignSelf: "flex-start", padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: "pointer", border: `1px dashed ${C.border}`, background: "none", color: C.textSub }}>
        + Add Option
      </button>
      <div style={{ display: "flex", gap: 6 }}>
        {(["pills", "dropdown"] as const).map(s => (
          <button key={s} type="button" onClick={() => setV({ selectStyle: s })}
            style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: "pointer",
              border: `1px solid ${(v.selectStyle ?? "pills") === s ? C.primary : C.border}`,
              background: (v.selectStyle ?? "pills") === s ? C.primary : "#fff",
              color: (v.selectStyle ?? "pills") === s ? "#fff" : C.textSub }}>
            {s === "pills" ? "Pills" : "Dropdown"}
          </button>
        ))}
      </div>
    </div>
  );

  const reorderBtns = (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
      <button onClick={() => onMove(-1)} disabled={index === 0} style={{ border: "none", background: "none", cursor: index === 0 ? "not-allowed" : "pointer", color: C.textMuted, padding: 1, lineHeight: 1 }}><ChevronUp size={12} /></button>
      <button onClick={() => onMove(1)} disabled={index === total - 1} style={{ border: "none", background: "none", cursor: index === total - 1 ? "not-allowed" : "pointer", color: C.textMuted, padding: 1, lineHeight: 1 }}><ChevronDown size={12} /></button>
    </div>
  );

  const typeSelect = (
    <select style={{ ...cell, width: "100%" }} value={field.type}
      onChange={e => set({ type: e.target.value as FieldType, options: [], validation: {} })}>
      <option value="text">Text</option>
      <option value="textarea">Text Box</option>
      <option value="date">Date</option>
      <option value="datetime">Date &amp; Time</option>
      <option value="select">Select</option>
      <option value="checkbox">Checkbox</option>
      <option value="file">File Upload</option>
      <option value="section">Section Header</option>
    </select>
  );

  const extras = (
    <>
      {field.type === "text" && (
        <select style={{ ...cell, width: "100%" }} value={v.format ?? "none"}
          onChange={e => setV({ format: e.target.value as TextFormat })}>
          <option value="none">Any text</option>
          <option value="email">Email</option>
          <option value="phone">Phone (IN)</option>
          <option value="numeric">Numeric</option>
        </select>
      )}
      {(field.type === "text" || field.type === "textarea") && (
        <div style={{ display: "flex", gap: 6 }}>
          <input type="number" min={0} style={{ ...cell, flex: 1 }} value={v.minLength ?? ""} placeholder="Min length"
            onChange={e => setV({ minLength: e.target.value ? Number(e.target.value) : undefined })} />
          <input type="number" min={0} style={{ ...cell, flex: 1 }} value={v.maxLength ?? ""} placeholder="Max length"
            onChange={e => setV({ maxLength: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
      )}
      {(field.type === "date" || field.type === "datetime") && (
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer" }}>
            <input type="checkbox" checked={!!v.disallowPast} style={{ accentColor: C.primary }}
              onChange={e => setV({ disallowPast: e.target.checked || undefined })} /> No past
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer" }}>
            <input type="checkbox" checked={!!v.disallowFuture} style={{ accentColor: C.primary }}
              onChange={e => setV({ disallowFuture: e.target.checked || undefined })} /> No future
          </label>
        </div>
      )}
      {field.type === "file" && (
        <select style={{ ...cell, width: "100%" }} value={v.accept ?? "any"}
          onChange={e => setV({ accept: e.target.value as "any" | "image" | "pdf" | "doc" })}>
          <option value="any">Any file</option>
          <option value="image">Images only</option>
          <option value="pdf">PDF only</option>
          <option value="doc">Word / PDF</option>
        </select>
      )}
      {field.type === "select" && selectOptionsBuilder}
    </>
  );

  if (!desktop) {
    return (
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 12px", background: C.bg, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* header row: reorder + remove */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {reorderBtns}
          {field.type !== "section" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.textSub, cursor: "pointer" }}>
                <input type="checkbox" checked={field.required} style={{ accentColor: C.primary }}
                  onChange={e => set({ required: e.target.checked })} /> Required
              </label>
              {!["checkbox", "file"].includes(field.type) && (
                <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.textSub, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!v.unique} style={{ accentColor: C.primary }}
                    onChange={e => setV({ unique: e.target.checked || undefined })} /> Unique
                </label>
              )}
              <div style={{ display: "flex", gap: 4 }}>
                {(["full", "half"] as const).map(s => (
                  <button key={s} type="button" onClick={() => setV({ colSpan: s })}
                    style={{ padding: "2px 8px", fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: "pointer",
                      border: `1px solid ${(v.colSpan ?? "full") === s ? C.primary : C.border}`,
                      background: (v.colSpan ?? "full") === s ? C.primary : "#fff",
                      color: (v.colSpan ?? "full") === s ? "#fff" : C.textSub }}>
                    {s === "full" ? "Full" : "½"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={onRemove} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, padding: 3, lineHeight: 1 }}>
            <X size={14} />
          </button>
        </div>
        <input style={{ ...cell, width: "100%" }} placeholder={field.type === "section" ? "Section title *" : "Field label *"} value={field.label}
          onChange={e => set({ label: e.target.value })} />
        {(field.type === "text" || field.type === "textarea" || field.type === "section") && (
          <input style={{ ...cell, width: "100%" }} placeholder={field.type === "section" ? "Subtitle (optional)" : "Placeholder…"}
            value={field.placeholder ?? ""} onChange={e => set({ placeholder: e.target.value })} />
        )}
        {typeSelect}
        {field.type !== "section" && extras}
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 10px", background: C.bg, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {reorderBtns}
      <input style={{ ...cell, width: 240 }} placeholder={field.type === "section" ? "Section title *" : "Field label *"} value={field.label}
        onChange={e => set({ label: e.target.value })} />
      {(field.type === "text" || field.type === "textarea" || field.type === "section") && (
        <input style={{ ...cell, width: 240 }} placeholder={field.type === "section" ? "Subtitle (optional)" : "Placeholder…"}
          value={field.placeholder ?? ""} onChange={e => set({ placeholder: e.target.value })} />
      )}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
        <select style={{ ...cell, flex: 1, minWidth: 100 }} value={field.type}
          onChange={e => set({ type: e.target.value as FieldType, options: [], validation: {} })}>
          <option value="text">Text</option>
          <option value="textarea">Text Box</option>
          <option value="date">Date</option>
          <option value="datetime">Date &amp; Time</option>
          <option value="select">Select</option>
          <option value="checkbox">Checkbox</option>
          <option value="file">File Upload</option>
          <option value="section">Section Header</option>
        </select>
        {field.type === "text" && (
          <select style={{ ...cell, flex: 1, minWidth: 100 }} value={v.format ?? "none"}
            onChange={e => setV({ format: e.target.value as TextFormat })}>
            <option value="none">Any text</option>
            <option value="email">Email</option>
            <option value="phone">Phone (IN)</option>
            <option value="numeric">Numeric</option>
          </select>
        )}
        {(field.type === "text" || field.type === "textarea") && (
          <>
            <input type="number" min={0} style={{ ...cell, width: 64 }} value={v.minLength ?? ""} placeholder="Min"
              onChange={e => setV({ minLength: e.target.value ? Number(e.target.value) : undefined })} />
            <input type="number" min={0} style={{ ...cell, width: 64 }} value={v.maxLength ?? ""} placeholder="Max"
              onChange={e => setV({ maxLength: e.target.value ? Number(e.target.value) : undefined })} />
          </>
        )}
        {(field.type === "date" || field.type === "datetime") && (
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
        {field.type === "file" && (
          <select style={{ ...cell, flex: 1, minWidth: 130 }} value={v.accept ?? "any"}
            onChange={e => setV({ accept: e.target.value as "any" | "image" | "pdf" | "doc" })}>
            <option value="any">Any file</option>
            <option value="image">Images only</option>
            <option value="pdf">PDF only</option>
            <option value="doc">Word / PDF</option>
          </select>
        )}
        {field.type === "select" && (
          <div style={{ width: "100%", marginTop: 4 }}>{selectOptionsBuilder}</div>
        )}
        {field.type !== "section" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={field.required} style={{ accentColor: C.primary }}
                onChange={e => set({ required: e.target.checked })} /> Req
            </label>
            {!["checkbox", "file"].includes(field.type) && (
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, cursor: "pointer", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={!!v.unique} style={{ accentColor: C.primary }}
                  onChange={e => setV({ unique: e.target.checked || undefined })} /> Uniq
              </label>
            )}
            {(["full", "half"] as const).map(s => (
              <button key={s} type="button" onClick={() => setV({ colSpan: s })}
                style={{ padding: "3px 8px", fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: "pointer", whiteSpace: "nowrap",
                  border: `1px solid ${(v.colSpan ?? "full") === s ? C.primary : C.border}`,
                  background: (v.colSpan ?? "full") === s ? C.primary : "#fff",
                  color: (v.colSpan ?? "full") === s ? "#fff" : C.textSub }}>
                {s === "full" ? "Full" : "½"}
              </button>
            ))}
          </>
        )}
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
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14 }}>
            {fields.map((f, i) => (
              <div key={i} style={{ gridColumn: (f.type === "section" || (f.validation.colSpan ?? "full") === "full") ? "span 2" : "span 1" }}>
                {f.type === "section" ? (
                  <div style={{ borderTop: `2px solid #E2E8F0`, paddingTop: 12, marginTop: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: 0 }}>{f.label || <span style={{ color: "#CBD5E1" }}>Section title</span>}</p>
                    {f.placeholder && <p style={{ fontSize: 11, color: "#94A3B8", margin: "3px 0 0" }}>{f.placeholder}</p>}
                  </div>
                ) : (
                <>
                {f.type !== "checkbox" && (
                  <label style={previewLabel}>
                    {f.label || <span style={{ color: "#CBD5E1" }}>Untitled field</span>}
                    {f.required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
                  </label>
                )}
                {f.type === "textarea" ? (
                  <textarea disabled style={{ ...previewInput, height: 72, resize: "none" }}
                    placeholder={f.placeholder || "Your answer…"} />
                ) : f.type === "date" ? (
                  <input disabled type="date" style={previewInput} />
                ) : f.type === "datetime" ? (
                  <input disabled type="datetime-local" style={previewInput} />
                ) : f.type === "file" ? (
                  <div style={{ border: "2px dashed #CBD5E1", borderRadius: 8, padding: "14px", textAlign: "center", background: "#F8FAFC", color: "#94A3B8", fontSize: 12 }}>
                    📎 Choose file to upload
                  </div>
                ) : f.type === "checkbox" ? (
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "not-allowed", opacity: 0.6 }}>
                    <input type="checkbox" disabled style={{ marginTop: 2, accentColor: "#3B82F6", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{f.label || "Confirmation text…"}</span>
                  </label>
                ) : f.type === "select" ? (
                  (f.validation.selectStyle ?? "pills") === "pills" ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {f.options.filter(o => o.trim()).map((o, j) => {
                        const iconName = (f.validation.selectIcons ?? [])[j] ?? "";
                        return (
                          <div key={j} style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: `1.5px solid ${j === 0 ? "#94A3B8" : "#E2E8F0"}`,
                            background: j === 0 ? "#E2E8F0" : "#fff",
                            color: j === 0 ? "#475569" : "#94A3B8",
                          }}>
                            {iconName && <LucideIcon name={iconName} size={12} />}
                            {o || "Option"}
                          </div>
                        );
                      })}
                      {f.options.filter(o => o.trim()).length === 0 && (
                        <div style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, border: "1.5px solid #E2E8F0", color: "#CBD5E1" }}>Option A</div>
                      )}
                    </div>
                  ) : (
                    <select disabled style={{ ...previewInput, cursor: "not-allowed" }}>
                      <option>— Select an option —</option>
                      {f.options.filter(o => o.trim()).map((o, j) => <option key={j}>{o}</option>)}
                    </select>
                  )
                ) : (
                  <input disabled type="text" style={previewInput}
                    placeholder={f.placeholder || "Your answer…"} />
                )}
                </>
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
  const desktop = useDesktop();
  const [name, setName]         = useState(initial?.name ?? "");
  const [description, setDesc]  = useState(initial?.description ?? "");
  const [fields, setFields]     = useState<Field[]>(
    initial?.fields.map(f => ({
      ...f,
      options:    parseOptions(f.options as unknown as string | null),
      validation: parseValidation(f.validation as unknown as string | null),
    })) ?? []
  );
  const [waEnabled, setWaEnabled]           = useState(initial?.waEnabled ?? false);
  const [waNameField, setWaNameField]       = useState(initial?.waNameField ?? "");
  const [waPhoneField, setWaPhoneField]     = useState(initial?.waPhoneField ?? "");
  const [emailNotify, setEmailNotify]       = useState(initial?.emailNotify ?? false);
  const [saving, setSaving]                 = useState(false);

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
      waEnabled, waNameField, waPhoneField, emailNotify,
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
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: desktop ? "1fr 320px" : "1fr", overflow: "hidden" }}>

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
                    key={i} field={f} index={i} total={fields.length} desktop={desktop}
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
                  <div style={{ display: "grid", gridTemplateColumns: desktop ? "1fr 1fr" : "1fr", gap: 10 }}>
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

            {/* Email notification */}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Email Notification</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: "3px 0 0" }}>Email all super admins on each submission</p>
                </div>
                <button onClick={() => setEmailNotify(v => !v)} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: emailNotify ? C.green : C.textMuted }}>
                  {emailNotify ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
            </div>
          </div>

          {/* Right — live preview (desktop only) */}
          {desktop && (
            <div style={{ borderLeft: `1px solid ${C.border}`, background: C.bg, overflowY: "auto", padding: "20px 18px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Preview</p>
              <FormPreview name={name} description={description} fields={fields} />
            </div>
          )}

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
const PAGE_SIZE = 20;
const FORMS_PAGE_SIZE = 10;

function safeParse(s: string): Record<string, string> {
  try { return JSON.parse(s); } catch { return {}; }
}

function ResponsesModal({ form, onClose }: { form: Form; onClose: () => void }) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [deleting, setDeleting]     = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [editId, setEditId]         = useState<number | null>(null);
  const [editData, setEditData]     = useState<Record<string, string>>({});
  const [saving, setSaving]         = useState(false);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const desktop = useDesktop();

  useEffect(() => {
    fetch(`/api/forms/${form.slug}/responses`)
      .then(r => r.json())
      .then(data => { setResponses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [form.slug]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function del(id: number) {
    setDeleting(id);
    setConfirmDel(null);
    const res = await fetch(`/api/forms/${form.slug}/responses`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    setDeleting(null);
    if (!res.ok) { toast("Delete failed — please try again", "error"); return; }
    setResponses(prev => prev.filter(r => r.id !== id));
    toast("Response deleted", "success");
  }

  async function saveEdit(id: number) {
    setSaving(true);
    const res = await fetch(`/api/forms/${form.slug}/responses`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, data: editData }),
    });
    setSaving(false);
    if (!res.ok) { toast("Update failed", "error"); return; }
    setResponses(prev => prev.map(r => r.id === id ? { ...r, data: JSON.stringify(editData) } : r));
    setEditId(null);
    toast("Response updated", "success");
  }

  // derive column headers from first response
  const cols     = responses.length > 0 ? Object.keys(safeParse(responses[0].data)) : [];
  const filtered = search.trim()
    ? responses.filter(r => {
        const q = search.toLowerCase();
        const d = safeParse(r.data);
        return Object.values(d).some(v => String(v ?? "").toLowerCase().includes(q));
      })
    : responses;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TH: React.CSSProperties = {
    padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
    color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em",
    whiteSpace: "nowrap", background: C.bg, borderBottom: `1px solid ${C.border}`,
  };
  const TD: React.CSSProperties = {
    padding: "12px 16px", verticalAlign: "middle", borderBottom: `1px solid ${C.borderLight}`,
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="responses-modal-title" style={{ position: "fixed", inset: 0, zIndex: 100, background: "#fff", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <div style={{ padding: desktop ? "20px 28px" : "14px 16px 0", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: desktop ? 20 : 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="responses-modal-title" style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.name}</h2>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "4px 0 0" }}>
              {loading ? "Loading…" : error ? "Failed to load" : `${responses.length} response${responses.length !== 1 ? "s" : ""}${search.trim() && filtered.length !== responses.length ? ` · ${filtered.length} matching` : ""}`}
            </p>
          </div>
          {desktop && (
            <Search
              placeholder="Search responses…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              width={260}
            />
          )}
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${C.border}`, background: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: C.textSub, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            <X size={14} /> Close
          </button>
        </div>
        {!desktop && (
          <div style={{ paddingBottom: 12 }}>
            <Search
              placeholder="Search responses…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              width="100%"
            />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", background: "#fff" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}><Spinner /></div>
        ) : error ? (
          <Empty icon={<ClipboardList size={40} />} title="Failed to load" sub="Please close and try again" />
        ) : responses.length === 0 ? (
          <Empty icon={<ClipboardList size={40} />} title="No responses yet" sub="Submissions will appear here" />
        ) : filtered.length === 0 ? (
          <Empty icon={<ClipboardList size={40} />} title="No matches" sub={`No responses match "${search}"`} />
        ) : desktop ? (
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr>
                <th style={{ ...TH, width: 52 }}>#</th>
                {cols.map(c => <th key={c} style={TH}>{c}</th>)}
                <th style={TH}>Submitted</th>
                <th style={{ ...TH, width: 130 }} aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, ri) => {
                const d = safeParse(r.data);
                const idx      = (page - 1) * PAGE_SIZE + ri + 1;
                const isDeleting = deleting === r.id;
                const isConfirm  = confirmDel === r.id;
                const isEditing  = editId === r.id;
                const firstName  = d[cols[0]] ?? "";
                return (
                  <tr key={r.id} style={{ opacity: isDeleting ? 0.4 : 1, background: isEditing ? "#EEF2FF" : isConfirm ? "#FFF5F5" : undefined }}>
                    <td style={{ ...TD, color: C.textMuted, fontSize: 11, fontWeight: 700, width: 52 }}>{idx}</td>
                    {cols.map((c, ci) => (
                      <td key={c} style={{ ...TD, maxWidth: 220 }}>
                        {isEditing ? (
                          <input
                            aria-label={c}
                            value={editData[c] ?? ""}
                            onChange={e => setEditData(prev => ({ ...prev, [c]: e.target.value }))}
                            style={{ width: "100%", padding: "5px 9px", border: `1.5px solid ${C.blue}`, borderRadius: 6, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box", background: "#fff" }}
                          />
                        ) : ci === 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <Avatar name={firstName || "?"} size={28} />
                            <span style={{ fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {firstName || <span style={{ color: C.textMuted }}>—</span>}
                            </span>
                          </div>
                        ) : (
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.textSub }}>
                            {d[c] || <span style={{ color: C.textMuted }}>—</span>}
                          </span>
                        )}
                      </td>
                    ))}
                    <td style={{ ...TD, whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>
                        {new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                        {new Date(r.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td style={{ ...TD, width: 130 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 5 }}>
                          <Button size="sm" loading={saving} onClick={() => saveEdit(r.id)}>Save</Button>
                          <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      ) : isConfirm ? (
                        <div style={{ display: "flex", gap: 5 }}>
                          <Button variant="danger" size="sm" loading={isDeleting} onClick={() => del(r.id)}>Delete</Button>
                          <Button variant="secondary" size="sm" onClick={() => setConfirmDel(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            onClick={() => { setConfirmDel(null); setEditId(r.id); setEditData(Object.fromEntries(cols.map(c => [c, d[c] ?? ""]))); }}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", color: C.textSub, fontSize: 12, fontWeight: 600 }}>
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            aria-label={`Delete response ${idx}`}
                            onClick={() => { setEditId(null); setEditData({}); setConfirmDel(r.id); }} disabled={isDeleting}
                            style={{ display: "flex", alignItems: "center", padding: "6px 9px", border: `1px solid ${C.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", color: C.textMuted }}>
                            {isDeleting ? <Spinner size={12} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {paged.map(r => {
              const d = safeParse(r.data);
              const isDeleting = deleting === r.id;
              const isConfirm  = confirmDel === r.id;
              const firstName  = d[cols[0]] ?? "";
              return (
                <Card key={r.id} padding={14} style={{ opacity: isDeleting ? 0.4 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Avatar name={firstName || "?"} size={36} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.text }}>{firstName || "—"}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textMuted }}>
                        {new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {new Date(r.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", paddingTop: 10, borderTop: `1px solid ${C.borderLight}` }}>
                    {cols.slice(1).map(c => (
                      <div key={c}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c}</span>
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: C.text }}>{d[c] || "—"}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, gap: 8 }}>
                    {isConfirm ? (
                      <>
                        <Button variant="danger" size="sm" loading={isDeleting} onClick={() => del(r.id)}>Delete</Button>
                        <Button variant="secondary" size="sm" onClick={() => setConfirmDel(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 10, color: C.textMuted, fontStyle: "italic", marginRight: "auto" }}>Edit on desktop</span>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={11} />}
                          loading={isDeleting} onClick={() => setConfirmDel(r.id)} style={{ color: C.red }}>Delete</Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {totalPages > 1 && (
        <div style={{ padding: "14px 28px", borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.bg }}>
          <Pagination page={page} total={filtered.length} perPage={PAGE_SIZE} onChange={setPage} />
        </div>
      )}

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
  const [formsPage, setFormsPage]       = useState(1);

  async function load() {
    const data = await fetch("/api/forms").then(r => r.json()).catch(() => []);
    setForms(Array.isArray(data) ? data : []);
    setFormsPage(1);
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

  const pagedForms = forms.slice((formsPage - 1) * FORMS_PAGE_SIZE, formsPage * FORMS_PAGE_SIZE);

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
            {pagedForms.map(form => {
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

      {forms.length > FORMS_PAGE_SIZE && (
        <Pagination page={formsPage} total={forms.length} perPage={FORMS_PAGE_SIZE} onChange={setFormsPage} />
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
