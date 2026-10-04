"use client";

import { useEffect, useState } from "react";
import { QrCode, Plus, Copy, Download, Trash2, Check, ExternalLink, X } from "lucide-react";
import { C, Button, Badge, PageHeader, Card, Input, Empty, Skeleton } from "../ui";
import { useToast } from "../toast";

type QrEntry = { id: number; name: string; slug: string; targetUrl: string; scans: number; uniqueScans: number; createdAt: string };

function SkeletonCard() {
  return (
    <Card padding={0} style={{ overflow: "hidden" }}>
      <div style={{ background: C.borderLight, padding: 24, display: "flex", justifyContent: "center" }}>
        <Skeleton width={160} height={160} radius={8} />
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={11} />
        <Skeleton width="90%" height={11} />
        <Skeleton width={80} height={22} radius={20} />
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <Skeleton width="45%" height={30} radius={7} />
          <Skeleton width="45%" height={30} radius={7} />
          <Skeleton width={32} height={30} radius={7} />
        </div>
      </div>
    </Card>
  );
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (entry: QrEntry) => void }) {
  const { toast } = useToast();
  const [name, setName]           = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [creating, setCreating]   = useState(false);

  async function create() {
    if (!name.trim() || !targetUrl.trim()) return;
    setCreating(true);
    const res = await fetch("/api/qr", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetUrl }),
    });
    const entry = await res.json();
    onCreate(entry);
    toast("QR code created", "success");
    onClose();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}
      onClick={onClose}
    >
      <Card
        padding={0}
        style={{ width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <QrCode size={15} color={C.textSub} />
            <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>New QR Code</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 4 }}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Label"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Wedding Card, Poster, WhatsApp blast"
            autoFocus
          />
          <Input
            label="Destination URL"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && create()}
            placeholder="https://yourdomain.com"
          />
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <Button icon={<Plus size={13} />} disabled={!name.trim() || !targetUrl.trim()} loading={creating} onClick={create} style={{ flex: 1 }}>
              Create QR
            </Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function QrPage() {
  const { toast }  = useToast();
  const [list, setList]           = useState<QrEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied]       = useState<number | null>(null);
  const [toConfirm, setToConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/qr").then(r => r.json()).then(d => { setList(d); setLoading(false); });
  }, []);

  async function del(id: number) {
    setToConfirm(null);
    await fetch("/api/qr", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setList(prev => prev.filter(e => e.id !== id));
    toast("QR code deleted", "success");
  }

  function copy(id: number, url: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast("Link copied to clipboard", "info");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="QR Codes"
        sub="Generate trackable QR codes — scans are logged per code"
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Badge variant="blue" icon={<QrCode size={11} />}>{list.length} codes</Badge>
            <Button icon={<Plus size={13} />} size="sm" onClick={() => setShowCreate(true)}>New QR</Button>
          </div>
        }
      />

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={entry => setList(prev => [entry, ...prev])}
        />
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : list.length === 0 ? (
        <Empty icon={<QrCode size={40} />} title="No QR codes yet" sub='Click "New QR" to get started' />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {list.map(entry => {
            const confirming = toConfirm === entry.id;
            return (
              <Card key={entry.id} padding={0} style={{ overflow: "hidden" }}>
                {/* QR image area */}
                <div style={{ background: C.borderLight, padding: 24, display: "flex", justifyContent: "center", borderBottom: `1px solid ${C.border}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/qr/${entry.slug}/image`}
                    alt={entry.name}
                    width={160} height={160}
                    style={{ borderRadius: 8, display: "block" }}
                  />
                </div>

                {/* Info */}
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{entry.name}</p>
                    <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* URL */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                    <ExternalLink size={11} color={C.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
                    <a href={entry.targetUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: C.blue, wordBreak: "break-all", textDecoration: "none", lineHeight: 1.5 }}>
                      {entry.targetUrl}
                    </a>
                  </div>

                  {/* Scan counts */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <Badge variant="blue" icon={<QrCode size={10} />}>
                      {entry.uniqueScans} unique
                    </Badge>
                    <Badge variant="gray">
                      {entry.scans} total
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
                    {confirming ? (
                      <>
                        <Button variant="danger" size="sm" style={{ flex: 1 }} onClick={() => del(entry.id)}>Confirm delete</Button>
                        <Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="secondary" size="sm" style={{ flex: 1 }}
                          icon={copied === entry.id ? <Check size={12} color={C.green} /> : <Copy size={12} />}
                          onClick={() => copy(entry.id, entry.targetUrl)}>
                          {copied === entry.id ? "Copied!" : "Copy"}
                        </Button>
                        <a href={`/api/qr/${entry.slug}/image`} download={`${entry.name}.png`}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "5px 12px", border: `1px solid ${C.border}`, borderRadius: 7, background: "#fff", fontSize: 12, fontWeight: 600, color: C.textSub, textDecoration: "none" }}>
                          <Download size={12} /> Download
                        </a>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={12} />}
                          onClick={() => setToConfirm(entry.id)} style={{ color: C.red }} />
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
