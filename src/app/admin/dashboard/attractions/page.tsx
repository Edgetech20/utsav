"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Upload, ChevronUp, ChevronDown, Plus, ExternalLink, Navigation, ImageIcon, X, Pencil } from "lucide-react";

type AttractionImage = { id: number; imageUrl: string };
type Attraction = { id: number; name: string; order: number; url: string | null; navigateToVenue: boolean; images: AttractionImage[] };

const DEFAULTS = [
  "Accommodation", "Bus & Car Parking", "Medical Camp", "Cheap Canteen",
  "Jajan Parikrama", "Diksha Grahan", "Photo Gallery", "Ananda Bazar",
  "Music Event", "Istaprasanga", "Cultural Events", "Drama", "Suggestions", "And Many More…",
];
const PROTECTED = ["Accommodation", "Bus & Car Parking"];

const inp: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 13, outline: "none", boxSizing: "border-box" };
const btn = (bg = "#0F172A", color = "#fff"): React.CSSProperties => ({ padding: "9px 16px", borderRadius: 8, background: bg, color, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 });

export default function AttractionsPage() {
  const [list, setList] = useState<Attraction[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", url: "", navigateToVenue: false });
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const addFileRef = useRef<HTMLInputElement>(null);
  const [editTarget, setEditTarget] = useState<Attraction | null>(null);
  const [editForm, setEditForm] = useState({ name: "", url: "", navigateToVenue: false });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragId = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/attractions");
    if (res.ok) setList(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function seedDefaults() {
    for (const name of DEFAULTS) {
      await fetch("/api/attractions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, navigateToVenue: name === "Ananda Bazar", url: name === "Suggestions" ? "https://forms.gle/RnBrNibfw7P2MvoY6" : null }),
      });
    }
    await load();
  }

  async function add() {
    if (!addForm.name.trim()) return;
    const res = await fetch("/api/attractions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, url: addForm.url || null }),
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
    setAddForm({ name: "", url: "", navigateToVenue: false });
    setAddFiles([]);
    setShowAdd(false);
    await load();
  }

  async function saveEdit() {
    if (!editTarget) return;
    await fetch("/api/attractions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editTarget.id, ...editForm, url: editForm.url || null }),
    });
    setEditTarget(null);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this attraction?")) return;
    await fetch("/api/attractions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setList(l => l.filter(x => x.id !== id));
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
    const to = list.findIndex(x => x.id === targetId);
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
  }

  async function removeImage(imgId: number) {
    await fetch("/api/attraction-images", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: imgId }) });
    const updated = list.map(a => ({ ...a, images: a.images.filter(x => x.id !== imgId) }));
    setList(updated);
    if (editTarget) setEditTarget(updated.find(x => x.id === editTarget.id) ?? null);
  }

  function openEdit(a: Attraction) {
    setEditTarget(a);
    setEditForm({ name: a.name, url: a.url ?? "", navigateToVenue: a.navigateToVenue });
  }

  const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, margin: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #F1F5F9" }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{title}</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94A3B8" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>Specialties & Attractions</h2>
          <p style={{ fontSize: 13, color: "#64748B" }}>Manage, reorder and upload images.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {list.length === 0 && <button onClick={seedDefaults} style={btn("#475569")}>Seed Defaults</button>}
          <button onClick={() => setShowAdd(true)} style={btn()}><Plus size={14} /> Add</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8ECF0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: 580, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", width: 40 }}>#</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Name</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", width: 60 }}>Link</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", width: 60 }}>Nav</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", width: 60 }}>Imgs</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", width: 100 }}>Order</th>
              <th style={{ padding: "10px 16px", width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {list.map((a, i) => (
              <tr
                key={a.id}
                draggable
                onDragStart={() => { dragId.current = a.id; }}
                onDragOver={e => { e.preventDefault(); setDragOver(a.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => drop(a.id)}
                style={{ borderTop: "1px solid #F1F5F9", background: dragOver === a.id ? "#F0F9FF" : "transparent", cursor: "grab", transition: "background 0.15s" }}
              >
                <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#CBD5E1" }}>{String(i + 1).padStart(2, "0")}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                  {a.name}
                  {PROTECTED.includes(a.name) && <span style={{ marginLeft: 6, fontSize: 10, color: "#94A3B8", fontWeight: 400 }}>protected</span>}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>{a.url ? <ExternalLink size={14} color="#22c55e" /> : <span style={{ color: "#E2E8F0" }}>—</span>}</td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>{a.navigateToVenue ? <Navigation size={14} color="#22c55e" /> : <span style={{ color: "#E2E8F0" }}>—</span>}</td>
                <td style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, color: a.images.length ? "#0F172A" : "#CBD5E1" }}>{a.images.length || "—"}</td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                    <button onClick={() => move(a.id, -1)} disabled={i === 0} style={{ border: "1px solid #E8ECF0", background: "#fff", borderRadius: 6, cursor: i === 0 ? "not-allowed" : "pointer", color: "#94A3B8", padding: "2px 6px", opacity: i === 0 ? 0.4 : 1 }}><ChevronUp size={13} /></button>
                    <button onClick={() => move(a.id, 1)} disabled={i === list.length - 1} style={{ border: "1px solid #E8ECF0", background: "#fff", borderRadius: 6, cursor: i === list.length - 1 ? "not-allowed" : "pointer", color: "#94A3B8", padding: "2px 6px", opacity: i === list.length - 1 ? 0.4 : 1 }}><ChevronDown size={13} /></button>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button onClick={() => openEdit(a)} style={{ border: "1px solid #E8ECF0", background: "#fff", borderRadius: 6, cursor: "pointer", color: "#475569", padding: "4px 8px" }}><Pencil size={13} /></button>
                    {!PROTECTED.includes(a.name) && (
                      <button onClick={() => remove(a.id)} style={{ border: "1px solid #FEE2E2", background: "#FFF5F5", borderRadius: 6, cursor: "pointer", color: "#EF4444", padding: "4px 8px" }}><Trash2 size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#CBD5E1", fontSize: 13 }}>No attractions yet. Click "Seed Defaults" to start.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Attraction" onClose={() => { setShowAdd(false); setAddFiles([]); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Name *</label><input style={inp} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cultural Events" /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>URL (optional)</label><input style={inp} value={addForm.url} onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
              <input type="checkbox" checked={addForm.navigateToVenue} onChange={e => setAddForm(f => ({ ...f, navigateToVenue: e.target.checked }))} />
              Show "Navigate to Venue" button
            </label>

            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Images (optional)</label>
              <input ref={addFileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => setAddFiles(Array.from(e.target.files ?? []))} />
              <button onClick={() => addFileRef.current?.click()} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px dashed #E8ECF0", background: "#FAFAFA", cursor: "pointer", fontSize: 13, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                <Upload size={14} /> Choose Images
              </button>
              {addFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {addFiles.map((f, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={URL.createObjectURL(f)} style={{ width: 80, height: 52, objectFit: "cover", borderRadius: 6, border: "1px solid #E8ECF0" }} />
                      <button onClick={() => setAddFiles(files => files.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#EF4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button onClick={() => { setShowAdd(false); setAddFiles([]); }} style={btn("#F1F5F9", "#475569")}>Cancel</button>
              <button onClick={add} style={btn()}><Plus size={14} /> Add</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Name</label><input style={inp} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>URL (optional)</label><input style={inp} value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
              <input type="checkbox" checked={editForm.navigateToVenue} onChange={e => setEditForm(f => ({ ...f, navigateToVenue: e.target.checked }))} />
              Show "Navigate to Venue" button
            </label>

            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Images</label>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => uploadImages(editTarget.id, e.target.files)} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px dashed #E8ECF0", background: "#FAFAFA", cursor: "pointer", fontSize: 13, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                <Upload size={14} /> {uploading ? "Uploading…" : "Upload Images"}
              </button>
              {editTarget.images.length === 0 ? (
                <div style={{ textAlign: "center", color: "#CBD5E1", fontSize: 13, padding: "8px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <ImageIcon size={16} /> No images — default icon shows
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {editTarget.images.map(img => (
                    <div key={img.id} style={{ position: "relative" }}>
                      <img src={img.imageUrl} style={{ width: 80, height: 52, objectFit: "cover", borderRadius: 6, border: "1px solid #E8ECF0" }} />
                      <button onClick={() => removeImage(img.id)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#EF4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button onClick={() => setEditTarget(null)} style={btn("#F1F5F9", "#475569")}>Cancel</button>
              <button onClick={saveEdit} style={btn()}>Save Changes</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
