"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { C, Card, PageHeader, Button, Spinner } from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";
import { CARD_SIZES } from "../card";

type S = { vol_form_slug?: string; vol_card_size?: string; forms?: { slug: string; name: string }[] };

export default function VolunteerSettingsPage() {
  const { toast } = useToast();
  const [s, setS] = useState<S | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/volunteer/settings").then(r => r.json()).then(setS); }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/volunteer/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vol_form_slug: s?.vol_form_slug ?? "", vol_card_size: s?.vol_card_size ?? "54x86" }),
    });
    setSaving(false);
    toast(res.ok ? "Settings saved" : "Failed to save", res.ok ? "success" : "error");
  }

  if (!s) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={22} /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader title="Volunteer Settings" sub="ID card designs are set per department in Departments" actions={<Button icon={<Save size={14} />} loading={saving} onClick={save}>Save</Button>} />
      <Card style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em" }}>Linked registration form</span>
        <select value={s.vol_form_slug ?? ""} onChange={e => setS({ ...s, vol_form_slug: e.target.value })}
          style={{ padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, maxWidth: 420 }}>
          <option value="">— None —</option>
          {s.forms?.map(f => <option key={f.slug} value={f.slug}>{f.name}</option>)}
        </select>
        <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
          Entries from this form appear under Volunteers → Import. Fields are matched by label: name, mobile/phone/whatsapp, address/village, department/team.
        </p>
      </Card>
      <Card style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em" }}>ID card print size</span>
        {Object.entries(CARD_SIZES).map(([k, z]) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
            <input type="radio" name="card_size" checked={(s.vol_card_size || "54x86") === k} onChange={() => setS({ ...s, vol_card_size: k })} />
            {z.label}
          </label>
        ))}
        <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
          Standard badge holders fit 54 × 86 mm only. Text and dragged field positions scale with the size.
        </p>
      </Card>
    </div>
  );
}
