"use client";

import { useEffect, useState } from "react";
import { Phone, Globe, Save, Calendar, MapPin, Mail, User, Link2, Camera, Play, X } from "lucide-react";
import { Card, Button, C, useDesktop } from "../ui";
import { useToast } from "../toast";

type Vals = Record<string, string>;

const EVENT_FIELDS = [
  { key: "event_date",       label: "Display Date",        icon: Calendar, placeholder: "Sunday, 20 December 2026 | ৪ ই পৌষ, ১৪৩৩" },
  { key: "event_date_iso",   label: "ISO Date (countdown)", icon: Calendar, placeholder: "2026-12-20" },
  { key: "event_venue",      label: "Venue",               icon: MapPin,   placeholder: "Alinagar Playground, Bhatar, Purba Burdwan" },
  { key: "event_maps_url",   label: "Google Maps URL",     icon: Link2,    placeholder: "https://maps.google.com/..." },
  { key: "event_maps_embed", label: "Maps Embed URL",      icon: Link2,    placeholder: "https://maps.google.com/maps?q=...&output=embed" },
] as const;

const CONTACT_FIELDS = [
  { key: "contact_organiser", label: "Organiser Name", icon: User,  placeholder: "Purba Bardhaman North-Subdivision Satsang" },
  { key: "contact_phone",     label: "Phone",          icon: Phone, placeholder: "+91 XXXXX XXXXX" },
  { key: "contact_whatsapp",  label: "WhatsApp",       icon: Phone, placeholder: "+91 91535 71828" },
  { key: "contact_email",     label: "Email",          icon: Mail,  placeholder: "priyabodhimahotsav@gmail.com" },
] as const;

const SOCIAL_FIELDS = [
  { key: "social_facebook",  label: "Facebook",    icon: Globe,   placeholder: "https://facebook.com/yourpage" },
  { key: "social_instagram", label: "Instagram",   icon: Camera,  placeholder: "https://instagram.com/yourhandle" },
  { key: "social_youtube",   label: "YouTube",     icon: Play,    placeholder: "https://youtube.com/@yourchannel" },
  { key: "social_whatsapp",  label: "WhatsApp",    icon: Phone,   placeholder: "https://wa.me/91XXXXXXXXXX" },
  { key: "social_twitter",   label: "Twitter / X", icon: X,       placeholder: "https://x.com/yourhandle" },
  { key: "social_website",   label: "Website",     icon: Globe,   placeholder: "https://yourwebsite.com" },
] as const;

function FieldList({ fields, vals, onChange }: {
  fields: readonly { key: string; label: string; icon: React.ElementType; placeholder: string }[];
  vals: Vals;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <>
      {fields.map(({ key, label, icon: Icon, placeholder }, i) => (
        <div
          key={key}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 20px",
            borderBottom: i < fields.length - 1 ? `1px solid ${C.border}` : "none",
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: C.bg, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={16} color={C.textSub} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label}
            </label>
            <input
              value={vals[key] ?? ""}
              onChange={e => onChange(key, e.target.value)}
              placeholder={placeholder}
              style={{
                padding: "8px 11px", border: `1px solid ${C.border}`,
                borderRadius: 7, fontSize: 13, color: C.text,
                outline: "none", background: C.surface,
                width: "100%", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.09em", textTransform: "uppercase", margin: 0 }}>{label}</p>
      <Card padding={0}>{children}</Card>
    </div>
  );
}

export default function SettingsPage() {
  const toast   = useToast();
  const desktop = useDesktop();
  const [vals, setVals]     = useState<Vals>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => { setVals(d); setLoading(false); });
  }, []);

  function set(key: string, value: string) {
    setVals(v => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vals),
      });
      toast("Settings saved", "success");
    } catch {
      toast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Settings</p>
          <p style={{ fontSize: 12, color: C.textMuted, margin: "3px 0 0" }}>Changes reflect on the public page immediately after saving</p>
        </div>
        <Button onClick={save} loading={saving} icon={<Save size={14} />}>Save All</Button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: desktop ? "1fr 1fr" : "1fr", gap: 20, alignItems: "start" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Section label="Event Details">
              <FieldList fields={EVENT_FIELDS} vals={vals} onChange={set} />
            </Section>
            <Section label="Contact Details">
              <FieldList fields={CONTACT_FIELDS} vals={vals} onChange={set} />
            </Section>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Section label="Social Media Links">
              <FieldList fields={SOCIAL_FIELDS} vals={vals} onChange={set} />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
