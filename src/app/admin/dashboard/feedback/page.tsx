"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { C, Button, Badge, PageHeader, Card, Skeleton, Empty, Avatar, Search } from "../ui";
import { useToast } from "../toast";

type Entry = { id: number; name: string; mobile: string; responses: string; submittedAt: string };

function ResponseDetail({ responses }: { responses: string }) {
  const data: Record<string, string> = JSON.parse(responses);
  const pairs = Object.entries(data).filter(([, a]) => a?.trim());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 16 }}>
      {pairs.map(([q, a]) => (
        <div key={q} style={{ borderLeft: `3px solid ${C.goldBorder}`, paddingLeft: 12 }}>
          <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{q}</p>
          <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{a}</p>
        </div>
      ))}
    </div>
  );
}

function SkeletonCards() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} padding="16px 18px" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton width={36} height={36} radius={99} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={140} height={13} />
            <Skeleton width={100} height={11} />
          </div>
          <Skeleton width={64} height={30} radius={7} />
        </Card>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { toast }  = useToast();
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [toConfirm, setToConfirm] = useState<number | null>(null);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    fetch("/api/feedback")
      .then(r => r.json())
      .then(d => { setEntries(d.entries ?? []); setLoading(false); });
  }, []);

  async function del(id: number) {
    setToConfirm(null);
    await fetch("/api/feedback", { method: "DELETE", body: JSON.stringify({ id }), headers: { "Content-Type": "application/json" } });
    setEntries(e => e.filter(x => x.id !== id));
    if (expanded === id) setExpanded(null);
    toast("Response deleted", "success");
  }

  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.mobile.includes(search)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Feedback Responses"
        sub={`প্রথম বর্ষ · ${entries.length} response${entries.length !== 1 ? "s" : ""}`}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Search placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)} width={220} />
            <Badge variant="blue" icon={<MessageSquare size={11} />}>{entries.length}</Badge>
          </div>
        }
      />

      {loading ? (
        <SkeletonCards />
      ) : filtered.length === 0 ? (
        <Empty
          icon={<MessageSquare size={40} />}
          title={search ? "No results" : "No feedback yet"}
          sub={search ? "Try a different search term" : "Responses appear here once submitted via Google Form"}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(e => {
            const isOpen    = expanded === e.id;
            const confirming = toConfirm === e.id;
            return (
              <Card key={e.id} padding={0} style={{ overflow: "hidden" }}>
                {/* Row */}
                <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", gap: 12 }}>
                  <Avatar name={e.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{e.name}</p>
                    <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {e.mobile} · {new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {confirming ? (
                      <>
                        <Button variant="danger" size="sm" onClick={() => del(e.id)}>Confirm</Button>
                        <Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost" size="sm"
                        icon={<Trash2 size={11} />}
                        onClick={() => setToConfirm(e.id)}
                        style={{ color: C.red }}
                      />
                    )}
                    <Button
                      variant="secondary" size="sm"
                      icon={isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      onClick={() => { setExpanded(isOpen ? null : e.id); setToConfirm(null); }}
                    >
                      {isOpen ? "Hide" : "View"}
                    </Button>
                  </div>
                </div>

                {/* Expanded answers */}
                {isOpen && (
                  <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${C.borderLight}` }}>
                    <ResponseDetail responses={e.responses} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
