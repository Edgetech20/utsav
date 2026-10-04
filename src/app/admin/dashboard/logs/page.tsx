"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, ScrollText } from "lucide-react";
import { C, Badge, Button, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Card } from "../ui";

type Entry    = { name: string; whatsapp: string; submittedAt: string };
type LogEntry = { name: string; whatsapp: string; status: "sent" | "failed"; sentAt: string; error?: string };
type Row      = { name: string; whatsapp: string; submittedAt: string; status: "sent" | "failed" | "pending"; sentAt?: string; error?: string };

const STATUS_CFG = {
  sent:    { icon: CheckCircle, variant: "green"  as const, label: "Sent"    },
  failed:  { icon: XCircle,     variant: "red"    as const, label: "Failed"  },
  pending: { icon: Clock,       variant: "orange" as const, label: "Pending" },
} as const;

function SkeletonRows() {
  return (
    <>{Array.from({ length: 5 }).map((_, i) => (
      <Tr key={i}>
        <Td><Skeleton width={60} height={22} radius={20} /></Td>
        <Td><Skeleton width={120} height={13} /></Td>
        <Td><Skeleton width={100} height={13} /></Td>
        <Td><Skeleton width={90} height={13} /></Td>
        <Td><Skeleton width={90} height={13} /></Td>
      </Tr>
    ))}</>
  );
}

export default function LogsPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [rsvpRes, logs]: [{ entries: Entry[]; sent: string[] }, LogEntry[]] = await Promise.all([
      fetch("/api/rsvp").then(r => r.json()),
      fetch("/api/wa-log").then(r => r.json()),
    ]);
    const entries = rsvpRes?.entries ?? [];
    const sent    = rsvpRes?.sent    ?? [];
    const logMap  = new Map(logs.map(l => [l.whatsapp, l]));

    setRows([...entries].reverse().map(e => {
      const isSent = sent.includes(`${e.whatsapp}|${e.submittedAt}`);
      const log    = logMap.get(e.whatsapp);
      return {
        name: e.name, whatsapp: e.whatsapp, submittedAt: e.submittedAt,
        status: isSent ? "sent" : log?.status === "failed" ? "failed" : "pending",
        sentAt: log?.sentAt, error: log?.error,
      };
    }));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const counts = {
    sent:    rows.filter(r => r.status === "sent").length,
    failed:  rows.filter(r => r.status === "failed").length,
    pending: rows.filter(r => r.status === "pending").length,
  };

  function fmtDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Message Log"
        sub="WhatsApp delivery status for all registrants"
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={load}>
            Refresh
          </Button>
        }
      />

      {/* Summary stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {(["sent", "pending", "failed"] as const).map(s => {
          const { icon: Icon, variant, label } = STATUS_CFG[s];
          return (
            <Card key={s} padding="10px 18px" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon size={18} color={variant === "green" ? C.green : variant === "orange" ? C.orange : C.red} />
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>{counts[s]}</p>
                <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{label}</p>
              </div>
            </Card>
          );
        })}
        <Card padding="10px 18px" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>{rows.length}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>Total</p>
          </div>
        </Card>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Status</Th>
            <Th>Name</Th>
            <Th>Phone</Th>
            <Th>Registered</Th>
            <Th>Message Sent</Th>
          </Tr>
        </Thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <Tr>
              <Td style={{ padding: 0, border: "none" }} colSpan={5}>
                <Empty icon={<ScrollText size={40} />} title="No registrations yet" />
              </Td>
            </Tr>
          ) : rows.map((r, i) => {
            const { icon: Icon, variant, label } = STATUS_CFG[r.status];
            return (
              <Tr key={i}>
                <Td>
                  <Badge variant={variant} icon={<Icon size={10} />}>{label}</Badge>
                </Td>
                <Td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.name}</Td>
                <Td>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSub }}>{r.whatsapp}</span>
                  {r.error && <p style={{ fontSize: 11, color: C.red, margin: "2px 0 0" }}>{r.error}</p>}
                </Td>
                <Td style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>{fmtDate(r.submittedAt)}</Td>
                <Td style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>{fmtDate(r.sentAt)}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
