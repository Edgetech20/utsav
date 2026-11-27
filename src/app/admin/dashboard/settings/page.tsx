"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Phone, Globe, Calendar, Shield, Music, Upload, RotateCcw } from "lucide-react";
import { Button, C, Skeleton, useDesktop } from "../ui";
import { useToast } from "../toast";

type Vals = Record<string, string>;

type Field = {
  key: string; label: string; placeholder: string;
  type?: "text" | "url" | "email" | "tel" | "date" | "number";
  help?: string; wide?: boolean;
};
type Group = { title: string; desc: string; fields: Field[] };
type SectionDef = { key: string; label: string; icon: React.ElementType; desc: string; groups: Group[] };

const SECTIONS: SectionDef[] = [
  {
    key: "event", label: "Event", icon: Calendar,
    desc: "What the invitation page shows at the top: titles, date and venue.",
    groups: [
      { title: "Headline", desc: "The text block at the top of the invitation, in display order.", fields: [
        { key: "event_honorific_line1", label: "Honorific line 1", placeholder: "যুগপুরুষোত্তম পরমপ্রেমময়", help: "Small text above the title" },
        { key: "event_honorific_line2", label: "Honorific line 2", placeholder: "শ্রীশ্রীঠাকুর অনুকূলচন্দ্রের", help: "Large text above the title" },
        { key: "event_title",           label: "Title, line 1",    placeholder: "প্ৰিয়বোধী" },
        { key: "event_title_sub",       label: "Title, line 2",    placeholder: "মহোৎসব" },
        { key: "event_edition",         label: "Edition / year tag", placeholder: "প্রথম বর্ষ" },
        { key: "event_subtitle",        label: "Subtitle",         placeholder: "Purba Bardhaman Sadar North Subdivision", help: "Shown under the title" },
      ]},
      { title: "Date", desc: "The display date is free text; the countdown uses the calendar date.", fields: [
        { key: "event_date",     label: "Display date",   placeholder: "Sunday, 20 December 2026 | ৪ ই পৌষ, ১৪৩৩", wide: true },
        { key: "event_date_iso", label: "Countdown date", placeholder: "2026-12-20", type: "date", help: "Drives the countdown timer" },
      ]},
      { title: "Venue & map", desc: "Where the event happens and the map guests see.", fields: [
        { key: "event_venue",      label: "Venue",           placeholder: "Alinagar Playground, Bhatar, Purba Burdwan", wide: true },
        { key: "event_maps_url",   label: "Google Maps link", placeholder: "https://maps.google.com/...", type: "url", wide: true, help: "Opens when guests tap Directions" },
        { key: "event_maps_embed", label: "Map embed URL",   placeholder: "https://maps.google.com/maps?q=...&output=embed", type: "url", wide: true, help: "Google Maps → Share → Embed a map, then paste the src URL" },
      ]},
    ],
  },
  {
    key: "contact", label: "Contact", icon: Phone,
    desc: "How guests reach the organisers.",
    groups: [
      { title: "Organiser", desc: "Shown in the contact section of the invitation.", fields: [
        { key: "contact_organiser", label: "Organiser name", placeholder: "Purba Bardhaman North-Subdivision Satsang", wide: true },
        { key: "contact_phone",     label: "Phone",    placeholder: "+91 XXXXX XXXXX", type: "tel" },
        { key: "contact_whatsapp",  label: "WhatsApp", placeholder: "+91 91535 71828", type: "tel" },
        { key: "contact_email",     label: "Email",    placeholder: "priyabodhimahotsav@gmail.com", type: "email", wide: true },
      ]},
    ],
  },
  {
    key: "social", label: "Social", icon: Globe,
    desc: "Links shown as icons on the invitation page.",
    groups: [
      { title: "Profiles", desc: "Use full profile URLs. Leave a field empty to hide its icon.", fields: [
        { key: "social_facebook",  label: "Facebook",    placeholder: "https://facebook.com/yourpage",    type: "url" },
        { key: "social_instagram", label: "Instagram",   placeholder: "https://instagram.com/yourhandle", type: "url" },
        { key: "social_youtube",   label: "YouTube",     placeholder: "https://youtube.com/@yourchannel", type: "url" },
        { key: "social_whatsapp",  label: "WhatsApp",    placeholder: "https://wa.me/91XXXXXXXXXX",       type: "url" },
        { key: "social_twitter",   label: "Twitter / X", placeholder: "https://x.com/yourhandle",         type: "url" },
        { key: "social_website",   label: "Website",     placeholder: "https://yourwebsite.com",          type: "url" },
      ]},
    ],
  },
  {
    key: "music", label: "Music", icon: Music,
    desc: "Background music on the invitation page.",
    groups: [{ title: "Background music", desc: "Upload replaces the current song immediately. Auto-play applies after saving.", fields: [] }],
  },
  {
    key: "security", label: "Security", icon: Shield,
    desc: "Admin sign-in behaviour.",
    groups: [
      { title: "Sessions", desc: "How long an admin stays signed in. Applies from the next login.", fields: [
        { key: "session_timeout_hours", label: "Session timeout (hours)", placeholder: "24", type: "number", help: "Default: 24 hours" },
      ]},
    ],
  },
];

const sectionKeys = (s: SectionDef) => [...s.groups.flatMap(g => g.fields.map(f => f.key)), ...(s.key === "music" ? ["music_autoplay"] : [])];

// :focus / :hover can't be inline styles
const CSS = `
.set-input { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid ${C.border}; border-radius: 8px;
  font: inherit; font-size: 13.5px; color: ${C.text}; background: ${C.surface}; transition: border-color .15s, box-shadow .15s; }
.set-input::placeholder { color: ${C.textMuted}; }
.set-input:hover { border-color: #CBD5E1; }
.set-input:focus { outline: none; border-color: ${C.gold}; box-shadow: 0 0 0 3px ${C.goldBg}; }
.set-tab:hover { color: ${C.text} !important; }
.set-tab:focus-visible, .set-check:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
`;

const WIDE = "(min-width: 1280px)";
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useWide = () => useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);

function FieldInput({ f, value, onChange }: { f: Field; value: string; onChange: (v: string) => void }) {
  const id = `set-${f.key}`;
  return (
    <div style={{ gridColumn: f.wide ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{f.label}</label>
      <input id={id} className="set-input" type={f.type ?? "text"} value={value}
        onChange={e => onChange(e.target.value)} placeholder={f.placeholder}
        min={f.type === "number" ? 1 : undefined}
        aria-describedby={f.help ? `${id}-help` : undefined} />
      {f.help && <p id={`${id}-help`} style={{ fontSize: 12, color: C.textSub, margin: 0 }}>{f.help}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const desktop   = useDesktop();
  const wide      = useWide();
  const [vals, setVals]       = useState<Vals>({});
  const [saved, setSaved]     = useState<Vals>({});
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState(SECTIONS[0].key);
  const [musicTs, setMusicTs]     = useState(() => Date.now());
  const [uploading, setUploading] = useState(false);
  const [hasSong, setHasSong]     = useState(false);
  const musicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => { setVals(d); setSaved(d); setLoading(false); });
    fetch("/music.mp3", { method: "HEAD" }).then(r => setHasSong(r.ok)).catch(() => {});
  }, []);

  const changed = (k: string) => (vals[k] ?? "") !== (saved[k] ?? "");
  const dirtyKeys = Object.keys({ ...vals, ...saved }).filter(changed);
  const dirty = dirtyKeys.length > 0;

  // warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  function set(key: string, value: string) {
    setVals(v => ({ ...v, [key]: value }));
  }

  async function uploadMusic(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await fetch("/api/admin/music", { method: "POST", body: form });
      if (!r.ok) throw new Error();
      setMusicTs(Date.now());
      setHasSong(true);
      toast("Song uploaded", "success");
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vals),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error);
      setSaved(vals);
      toast("Settings saved", "success");
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const section = SECTIONS.find(s => s.key === active)!;
  const sectionDirty = (s: SectionDef) => sectionKeys(s).some(changed);

  // Underline tabs across the top; scrolls sideways on narrow screens
  const nav = (
    <div role="tablist" aria-label="Settings sections" style={{ display: "flex", gap: 4, overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
      {SECTIONS.map(s => {
        const on = s.key === active; const Icon = s.icon;
        return (
          <button key={s.key} role="tab" aria-selected={on} aria-controls="set-panel" className="set-tab" onClick={() => setActive(s.key)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", marginBottom: -1, flexShrink: 0,
              border: "none", borderBottom: `2px solid ${on ? C.gold : "transparent"}`, background: "none",
              cursor: "pointer", fontSize: 14, color: on ? C.text : C.textSub, fontWeight: on ? 600 : 500,
            }}>
            <Icon size={16} color={on ? C.gold : C.textMuted} />
            {s.label}
            {sectionDirty(s) && <span title="Unsaved changes" style={{ width: 7, height: 7, borderRadius: 99, background: C.orange }} />}
          </button>
        );
      })}
    </div>
  );

  const groupBody = (g: Group) => g.fields.length > 0 ? (
    <div style={{ display: "grid", gridTemplateColumns: desktop ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: "18px 20px" }}>
      {g.fields.map(f => <FieldInput key={f.key} f={f} value={vals[f.key] ?? ""} onChange={v => set(f.key, v)} />)}
    </div>
  ) : (
    // Music
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Current song</p>
        {hasSong
          ? <audio key={musicTs} controls src={`/music.mp3?t=${musicTs}`} style={{ width: "100%", maxWidth: 520, height: 36 }} />
          : <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>No song uploaded yet. Guests hear nothing until you add one.</p>}
        <input ref={musicInputRef} type="file" accept="audio/*" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadMusic(f); e.target.value = ""; }} />
        <div>
          <Button variant="secondary" onClick={() => musicInputRef.current?.click()} loading={uploading} icon={<Upload size={14} />}>
            {hasSong ? "Replace song" : "Upload song"}
          </Button>
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <input type="checkbox" className="set-check" checked={vals.music_autoplay !== "false"}
          onChange={e => set("music_autoplay", e.target.checked ? "true" : "false")}
          style={{ width: 16, height: 16, marginTop: 2, accentColor: C.gold }} />
        <span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text }}>Auto-play when the page opens</span>
          <span style={{ display: "block", fontSize: 12, color: C.textSub, marginTop: 2 }}>Music starts after the visitor taps Enter on the splash screen.</span>
        </span>
      </label>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{CSS}</style>

      <header>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: C.textSub, margin: "4px 0 0" }}>Content and behaviour of the public invitation page. Changes go live when you save.</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {nav}

        <section id="set-panel" role="tabpanel" aria-labelledby="set-section-title" style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <div>
            <h2 id="set-section-title" style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{section.label}</h2>
            <p style={{ fontSize: 13, color: C.textSub, margin: "4px 0 0" }}>{section.desc}</p>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: desktop ? "1fr 1fr" : "1fr", gap: 20, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton width={110} height={12} /><Skeleton height={38} radius={8} />
                </div>
              ))}
            </div>
          ) : section.groups.map(g => (
            <div key={g.title} style={{
              display: "grid", gridTemplateColumns: wide ? "260px minmax(0, 1fr)" : "1fr",
              gap: wide ? 32 : 12, alignItems: "start",
            }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{g.title}</h3>
                <p style={{ fontSize: 12.5, color: C.textSub, margin: "4px 0 0", lineHeight: 1.5, maxWidth: "60ch" }}>{g.desc}</p>
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: desktop ? 24 : 16, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                {groupBody(g)}
              </div>
            </div>
          ))}

          {/* Save bar: only while there are unsaved edits; sticks to the bottom of the viewport */}
          {dirty && (
            <div style={{
              position: "sticky", bottom: 16, zIndex: 5,
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              padding: "12px 16px", borderRadius: 12,
              background: C.text, boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
            }}>
              <p role="status" style={{ flex: 1, minWidth: 160, margin: 0, fontSize: 13, color: "#fff" }}>
                You have {dirtyKeys.length} unsaved change{dirtyKeys.length > 1 ? "s" : ""}
              </p>
              <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} disabled={saving}
                onClick={() => setVals(saved)} style={{ color: "#E2E8F0", borderColor: "rgba(255,255,255,0.25)" }}>
                Discard
              </Button>
              <Button size="sm" onClick={save} loading={saving} style={{ background: C.gold, color: C.text }}>
                Save changes
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
