"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Upload, ChevronUp, ChevronDown, Plus, ExternalLink, Navigation, ImageIcon, X, Pencil, GripVertical } from "lucide-react";
import { C, Button, PageHeader, Card, Input, Spinner } from "../ui";
import { useToast } from "../toast";

type AttractionImage = { id: number; imageUrl: string };
type Attraction = { id: number; name: string; order: number; url: string | null; navigateToVenue: boolean; formSlug: string | null; images: AttractionImage[] };
type FormOption = { id: number; name: string; slug: string };

const DEFAULTS = [
  "Accommodation", "Bus & Car Parking", "Medical Camp", "Cheap Canteen",
  "Jajan Parikrama", "Diksha Grahan", "Photo Gallery", "Ananda Bazar",
  "Music Event", "Istaprasanga", "Cultural Events", "Drama", "Suggestions", "And Many More…",
];
const PROTECTED = ["Accommodation", "Bus & Car Parking"];

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}
      onClick={onClose}
    >
      <Card
        padding={0}
        style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>{title}</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}>
            <X size={17} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </Card>
    </div>
  );
}

// ── Image strip ───────────────────────────────────────────────────────────────
function ImageStrip({ images, onRemove }: { images: AttractionImage[]; onRemove: (id: number) => void }) {
  if (!images.length) return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: 12, padding: "6px 0" }}>
      <ImageIcon size={14} /> No images — default icon shows
    </div>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {images.map(img => (
        <div key={img.id} style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.imageUrl} alt="" style={{ width: 80, height: 52, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}`, display: "block" }} />
          <button
            onClick={() => onRemove(img.id)}
            style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: C.red, color: "#fff", border: "none", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}
          >×</button>
        </div>
      ))}
    </div>
  );
}

// ── Shared form fields ────────────────────────────────────────────────────────
type AttractionForm = { name: string; url: string; navigateToVenue: boolean; formSlug: string };

function FormFields({ form, setForm, forms }: { form: AttractionForm; setForm: (f: AttractionForm) => void; forms: FormOption[] }) {
  const selectStyle: React.CSSProperties = {
    padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.text, outline: "none", background: C.surface,
    width: "100%", boxSizing: "border-box",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input label="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cultural Events" />
      <Input label="URL (optional)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
          Link a Registration Form (optional)
        </label>
        <select style={selectStyle} value={form.formSlug} onChange={e => setForm({ ...form, formSlug: e.target.value })}>
          <option value="">— no form —</option>
          {forms.map(f => <option key={f.slug} value={f.slug}>{f.name}</option>)}
        </select>
        <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Shows a Register button inside this attraction on the public page.</p>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textSub, cursor: "pointer" }}>
        <input type="checkbox" checked={form.navigateToVenue} onChange={e => setForm({ ...form, navigateToVenue: e.target.checked })} />
        Show "Navigate to Venue" button
      </label>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AttractionsPage() {
  const { toast } = useToast();
  const [list, setList]           = useState<Attraction[]>([]);
  const [forms, setForms]         = useState<FormOption[]>([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ name: "", url: "", navigateToVenue: false, formSlug: "" });
  const [addFiles, setAddFiles]   = useState<File[]>([]);
  const addFileRef                = useRef<HTMLInputElement>(null);
  const [editTarget, setEditTarget] = useState<Attraction | null>(null);
  const [editForm, setEditForm]   = useState({ name: "", url: "", navigateToVenue: false, formSlug: "" });
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding]     = useState(false);
  const [dragOver, setDragOver]   = useState<number | null>(null);
  const [toConfirm, setToConfirm] = useState<number | null>(null);
  const dragId                    = useRef<number | null>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/attractions");
    if (res.ok) setList(await res.json());
  }
  useEffect(() => {
    load();
    fetch("/api/forms").then(r => r.ok ? r.json() : []).then(data => setForms(Array.isArray(data) ? data : []));
  }, []);

  async function seedDefaults() {
    setSeeding(true);
    for (const name of DEFAULTS) {
      await fetch("/api/attractions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, navigateToVenue: name === "Ananda Bazar", url: name === "Suggestions" ? "https://forms.gle/RnBrNibfw7P2MvoY6" : null }),
      });
    }
    await load();
    setSeeding(false);
    toast("Default attractions seeded", "success");
  }

  async function add() {
    if (!addForm.name.trim()) return;
    const res = await fetch("/api/attractions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, url: addForm.url || null, formSlug: addForm.formSlug || null }),
    });
    if (res.ok && addFiles.length) {
      const { id } = await res.json();
      for (const file of addFiles) {
        const form = new FormData();
        form.append("attractionId", String(id));
        form.append("file", file);
        await fetch("/api/attraction-images", { method: "POST", body: form });
      }
    }
    setAddForm({ name: "", url: "", navigateToVenue: false, formSlug: "" });
    setAddFiles([]);
    setShowAdd(false);
    await load();
    toast("Attraction added", "success");
  }

  async function saveEdit() {
    if (!editTarget) return;
    await fetch("/api/attractions", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editTarget.id, ...editForm, url: editForm.url || null, formSlug: editForm.formSlug || null }),
    });
    setEditTarget(null);
    await load();
    toast("Changes saved", "success");
  }

  async function remove(id: number) {
    setToConfirm(null);
    await fetch("/api/attractions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setList(l => l.filter(x => x.id !== id));
    toast("Attraction deleted", "success");
  }

  async function move(id: number, dir: -1 | 1) {
    const idx = list.findIndex(x => x.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const updated = [...list];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    setList(updated.map((x, i) => ({ ...x, order: i })));
    await fetch("/api/attractions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated.map((x, i) => ({ id: x.id, order: i }))) });
  }

  async function drop(targetId: number) {
    const fromId = dragId.current;
    if (!fromId || fromId === targetId) { setDragOver(null); return; }
    const from = list.findIndex(x => x.id === fromId);
    const to   = list.findIndex(x => x.id === targetId);
    const updated = [...list];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setList(updated.map((x, i) => ({ ...x, order: i })));
    setDragOver(null);
    dragId.current = null;
    await fetch("/api/attractions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated.map((x, i) => ({ id: x.id, order: i }))) });
  }

  async function uploadImages(attractionId: number, files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("attractionId", String(attractionId));
      form.append("file", file);
      await fetch("/api/attraction-images", { method: "POST", body: form });
    }
    if (fileRef.current) fileRef.current.value = "";
    const res = await fetch("/api/attractions");
    if (res.ok) {
      const fresh: Attraction[] = await res.json();
      if (editTarget) setEditTarget(fresh.find(x => x.id === editTarget.id) ?? null);
      setList(fresh);
    }
    setUploading(false);
    toast("Images uploaded", "success");
  }

  async function removeImage(imgId: number) {
    await fetch("/api/attraction-images", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: imgId }) });
    const updated = list.map(a => ({ ...a, images: a.images.filter(x => x.id !== imgId) }));
    setList(updated);
    if (editTarget) setEditTarget(updated.find(x => x.id === editTarget.id) ?? null);
  }

  function openEdit(a: Attraction) {
    setEditTarget(a);
    setEditForm({ name: a.name, url: a.url ?? "", navigateToVenue: a.navigateToVenue, formSlug: a.formSlug ?? "" });
  }

  return (
    <div>
      <PageHeader
        title="Specialties & Attractions"
        sub="Manage, reorder and upload images"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {list.length === 0 && (
              <Button variant="secondary" loading={seeding} onClick={seedDefaults}>Seed Defaults</Button>
            )}
            <Button icon={<Plus size={13} />} onClick={() => setShowAdd(true)}>Add</Button>
          </div>
        }
      />

      {/* Table */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflowX: "auto" }}>
        <table className="admin-table" style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
          <thead style={{ background: "#FAFBFC" }}>
            <tr>
              {["#", "Name", "Link", "Nav", "Imgs", "Order", ""].map((h, i) => (
                <th key={i} style={{
                  padding: "10px 14px", textAlign: i >= 2 && i <= 5 ? "center" : i === 6 ? "right" : "left",
                  fontSize: 11, fontWeight: 600, color: C.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
                  width: i === 0 ? 44 : i >= 2 && i <= 5 ? 64 : i === 6 ? 100 : undefined,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((a, i) => {
              const confirming = toConfirm === a.id;
              return (
                <tr
                  key={a.id}
                  draggable
                  onDragStart={() => { dragId.current = a.id; }}
                  onDragOver={e => { e.preventDefault(); setDragOver(a.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => drop(a.id)}
                  style={{
                    borderTop: `1px solid ${C.borderLight}`,
                    background: dragOver === a.id ? C.blueBg : "transparent",
                    cursor: "grab", transition: "background 0.12s",
                  }}
                >
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <GripVertical size={13} color={C.textMuted} style={{ opacity: 0.4 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>{String(i + 1).padStart(2, "0")}</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: C.text }}>
                    {a.name}
                    {PROTECTED.includes(a.name) && (
                      <span style={{ marginLeft: 7, fontSize: 10, color: C.textMuted, fontWeight: 400, background: C.borderLight, borderRadius: 4, padding: "1px 6px" }}>protected</span>
                    )}
                  </td>
                  <td style={{ padding: "11px 14px", textAlign: "center" }}>
                    {a.url ? <ExternalLink size={14} color={C.green} /> : <span style={{ color: C.border }}>—</span>}
                  </td>
                  <td style={{ padding: "11px 14px", textAlign: "center" }}>
                    {a.navigateToVenue ? <Navigation size={14} color={C.green} /> : <span style={{ color: C.border }}>—</span>}
                  </td>
                  <td style={{ padding: "11px 14px", textAlign: "center", fontSize: 13, color: a.images.length ? C.text : C.border }}>
                    {a.images.length || "—"}
                  </td>
                  <td style={{ padding: "11px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: 3 }}>
                      <button
                        onClick={() => move(a.id, -1)} disabled={i === 0}
                        style={{ border: `1px solid ${C.border}`, background: "#fff", borderRadius: 5, cursor: i === 0 ? "not-allowed" : "pointer", color: C.textMuted, padding: "2px 5px", opacity: i === 0 ? 0.3 : 1, display: "flex" }}
                      ><ChevronUp size={12} /></button>
                      <button
                        onClick={() => move(a.id, 1)} disabled={i === list.length - 1}
                        style={{ border: `1px solid ${C.border}`, background: "#fff", borderRadius: 5, cursor: i === list.length - 1 ? "not-allowed" : "pointer", color: C.textMuted, padding: "2px 5px", opacity: i === list.length - 1 ? 0.3 : 1, display: "flex" }}
                      ><ChevronDown size={12} /></button>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                      {confirming ? (
                        <>
                          <Button variant="danger" size="sm" onClick={() => remove(a.id)}>Confirm</Button>
                          <Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="secondary" size="sm" icon={<Pencil size={12} />} onClick={() => openEdit(a)} />
                          {!PROTECTED.includes(a.name) && (
                            <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => setToConfirm(a.id)} style={{ color: C.red }} />
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                  No attractions yet — click <strong>Seed Defaults</strong> to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Attraction" onClose={() => { setShowAdd(false); setAddFiles([]); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormFields form={addForm} setForm={setAddForm} forms={forms} />

            <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Images (optional)</p>
              <input ref={addFileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => setAddFiles(Array.from(e.target.files ?? []))} />
              <button
                onClick={() => addFileRef.current?.click()}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: `2px dashed ${C.border}`, background: C.borderLight, cursor: "pointer", fontSize: 13, color: C.textSub, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}
              >
                <Upload size={13} /> Choose Images
              </button>
              {addFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {addFiles.map((f, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(f)} alt="" style={{ width: 80, height: 52, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}`, display: "block" }} />
                      <button onClick={() => setAddFiles(files => files.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: C.red, color: "#fff", border: "none", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => { setShowAdd(false); setAddFiles([]); }}>Cancel</Button>
              <Button icon={<Plus size={13} />} onClick={add}>Add Attraction</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormFields form={editForm} setForm={setEditForm} forms={forms} />

            <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Images</p>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => uploadImages(editTarget.id, e.target.files)} />
              <button
                onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: `2px dashed ${C.border}`, background: C.borderLight, cursor: uploading ? "wait" : "pointer", fontSize: 13, color: C.textSub, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}
              >
                {uploading ? <Spinner size={13} /> : <Upload size={13} />}
                {uploading ? "Uploading…" : "Upload Images"}
              </button>
              <ImageStrip images={editTarget.images} onRemove={removeImage} />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
