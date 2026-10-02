"use client";

import { useEffect, useState } from "react";
import { FileText, Send, Users, Car, BedDouble } from "lucide-react";
import { C, Button, Badge, PageHeader, Card, Spinner } from "../ui";
import { useToast } from "../toast";

type Template = { id: number; key: string; name: string; body: string; enabled: boolean };

const GROUPS = [
  { value: "rsvp",          label: "RSVP registrants"              },
  { value: "accommodation",  label: "Accommodation registrants"      },
  { value: "vehicle",        label: "Vehicle / Parking registrants"  },
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
  const meta = TPL_META[tpl.key];
  const dirty = body !== tpl.body || enabled !== tpl.enabled;

  async function save() {
    setSaving(true);
    await onSave(tpl.key, body, enabled);
    setSaving(false);
  }

  return (
    <Card>
      {/* Header row */}
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
        <Button disabled={!dirty} loading={saving} onClick={save}>
          Save
        </Button>
      </div>
    </Card>
  );
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);

  // Broadcast state
  const [bcGroup, setBcGroup]     = useState("rsvp");
  const [bcCount, setBcCount]     = useState<number | null>(null);
  const [bcMsg, setBcMsg]         = useState("");
  const [bcSending, setBcSending] = useState(false);

  useEffect(() => {
    fetch("/api/wa-template").then(r => r.json()).then(d => {
      setTemplates(d);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setBcCount(null);
    fetch(`/api/wa-broadcast?group=${bcGroup}`).then(r => r.json()).then(d => setBcCount(d.count ?? 0));
  }, [bcGroup]);

  async function handleSave(key: string, body: string, enabled: boolean) {
    await fetch("/api/wa-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, body, enabled }),
    });
    setTemplates(prev => prev.map(t => t.key === key ? { ...t, body, enabled } : t));
    toast("Template saved", "success");
  }

  async function sendBroadcast() {
    if (!bcMsg.trim()) return;
    setBcSending(true);
    const res  = await fetch("/api/wa-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group: bcGroup, message: bcMsg }),
    });
    const data = await res.json();
    setBcSending(false);
    setBcMsg("");
    toast(`Queued ${data.queued} message${data.queued !== 1 ? "s" : ""}`, "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="Message Templates"
        sub="Auto-send settings and manual notifications via WhatsApp"
        actions={<Badge variant="blue" icon={<FileText size={11} />}>WhatsApp</Badge>}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {templates.map(tpl => (
              <TemplateCard key={tpl.key} tpl={tpl} onSave={handleSave} />
            ))}
          </div>
        )}
      </div>

      {/* ── Manual broadcast ── */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>
          Send Custom Notification
        </p>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Group picker */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                Recipients
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {GROUPS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setBcGroup(g.value)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                      border: `1px solid ${bcGroup === g.value ? C.primary : C.border}`,
                      background: bcGroup === g.value ? C.primary : "#fff",
                      color: bcGroup === g.value ? "#fff" : C.textSub,
                    }}
                  >
                    {g.label}
                    {bcGroup === g.value && bcCount !== null && (
                      <span style={{ marginLeft: 6, opacity: 0.7 }}>({bcCount})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                Message
              </label>
              <textarea
                value={bcMsg}
                onChange={e => setBcMsg(e.target.value)}
                rows={5}
                placeholder={`Use {name} for first name.\n\nE.g. Namaskar {name}, your accommodation is confirmed for 20 December.`}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px", border: `1px solid ${C.border}`,
                  borderRadius: 8, fontSize: 13, color: C.text,
                  resize: "vertical", fontFamily: "inherit", lineHeight: 1.7, outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Button
                icon={<Send size={13} />}
                disabled={!bcMsg.trim() || bcSending}
                loading={bcSending}
                onClick={sendBroadcast}
              >
                Send to {bcCount !== null ? bcCount : "…"} recipients
              </Button>
              {bcCount === 0 && (
                <span style={{ fontSize: 12, color: C.textMuted }}>No registrants in this group yet</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
