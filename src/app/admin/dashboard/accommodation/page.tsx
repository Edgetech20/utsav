"use client";

import { useEffect, useState } from "react";
import { Trash2, BedDouble, Car, Bus } from "lucide-react";
import { C, Badge, Button, Search, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Card } from "../ui";
import { useToast } from "../toast";

type Entry = {
  id: number; primaryName: string; mobile: string; comingFrom: string;
  totalPersons: number; maleMem: number; femaleMem: number; children: number; seniorCitizens: number;
  arrivalAt: string; departureAt: string;
  needsAssistance: boolean; assistanceDetails: string | null;
  hasVehicle: boolean; vehicleType: string | null; vehicleNo: string | null;
  additionalInfo: string | null; submittedAt: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function breakdown(e: Entry) {
  return [
    e.maleMem > 0 && `${e.maleMem}M`,
    e.femaleMem > 0 && `${e.femaleMem}F`,
    e.children > 0 && `${e.children} ch`,
    e.seniorCitizens > 0 && `${e.seniorCitizens} sr`,
  ].filter(Boolean).join(" · ");
}

function SkeletonRows() {
  return (
    <>{Array.from({ length: 4 }).map((_, i) => (
      <Tr key={i}>
        <Td><div style={{ display: "flex", flexDirection: "column", gap: 5 }}><Skeleton width={120} height={13} /><Skeleton width={90} height={11} /></div></Td>
        <Td><Skeleton width={70} height={13} /></Td>
        <Td><Skeleton width={30} height={22} radius={20} /></Td>
        <Td><Skeleton width={80} height={11} /></Td>
        <Td><Skeleton width={90} height={13} /></Td>
        <Td><Skeleton width={90} height={13} /></Td>
        <Td><Skeleton width={80} height={22} radius={6} /></Td>
        <Td><Skeleton width={32} height={28} radius={7} /></Td>
      </Tr>
    ))}</>
  );
}

export default function AccommodationPage() {
  const { toast }  = useToast();
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [acting, setActing]       = useState<number | null>(null);
  const [toConfirm, setToConfirm] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/accommodation").then(r => r.json()).catch(() => ({}));
    setEntries(res?.entries ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    setActing(id); setToConfirm(null);
    await fetch("/api/accommodation", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast("Accommodation registration deleted", "success");
    await load();
    setActing(null);
  }

  const filtered = entries.filter(e =>
    e.primaryName.toLowerCase().includes(search.toLowerCase()) ||
    e.mobile.includes(search) ||
    e.comingFrom.toLowerCase().includes(search.toLowerCase())
  );

  const totalPersons = entries.reduce((s, e) => s + e.totalPersons, 0);
  const needHelp     = entries.filter(e => e.needsAssistance).length;
  const withVehicle  = entries.filter(e => e.hasVehicle).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Accommodation"
        sub={`${entries.length} registrations · ${totalPersons} persons · ${needHelp} need assistance`}
        actions={<Search placeholder="Name, phone, city…" value={search} onChange={e => setSearch(e.target.value)} />}
      />

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Registrations", value: entries.length },
          { label: "Total Persons",  value: totalPersons },
          { label: "Need Assistance", value: needHelp },
          { label: "With Vehicle",   value: withVehicle },
        ].map(s => (
          <Card key={s.label} padding="10px 18px" style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: "3px 0 0", fontWeight: 500, whiteSpace: "nowrap" }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>From</Th>
            <Th>Persons</Th>
            <Th>Breakdown</Th>
            <Th>Arrival</Th>
            <Th>Departure</Th>
            <Th>Flags</Th>
            <Th style={{ textAlign: "right" }}>Actions</Th>
          </Tr>
        </Thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <Tr>
              <Td style={{ padding: 0, border: "none" }} colSpan={8}>
                <Empty icon={<BedDouble size={40} />} title={search ? "No results" : "No registrations yet"} />
              </Td>
            </Tr>
          ) : filtered.map(e => {
            const busy    = acting === e.id;
            const confirm = toConfirm === e.id;
            return (
              <Tr key={e.id} style={{ opacity: busy ? 0.5 : 1 }}>
                <Td>
                  <p style={{ fontWeight: 600, margin: 0, whiteSpace: "nowrap" }}>{e.primaryName}</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>{e.mobile}</p>
                </Td>
                <Td style={{ color: C.textSub, whiteSpace: "nowrap" }}>{e.comingFrom}</Td>
                <Td>
                  <Badge variant="blue" icon={<BedDouble size={10} />}>{e.totalPersons}</Badge>
                </Td>
                <Td style={{ fontSize: 11, color: C.textMuted, whiteSpace: "nowrap" }}>{breakdown(e) || "—"}</Td>
                <Td style={{ fontSize: 12, color: C.textSub, whiteSpace: "nowrap" }}>{fmt(e.arrivalAt)}</Td>
                <Td style={{ fontSize: 12, color: C.textSub, whiteSpace: "nowrap" }}>{fmt(e.departureAt)}</Td>
                <Td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {e.needsAssistance && (
                      <Badge variant="orange" style={{ fontSize: 10 }}>Assistance</Badge>
                    )}
                    {e.hasVehicle && e.vehicleNo && (
                      <Badge variant="blue" icon={e.vehicleType === "bus" ? <Bus size={10} /> : <Car size={10} />} style={{ fontSize: 10 }}>
                        {e.vehicleNo}
                      </Badge>
                    )}
                    {!e.needsAssistance && !e.hasVehicle && <span style={{ color: C.textMuted, fontSize: 11 }}>—</span>}
                  </div>
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {confirm ? (
                      <>
                        <Button variant="danger" size="sm" loading={busy} onClick={() => handleDelete(e.id)}>Confirm</Button>
                        <Button variant="secondary" size="sm" onClick={() => setToConfirm(null)}>Cancel</Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" icon={<Trash2 size={11} />} onClick={() => setToConfirm(e.id)} style={{ color: C.red }}>Delete</Button>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
