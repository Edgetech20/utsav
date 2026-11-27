"use client";

import { useEffect, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { C, Button, Spinner } from "@/app/admin/dashboard/ui";
import { useToast } from "@/app/admin/dashboard/toast";
import DeptManager, { type DeptFormState } from "@/app/camp/(auth)/manage/departments/DeptManager";
import { buildCardsHTML, parseLayout, CARD_SIZES, type CardOpts, type FieldKey } from "../card";

const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 };

function CardDesign({ form, setForm, titles }: { form: DeptFormState; setForm: (f: DeptFormState) => void; titles: CardOpts }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "id-card");
    const res = await fetch("/api/form-upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { toast(data.error ?? "Upload failed", "error"); return; }
    setForm({ ...form, cardBg: data.url });
  }

  // Drag fields inside the preview iframe; move the DOM live, save to the form on release (one iframe reload)
  function enableDrag(frame: HTMLIFrameElement) {
    const doc = frame.contentDocument;
    doc?.querySelectorAll<HTMLElement>(".f").forEach(el => {
      el.onpointerdown = e => {
        el.setPointerCapture(e.pointerId);
        const card = el.parentElement!.getBoundingClientRect();
        const pos = (ev: PointerEvent) => ({
          x: +Math.min(100, Math.max(0, (ev.clientX - card.left) / card.width * 100)).toFixed(1),
          y: +Math.min(100, Math.max(0, (ev.clientY - card.top) / card.height * 100)).toFixed(1),
        });
        el.onpointermove = ev => { const p = pos(ev); el.style.left = p.x + "%"; el.style.top = p.y + "%"; };
        el.onpointerup = ev => {
          el.onpointermove = el.onpointerup = null;
          const k = el.dataset.k as FieldKey;
          setForm({ ...form, cardLayout: JSON.stringify({ ...parseLayout(form.cardLayout), [k]: pos(ev) }) });
        };
      };
    });
  }

  const size = CARD_SIZES[titles.size ?? ""] ?? CARD_SIZES["54x86"];
  const px = (mm: number) => Math.ceil(mm * 3.78) + 12; // card + iframe padding/border
  const preview = buildCardsHTML(
    [{ code: `${form.code || "SEC"}-001`, name: "Sample Name", mobile: "9876543210", department: { name: form.name || "Department", cardBg: form.cardBg, cardText: form.cardText, cardLayout: form.cardLayout } }],
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
            Portrait, <strong>800 × 1200 px</strong>, with blank Name / Dept. / Ph No. lines. Without an image the default design is used.
          </p>
          {form.cardBg && <p style={{ fontSize: 11, color: C.textMuted, margin: "6px 0 0", lineHeight: 1.5 }}>
            <strong>Drag</strong> the dashed fields on the preview to line them up.{" "}
            {form.cardLayout && <button onClick={() => setForm({ ...form, cardLayout: "" })} style={{ border: "none", background: "none", padding: 0, color: C.gold, cursor: "pointer", fontSize: 11 }}>Reset positions</button>}
          </p>}
        </div>
        <div>
          <span style={label}>Text colour</span>
          <input type="color" value={form.cardText || "#0F172A"} onChange={e => setForm({ ...form, cardText: e.target.value })}
            style={{ width: 52, height: 32, border: `1px solid ${C.border}`, borderRadius: 7, padding: 2, background: C.surface }} />
        </div>
      </div>
      <iframe title="Card preview" srcDoc={preview} onLoad={e => enableDrag(e.currentTarget)} style={{ width: px(size.w), height: px(size.h), border: `1px solid ${C.border}`, borderRadius: 8, background: "#fff" }} />
    </div>
  );
}

export default function VolunteerDepartmentsPage() {
  const [titles, setTitles] = useState<CardOpts>({});
  useEffect(() => {
    fetch("/api/volunteer/settings").then(r => r.json()).then(s => setTitles({ title: s.event_title, titleSub: s.event_title_sub, size: s.vol_card_size }));
  }, []);

  return (
    <DeptManager
      api="/api/volunteer/departments" sub="Volunteer teams, their ID prefixes and ID card designs" members="volunteers" idLabel="IDs"
      extra={(form, setForm) => <CardDesign form={form} setForm={setForm} titles={titles} />}
    />
  );
}
