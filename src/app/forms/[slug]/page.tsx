"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import * as Icons from "lucide-react";
function LucideIcon({ name, size = 14 }: { name: string; size?: number }) {
  if (!name?.trim()) return null;
  const key = name.charAt(0).toUpperCase() + name.slice(1);
  const Icon = (Icons as Record<string, unknown>)[key] as React.ComponentType<{ size?: number }> | undefined;
  return Icon ? <Icon size={size} /> : null;
}

type FieldValidation = {
  format?: "email" | "phone" | "numeric";
  minLength?: number;
  maxLength?: number;
  minDate?: string;
  maxDate?: string;
  disallowPast?: boolean;
  disallowFuture?: boolean;
  selectStyle?: "pills" | "dropdown";
  selectIcons?: string[];
  colSpan?: "full" | "half";
};

type Field = {
  id: number;
  label: string;
  type: "text" | "date" | "datetime" | "textarea" | "select" | "checkbox" | "file" | "section";
  placeholder: string | null;
  options: string | null;
  validation: string | null;
  required: boolean;
  order: number;
};

type FormData = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  fields: Field[];
};

const GOLD = "#C9A96E";
const DARK = "#0F172A";

function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function parseValidation(raw: string | null): FieldValidation {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function clientValidate(value: string, field: Field): string | null {
  if (field.type === "section") return null;
  if (field.type === "checkbox") {
    if (field.required && value !== "true") return `You must confirm: ${field.label}`;
    return null;
  }
  if (field.type === "file") {
    if (field.required && !value?.trim()) return `Please upload a file for: ${field.label}`;
    return null;
  }

  const trimmed = value?.trim() ?? "";
  if (field.required && !trimmed) return `${field.label} is required`;
  if (!trimmed) return null;

  const v = parseValidation(field.validation);

  if (field.type === "text" || field.type === "textarea") {
    if (v.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return "Please enter a valid email address";
    if (v.format === "phone" && !/^[6-9]\d{9}$/.test(trimmed.replace(/\D/g, "")))
      return "Enter a valid 10-digit Indian mobile number";
    if (v.format === "numeric" && !/^\d+$/.test(trimmed))
      return "Only numbers are allowed";
    if (v.minLength && trimmed.length < v.minLength)
      return `Minimum ${v.minLength} characters required`;
    if (v.maxLength && trimmed.length > v.maxLength)
      return `Maximum ${v.maxLength} characters allowed`;
  }

  if (field.type === "date" || field.type === "datetime") {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Please select a valid date";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (v.disallowPast && d < today) return "Date cannot be in the past";
    if (v.disallowFuture && d > today) return "Date cannot be in the future";
  }

  return null;
}

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [form, setForm]       = useState<FormData | null>(null);
  const [status, setStatus]   = useState<"loading" | "closed" | "notfound" | "ready" | "success">("loading");
  const [values, setValues]   = useState<Record<string, string>>({});
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSub]  = useState(false);
  const [serverErrors, setSE] = useState<string[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/forms/${slug}`)
      .then(async r => {
        if (r.status === 404) { setStatus("notfound"); return; }
        if (r.status === 410) { setStatus("closed"); return; }
        const data = await r.json();
        setForm(data);
        const init: Record<string, string> = {};
        data.fields.forEach((f: Field) => { if (f.type !== "section") init[f.label] = ""; });
        setValues(init);
        setStatus("ready");
      })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  async function uploadFile(label: string, file: File) {
    setUploading(prev => ({ ...prev, [label]: true }));
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/form-upload", { method: "POST", body: fd });
    setUploading(prev => ({ ...prev, [label]: false }));
    if (res.ok) {
      const { url } = await res.json();
      set(label, url);
    } else {
      setErrors(prev => ({ ...prev, [label]: "Upload failed. Try again." }));
    }
  }

  function set(label: string, val: string) {
    setValues(prev => ({ ...prev, [label]: val }));
    if (errors[label]) setErrors(prev => { const n = { ...prev }; delete n[label]; return n; });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    // client-side validate
    const errs: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.type === "section") continue;
      const err = clientValidate(values[field.label] ?? "", field);
      if (err) errs[field.label] = err;
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSub(true); setSE([]);
    const res = await fetch(`/api/forms/${slug}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSub(false);

    if (res.ok) {
      setStatus("success");
    } else {
      const body = await res.json();
      setSE(body.errors ?? [body.error ?? "Submission failed. Please try again."]);
    }
  }

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "12px 14px", fontSize: 15,
    border: "1.5px solid #E2E8F0", borderRadius: 10,
    outline: "none", background: "#fff", color: DARK,
    boxSizing: "border-box", transition: "border-color 0.15s",
    fontFamily: "inherit",
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (status === "notfound") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, margin: "0 0 12px" }}>🔍</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, margin: "0 0 8px" }}>Form not found</h2>
          <p style={{ color: "#64748B" }}>This form doesn't exist or the link may be incorrect.</p>
        </div>
      </div>
    );
  }

  // ── Closed ───────────────────────────────────────────────────────────────
  if (status === "closed") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, margin: "0 0 12px" }}>🚫</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, margin: "0 0 8px" }}>Form is closed</h2>
          <p style={{ color: "#64748B" }}>This form is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle size={36} color="#10B981" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DARK, margin: "0 0 10px" }}>Submitted!</h2>
          <p style={{ color: "#64748B", lineHeight: 1.6 }}>Your response has been recorded. Thank you for submitting.</p>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px 64px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .pub-input:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(201,169,110,0.15); }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg,#1a1a2e,#16213e)",
            fontSize: 22, fontWeight: 800, color: GOLD,
            marginBottom: 16,
          }}>
            প
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: DARK, margin: "0 0 8px" }}>{form!.name}</h1>
          {form!.description && (
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{form!.description}</p>
          )}
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E8ECF0", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: "32px 28px" }}>
          {serverErrors.length > 0 && (
            <div style={{ background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                {serverErrors.map((e, i) => <p key={i} style={{ fontSize: 13, color: "#EF4444", margin: i === 0 ? 0 : "4px 0 0" }}>{e}</p>)}
              </div>
            </div>
          )}

          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {form!.fields.map(field => {
              const err = errors[field.label];
              const v = parseValidation(field.validation);
              const opts = parseOptions(field.options);
              const span = (field.type === "section" || (v.colSpan ?? "full") === "full") ? "span 2" : "span 1";

              return (
                <div key={field.id} style={{ gridColumn: span }}>
                  {field.type === "section" ? (
                    <div style={{ borderTop: `2px solid #E2E8F0`, paddingTop: 16, marginTop: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>{field.label}</p>
                      {field.placeholder && <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>{field.placeholder}</p>}
                    </div>
                  ) : (
                  <>
                  {field.type !== "checkbox" && (
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 6 }}>
                      {field.label}
                      {field.required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
                    </label>
                  )}

                  {field.type === "text" && (
                    <input
                      type={v.format === "email" ? "email" : v.format === "numeric" ? "number" : "text"}
                      style={{ ...inputBase, borderColor: err ? "#FECACA" : "#E2E8F0" }}
                      placeholder={field.placeholder ?? ""}
                      value={values[field.label] ?? ""}
                      onChange={e => set(field.label, e.target.value)}
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      style={{ ...inputBase, height: 110, resize: "vertical", borderColor: err ? "#FECACA" : "#E2E8F0" }}
                      placeholder={field.placeholder ?? ""}
                      value={values[field.label] ?? ""}
                      onChange={e => set(field.label, e.target.value)}
                    />
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      style={{ ...inputBase, borderColor: err ? "#FECACA" : "#E2E8F0" }}
                      min={v.disallowPast ? new Date().toISOString().slice(0, 10) : v.minDate}
                      max={v.disallowFuture ? new Date().toISOString().slice(0, 10) : v.maxDate}
                      value={values[field.label] ?? ""}
                      onChange={e => set(field.label, e.target.value)}
                    />
                  )}

                  {field.type === "datetime" && (
                    <input
                      type="datetime-local"
                      style={{ ...inputBase, borderColor: err ? "#FECACA" : "#E2E8F0" }}
                      min={v.disallowPast ? new Date().toISOString().slice(0, 16) : undefined}
                      max={v.disallowFuture ? new Date().toISOString().slice(0, 16) : undefined}
                      value={values[field.label] ?? ""}
                      onChange={e => set(field.label, e.target.value)}
                    />
                  )}

                  {field.type === "checkbox" && (
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${err ? "#FECACA" : values[field.label] === "true" ? GOLD : "#E2E8F0"}`, background: values[field.label] === "true" ? "rgba(201,169,110,0.06)" : "#fff" }}>
                      <input type="checkbox"
                        checked={values[field.label] === "true"}
                        onChange={e => set(field.label, e.target.checked ? "true" : "")}
                        style={{ marginTop: 2, accentColor: GOLD, width: 16, height: 16, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: DARK, lineHeight: 1.5 }}>{field.label}{field.required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}</span>
                    </label>
                  )}

                  {field.type === "file" && (() => {
                    const v2 = v as { accept?: string };
                    const accept = v2.accept === "image" ? "image/*" : v2.accept === "pdf" ? "application/pdf" : v2.accept === "doc" ? ".doc,.docx,application/pdf" : "*";
                    const uploaded = values[field.label];
                    return (
                      <label style={{ display: "block", cursor: uploading[field.label] ? "wait" : "pointer" }}>
                        <input type="file" accept={accept} style={{ display: "none" }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(field.label, f); }} />
                        <div style={{ border: `2px dashed ${err ? "#FECACA" : uploaded ? GOLD : "#CBD5E1"}`, borderRadius: 10, padding: 16, textAlign: "center", background: uploaded ? "rgba(201,169,110,0.05)" : "#F8FAFC" }}>
                          {uploading[field.label] ? (
                            <span style={{ fontSize: 13, color: "#94A3B8" }}>Uploading…</span>
                          ) : uploaded ? (
                            <span style={{ fontSize: 13, color: GOLD, fontWeight: 600 }}>✓ File uploaded — tap to change</span>
                          ) : (
                            <span style={{ fontSize: 13, color: "#94A3B8" }}>📎 Tap to choose file</span>
                          )}
                        </div>
                      </label>
                    );
                  })()}

                  {field.type === "select" && (v.selectStyle ?? "pills") === "pills" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {opts.filter(o => o.trim()).map((o, oi) => {
                        const selected = values[field.label] === o;
                        const iconName = v.selectIcons?.[oi] ?? "";
                        return (
                          <button key={o} type="button"
                            onClick={() => set(field.label, selected ? "" : o)}
                            style={{
                              display: "flex", alignItems: "center", gap: 7,
                              padding: "9px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                              cursor: "pointer", transition: "all 0.15s",
                              border: `1.5px solid ${selected ? GOLD : "#E2E8F0"}`,
                              background: selected ? GOLD : "#fff",
                              color: selected ? "#fff" : DARK,
                              boxShadow: selected ? `0 0 0 3px rgba(201,169,110,0.2)` : "none",
                            }}>
                            {iconName && <LucideIcon name={iconName} size={16} />}
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {field.type === "select" && v.selectStyle === "dropdown" && (
                    <select
                      style={{ ...inputBase, cursor: "pointer", borderColor: err ? "#FECACA" : "#E2E8F0" }}
                      value={values[field.label] ?? ""}
                      onChange={e => set(field.label, e.target.value)}
                    >
                      <option value="">— Select an option —</option>
                      {opts.filter(o => o.trim()).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  )}

                  {err && (
                    <p style={{ fontSize: 12, color: "#EF4444", margin: "5px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={11} /> {err}
                    </p>
                  )}
                  </>
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              disabled={submitting}
              style={{
                gridColumn: "span 2",
                marginTop: 4, padding: "14px 24px",
                background: submitting ? "#94A3B8" : DARK,
                color: "#fff", border: "none", borderRadius: 11,
                fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.15s",
              }}
            >
              {submitting && (
                <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
              )}
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 20 }}>
          প্রিয়বোধী মহোৎসব
        </p>
      </div>
    </div>
  );
}
