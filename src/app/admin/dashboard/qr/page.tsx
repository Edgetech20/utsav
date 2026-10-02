"use client";

import { useEffect, useState } from "react";
import { QrCode, Plus, Copy, Download, Trash2, Check, ExternalLink } from "lucide-react";

type QrEntry = { id: number; name: string; slug: string; targetUrl: string; scans: number; createdAt: string };

export default function QrPage() {
  const [list, setList] = useState<QrEntry[]>([]);
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/qr").then(r => r.json()).then(setList);
  }, []);

  async function create() {
    if (!name.trim() || !targetUrl.trim()) return;
    setCreating(true);
    const res = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetUrl }),
    });
    const entry = await res.json();
    setList(prev => [entry, ...prev]);
    setName("");
    setTargetUrl("");
    setCreating(false);
  }

  async function del(id: number) {
    if (!confirm("Delete this QR code?")) return;
    await fetch("/api/qr", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setList(prev => prev.filter(e => e.id !== id));
  }

  function copy(id: number, targetUrl: string) {
    navigator.clipboard.writeText(targetUrl);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const canCreate = name.trim() && targetUrl.trim() && !creating;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>QR Codes</h1>
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Generate trackable QR codes — scans are logged per code</p>
      </div>

      {/* Create */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #E8ECF0", marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>New QR Code</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Label  e.g. Wedding Card, Poster, WhatsApp"
            style={{ padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#0F172A", outline: "none" }}
          />
          <input
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && create()}
            placeholder="Destination URL  e.g. https://yourdomain.com"
            style={{ padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#0F172A", outline: "none" }}
          />
          <button
            onClick={create}
            disabled={!canCreate}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 16px", alignSelf: "flex-start",
              background: canCreate ? "#0F172A" : "#E2E8F0",
              color: canCreate ? "#fff" : "#94A3B8",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canCreate ? "pointer" : "default",
            }}
          >
            <Plus size={14} /> Create QR
          </button>
        </div>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8" }}>
          <QrCode size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No QR codes yet — create one above</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {list.map(entry => (
            <div key={entry.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8ECF0", overflow: "hidden" }}>
              {/* QR image */}
              <div style={{ background: "#F8FAFC", padding: 24, display: "flex", justifyContent: "center", borderBottom: "1px solid #E8ECF0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/qr/${entry.slug}/image`}
                  alt={entry.name}
                  width={160}
                  height={160}
                  style={{ borderRadius: 8, display: "block" }}
                />
              </div>

              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{entry.name}</p>
                <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                  {new Date(entry.createdAt).toLocaleDateString("en-IN")}
                </p>

                {/* Destination URL */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "8px 0" }}>
                  <ExternalLink size={11} color="#94A3B8" />
                  <a
                    href={entry.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#6366F1", wordBreak: "break-all", textDecoration: "none" }}
                  >
                    {entry.targetUrl}
                  </a>
                </div>

                {/* Scan count */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#EEF2FF", borderRadius: 20, padding: "4px 10px", marginBottom: 12,
                }}>
                  <QrCode size={12} color="#6366F1" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#6366F1" }}>{entry.scans} scan{entry.scans !== 1 ? "s" : ""}</span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => copy(entry.id, entry.targetUrl)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "7px 0", border: "1px solid #E2E8F0", borderRadius: 7,
                      background: "#fff", fontSize: 12, fontWeight: 500, color: "#475569", cursor: "pointer",
                    }}
                  >
                    {copied === entry.id ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                    {copied === entry.id ? "Copied!" : "Copy link"}
                  </button>
                  <a
                    href={`/api/qr/${entry.slug}/image`}
                    download={`${entry.name}.png`}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "7px 0", border: "1px solid #E2E8F0", borderRadius: 7,
                      background: "#fff", fontSize: 12, fontWeight: 500, color: "#475569", textDecoration: "none",
                    }}
                  >
                    <Download size={13} /> Download
                  </a>
                  <button
                    onClick={() => del(entry.id)}
                    style={{
                      padding: "7px 10px", border: "1px solid #FEE2E2", borderRadius: 7,
                      background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                    }}
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
