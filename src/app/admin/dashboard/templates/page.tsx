"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Send } from "lucide-react";
import { C, Button, Badge, PageHeader, Card } from "../ui";
import { useToast } from "../toast";

const GROUPS = [
  { value: "rsvp",          label: "RSVP registrants"              },
  { value: "accommodation",  label: "Accommodation registrants"      },
  { value: "vehicle",        label: "Vehicle / Parking registrants"  },
];

export default function TemplatesPage() {
  const { toast } = useToast();

  // Template state
  const [tplBody, setTplBody]     = useState("");
  const [tplSaving, setTplSaving] = useState(false);
  const origTpl = useRef("");

  // Broadcast state
  const [bcGroup, setBcGroup]     = useState("rsvp");
  const [bcCount, setBcCount]     = useState<number | null>(null);
  const [bcMsg, setBcMsg]         = useState("");
  const [bcSending, setBcSending] = useState(false);

  useEffect(() => {
    fetch("/api/wa-template").then(r => r.json()).then(d => {
      setTplBody(d.body ?? "");
      origTpl.current = d.body ?? "";
    });
  }, []);

  useEffect(() => {
    setBcCount(null);
    fetch(`/api/wa-broadcast?group=${bcGroup}`).then(r => r.json()).then(d => setBcCount(d.count ?? 0));
  }, [bcGroup]);

  async function saveTemplate() {
    setTplSaving(true);
    await fetch("/api/wa-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: tplBody }),
    });
    origTpl.current = tplBody;
    setTplSaving(false);
    toast("Template saved", "success");
  }

  async function sendBroadcast() {
    if (!bcMsg.trim()) return;
    setBcSending(true);
    const res  = await fetch("/api/wa-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group: bcGroup, message: bcMsg }),
    });
    const data = await res.json();
    setBcSending(false);
    setBcMsg("");
    toast(`Queued ${data.queued} message${data.queued !== 1 ? "s" : ""}`, "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="Message Templates"
        sub="Edit auto-messages and send manual notifications via WhatsApp"
        actions={<Badge variant="blue" icon={<FileText size={11} />}>WhatsApp</Badge>}
      />

      {/* ── Auto-message template ── */}
      <Card>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
          RSVP Auto-Message
        </p>
        <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
          Sent automatically when someone submits the RSVP form. Use{" "}
          <code style={{ background: C.borderLight, padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>{"{name}"}</code>{" "}
          for the registrant's first name.
        </p>
        <textarea
          value={tplBody}
          onChange={e => setTplBody(e.target.value)}
          rows={7}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 12px", border: `1px solid ${C.border}`,
            borderRadius: 8, fontSize: 13, color: C.text,
            resize: "vertical", fontFamily: "inherit", lineHeight: 1.7, outline: "none",
          }}
        />
        <div style={{ marginTop: 10 }}>
          <Button
            disabled={tplBody === origTpl.current || !tplBody.trim()}
            loading={tplSaving}
            onClick={saveTemplate}
          >
            Save Template
          </Button>
        </div>
      </Card>

      {/* ── Manual broadcast ── */}
      <Card>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
          Send Notification
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Group picker */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
              Recipients
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {GROUPS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setBcGroup(g.value)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: "pointer",
                    border: `1px solid ${bcGroup === g.value ? C.primary : C.border}`,
                    background: bcGroup === g.value ? C.primary : "#fff",
                    color: bcGroup === g.value ? "#fff" : C.textSub,
                    transition: "all 0.15s",
                  }}
                >
                  {g.label}
                  {bcGroup === g.value && bcCount !== null && (
                    <span style={{ marginLeft: 6, opacity: 0.7 }}>({bcCount})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
              Message
            </label>
            <textarea
              value={bcMsg}
              onChange={e => setBcMsg(e.target.value)}
              rows={5}
              placeholder={`Use {name} for first name.\n\nE.g. Namaskar {name}, your accommodation is confirmed for 20 December.`}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "10px 12px", border: `1px solid ${C.border}`,
                borderRadius: 8, fontSize: 13, color: C.text,
                resize: "vertical", fontFamily: "inherit", lineHeight: 1.7, outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              icon={<Send size={13} />}
              disabled={!bcMsg.trim() || bcSending}
              loading={bcSending}
              onClick={sendBroadcast}
            >
              Send to {bcCount !== null ? bcCount : "…"} recipients
            </Button>
            {bcCount === 0 && (
              <span style={{ fontSize: 12, color: C.textMuted }}>No registrants in this group yet</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
