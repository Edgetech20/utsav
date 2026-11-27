"use client";

import { useEffect, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { C, Button, Spinner } from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";
import DeptManager, { type DeptFormState } from "@/app/camp/(auth)/manage/departments/DeptManager";
import { buildCardsHTML, type CardOpts } from "../card";

const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 };

function CardDesign({ form, setForm, titles }: { form: DeptFormState; setForm: (f: DeptFormState) => void; titles: CardOpts }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/form-upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { toast(data.error ?? "Upload failed", "error"); return; }
    setForm({ ...form, cardBg: data.url });
  }

  const preview = buildCardsHTML(
    [{ code: `${form.code || "SEC"}-001`, name: "Sample Name", department: { name: form.name || "Department", cardBg: form.cardBg, cardText: form.cardText } }],
    titles, false,
  );

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 170px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <span style={label}>ID card background</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <label style={{ display: "inline-flex" }}>
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, color: C.textSub, cursor: "pointer" }}>
                {uploading ? <Spinner size={12} /> : <Upload size={13} />} Upload
              </span>
            </label>
            {form.cardBg && <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => setForm({ ...form, cardBg: "" })}>Remove</Button>}
          </div>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "6px 0 0", lineHeight: 1.5 }}>
            Portrait, <strong>638 × 1016 px</strong>. Keep the bottom 35% plain for name and ID. Without an image the default design is used.
          </p>
        </div>
        <div>
          <span style={label}>Text colour</span>
          <input type="color" value={form.cardText || "#0F172A"} onChange={e => setForm({ ...form, cardText: e.target.value })}
            style={{ width: 52, height: 32, border: `1px solid ${C.border}`, borderRadius: 7, padding: 2, background: C.surface }} />
        </div>
      </div>
      <iframe title="Card preview" srcDoc={preview} style={{ width: 215, height: 340, border: `1px solid ${C.border}`, borderRadius: 8, background: "#fff" }} />
    </div>
  );
}

export default function VolunteerDepartmentsPage() {
  const [titles, setTitles] = useState<CardOpts>({});
  useEffect(() => {
    fetch("/api/volunteer/settings").then(r => r.json()).then(s => setTitles({ title: s.event_title, titleSub: s.event_title_sub }));
  }, []);

  return (
    <DeptManager
      api="/api/volunteer/departments" sub="Volunteer teams, their ID prefixes and ID card designs" members="volunteers" idLabel="IDs"
      extra={(form, setForm) => <CardDesign form={form} setForm={setForm} titles={titles} />}
    />
  );
}
