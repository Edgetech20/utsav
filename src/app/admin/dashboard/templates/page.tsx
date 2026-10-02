"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Send, Users, Car, BedDouble, X, CheckSquare, Square } from "lucide-react";
import { C, Button, Badge, PageHeader, Card, Spinner } from "../ui";
import { useToast } from "../toast";

type Template  = { id: number; key: string; name: string; body: string; enabled: boolean };
type Recipient = { name: string; mobile: string };

const GROUPS = [
  { value: "rsvp",          label: "RSVP"          },
  { value: "accommodation",  label: "Accommodation"  },
  { value: "vehicle",        label: "Vehicle"        },
];

const TPL_META: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  rsvp_auto: {
    label: "RSVP",
    icon: <Users size={15} />,
    desc: "Sent when someone submits the RSVP form",
  },
  accommodation_auto: {
    label: "Accommodation",
    icon: <BedDouble size={15} />,
    desc: "Sent when someone registers for accommodation",
  },
  vehicle_auto: {
    label: "Vehicle / Parking",
    icon: <Car size={15} />,
    desc: "Sent when someone registers a vehicle",
  },
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? C.green : C.border, position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function TemplateCard({ tpl, onSave }: { tpl: Template; onSave: (key: string, body: string, enabled: boolean) => Promise<void> }) {
  const [body, setBody]       = useState(tpl.body);
  const [enabled, setEnabled] = useState(tpl.enabled);
  const [saving, setSaving]   = useState(false);
  const meta  = TPL_META[tpl.key];
  const dirty = body !== tpl.body || enabled !== tpl.enabled;

  async function save() {
    setSaving(true);
    await onSave(tpl.key, body, enabled);
    setSaving(false);
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: C.borderLight, borderRadius: 8, padding: 7, display: "flex", color: C.textSub }}>
            {meta?.icon}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{meta?.label ?? tpl.name}</p>
            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{meta?.desc}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: enabled ? C.green : C.textMuted, fontWeight: 600 }}>
            {enabled ? "On" : "Off"}
          </span>
          <Toggle on={enabled} onChange={setEnabled} />
        </div>
      </div>

      <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
        Use <code style={{ background: C.borderLight, padding: "1px 5px", borderRadius: 4 }}>{"{name}"}</code> for first name.
      </p>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={6}
        disabled={!enabled}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "10px 12px", border: `1px solid ${C.border}`,
          borderRadius: 8, fontSize: 13, color: enabled ? C.text : C.textMuted,
          resize: "vertical", fontFamily: "inherit", lineHeight: 1.7, outline: "none",
          background: enabled ? "#fff" : C.borderLight,
          transition: "background 0.15s",
        }}
      />

      <div style={{ marginTop: 10 }}>
        <Button disabled={!dirty} loading={saving} onClick={save}>Save</Button>
      </div>
    </Card>
  );
}

// ── Compose modal ─────────────────────────────────────────────────────────────
function ComposeModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (msg: string, selected: Recipient[]) => Promise<void>;
}) {
  const [group, setGroup]       = useState("rsvp");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [rcLoading, setRcLoading]   = useState(false);
  const [msg, setMsg]           = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending]   = useState(false);
  const allSelected = recipients.length > 0 && selected.size === recipients.length;

  useEffect(() => {
    setRcLoading(true);
    fetch(`/api/wa-broadcast?group=${group}`)
      .then(r => r.json())
      .then(d => {
        const list: Recipient[] = d.recipients ?? [];
        setRecipients(list);
        setSelected(new Set(list.map(r => r.mobile)));
        setRcLoading(false);
      });
  }, [group]);

  function toggleOne(mobile: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(mobile) ? next.delete(mobile) : next.add(mobile);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(recipients.map(r => r.mobile)));
  }

  async function handleSend() {
    if (!msg.trim() || selected.size === 0) return;
    setSending(true);
    await onSend(msg, recipients.filter(r => selected.has(r.mobile)));
    setSending(false);
    onClose();
  }

  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Backdrop — no close on click per existing pattern */}
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.5)" }} />

      <div
        ref={ref}
        style={{
          position: "fixed", inset: 0, zIndex: 51,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        <div style={{
          background: "#fff", borderRadius: 16, width: "90vw", height: "88vh",
          boxShadow: "0 12px 60px rgba(0,0,0,0.22)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{ padding: "18px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: C.text }}>Compose Message</p>
            <button
              onClick={onClose}
              style={{ border: "none", background: C.borderLight, borderRadius: 7, padding: 7, cursor: "pointer", color: C.textSub, display: "flex" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Two-column body */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, minHeight: 0 }}>

            {/* Left — group picker + message + send */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24, borderRight: `1px solid ${C.border}` }}>
              {/* Group picker */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>
                  Send To
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {GROUPS.map(g => (
                    <button
                      key={g.value}
                      onClick={() => setGroup(g.value)}
                      style={{
                        padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                        border: `1px solid ${group === g.value ? C.primary : C.border}`,
                        background: group === g.value ? C.primary : "#fff",
                        color: group === g.value ? "#fff" : C.textSub,
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  Message
                </label>
                <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                  Use <code style={{ background: C.borderLight, padding: "1px 4px", borderRadius: 3 }}>{"{name}"}</code> for first name.
                </p>
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  autoFocus
                  placeholder={`Namaskar {name}, your registration is confirmed.`}
                  style={{
                    flex: 1, width: "100%", boxSizing: "border-box",
                    padding: "12px 14px", border: `1px solid ${C.border}`,
                    borderRadius: 10, fontSize: 14, color: C.text,
                    resize: "none", fontFamily: "inherit", lineHeight: 1.8, outline: "none",
                  }}
                />
              </div>

              {/* Send button */}
              <Button
                icon={<Send size={14} />}
                disabled={!msg.trim() || selected.size === 0 || sending}
                loading={sending}
                onClick={handleSend}
                size="lg"
              >
                Send to {selected.size} recipient{selected.size !== 1 ? "s" : ""}
              </Button>
            </div>

            {/* Right — recipient list */}
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* List header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Recipients ({selected.size}/{recipients.length})
                </label>
                <button
                  onClick={toggleAll}
                  style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.primary }}
                >
                  {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Scrollable list */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {rcLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                    <Spinner size={22} color={C.textMuted} />
                  </div>
                ) : recipients.length === 0 ? (
                  <p style={{ margin: 0, padding: "20px 20px", fontSize: 13, color: C.textMuted }}>No registrants in this group.</p>
                ) : recipients.map((r, i) => {
                  const checked = selected.has(r.mobile);
                  return (
                    <div
                      key={r.mobile}
                      onClick={() => toggleOne(r.mobile)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 20px", cursor: "pointer",
                        borderBottom: `1px solid ${C.borderLight}`,
                        background: checked ? "#F0FDF4" : "#fff",
                        transition: "background 0.1s",
                      }}
                    >
                      {checked
                        ? <CheckSquare size={16} color={C.green} />
                        : <Square size={16} color={C.textMuted} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{r.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{r.mobile}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);

  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    fetch("/api/wa-template").then(r => r.json()).then(d => {
      setTemplates(d);
      setLoading(false);
    });
  }, []);

  async function handleSave(key: string, body: string, enabled: boolean) {
    await fetch("/api/wa-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, body, enabled }),
    });
    setTemplates(prev => prev.map(t => t.key === key ? { ...t, body, enabled } : t));
    toast("Template saved", "success");
  }

  async function handleSend(msg: string, selected: Recipient[]) {
    const res  = await fetch("/api/wa-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: selected, message: msg }),
    });
    const data = await res.json();
    toast(`Queued ${data.queued} message${data.queued !== 1 ? "s" : ""}`, "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="Message Templates"
        sub="Auto-send settings and manual notifications via WhatsApp"
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="blue" icon={<FileText size={11} />}>WhatsApp</Badge>
            <Button size="sm" icon={<Send size={12} />} onClick={() => setComposeOpen(true)}>
              Add Custom Message
            </Button>
          </div>
        }
      />

      {/* ── Auto-send templates ── */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>
          Auto-Send Templates
        </p>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Spinner size={24} color={C.textMuted} />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {templates.map(tpl => (
              <TemplateCard key={tpl.key} tpl={tpl} onSave={handleSave} />
            ))}
          </div>
        )}
      </div>


      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSend={handleSend}
        />
      )}
    </div>
  );
}
