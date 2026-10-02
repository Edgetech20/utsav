"use client";

import { useEffect, useState } from "react";
import { Trash2, Car, Bus } from "lucide-react";
import { C, Badge, Button, Search, PageHeader, Table, Thead, Th, Tbody, Td, Tr, Skeleton, Empty, Card } from "../ui";
import { useToast } from "../toast";

type Entry = {
  id: number; contactName: string; mobile: string; vehicleType: string;
  vehicleNo: string; totalPassengers: number; comingFrom: string;
  arrivalAt: string; departureAt: string; remark: string; submittedAt: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function SkeletonRows() {
  return (
    <>{Array.from({ length: 4 }).map((_, i) => (
      <Tr key={i}>
        <Td><Skeleton width={90} height={22} radius={20} /></Td>
        <Td><div style={{ display: "flex", flexDirection: "column", gap: 5 }}><Skeleton width={110} height={13} /><Skeleton width={80} height={11} /></div></Td>
        <Td><Skeleton width={70} height={13} /></Td>
        <Td><Skeleton width={40} height={13} /></Td>
        <Td><Skeleton width={90} height={13} /></Td>
        <Td><Skeleton width={90} height={13} /></Td>
        <Td><Skeleton width={100} height={13} /></Td>
        <Td><Skeleton width={32} height={28} radius={7} /></Td>
      </Tr>
    ))}</>
  );
}

export default function VehiclesPage() {
  const { toast }  = useToast();
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [acting, setActing]       = useState<number | null>(null);
  const [toConfirm, setToConfirm] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/vehicle").then(r => r.json()).catch(() => ({}));
    setEntries(res?.entries ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    setActing(id); setToConfirm(null);
    await fetch("/api/vehicle", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast("Vehicle registration deleted", "success");
    await load();
    setActing(null);
  }

  const filtered = entries.filter(e =>
    e.contactName.toLowerCase().includes(search.toLowerCase()) ||
    e.mobile.includes(search) ||
    e.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
    e.comingFrom.toLowerCase().includes(search.toLowerCase())
  );

  const cars      = entries.filter(e => e.vehicleType === "car").length;
  const buses     = entries.filter(e => e.vehicleType === "bus").length;
  const passengers = entries.reduce((s, e) => s + e.totalPassengers, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Vehicle & Parking"
        sub={`${entries.length} registrations · ${cars} cars · ${buses} buses · ${passengers} passengers`}
        actions={<Search placeholder="Name, phone, vehicle no, city…" value={search} onChange={e => setSearch(e.target.value)} />}
      />

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total", value: entries.length, variant: "gray" as const },
          { label: "Cars", value: cars, variant: "green" as const },
          { label: "Buses", value: buses, variant: "blue" as const },
          { label: "Passengers", value: passengers, variant: "purple" as const },
        ].map(s => (
          <Card key={s.label} padding="10px 18px" style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: "3px 0 0", fontWeight: 500 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Vehicle</Th>
            <Th>Contact</Th>
            <Th>From</Th>
            <Th>Pax</Th>
            <Th>Arrival</Th>
            <Th>Departure</Th>
            <Th>Remark</Th>
            <Th style={{ textAlign: "right" }}>Actions</Th>
          </Tr>
        </Thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <Tr>
              <Td style={{ padding: 0, border: "none" }} colSpan={8}>
                <Empty icon={<Car size={40} />} title={search ? "No results" : "No registrations yet"} />
              </Td>
            </Tr>
          ) : filtered.map(e => {
            const busy    = acting === e.id;
            const confirm = toConfirm === e.id;
            const isBus   = e.vehicleType === "bus";
            return (
              <Tr key={e.id} style={{ opacity: busy ? 0.5 : 1 }}>
                <Td>
                  <Badge variant={isBus ? "blue" : "green"} icon={isBus ? <Bus size={11} /> : <Car size={11} />}>
                    {e.vehicleNo}
                  </Badge>
                </Td>
                <Td>
                  <p style={{ fontWeight: 600, margin: 0, whiteSpace: "nowrap" }}>{e.contactName}</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>{e.mobile}</p>
                </Td>
                <Td style={{ color: C.textSub, whiteSpace: "nowrap" }}>{e.comingFrom}</Td>
                <Td style={{ color: C.textSub, textAlign: "center" }}>{e.totalPassengers}</Td>
                <Td style={{ fontSize: 12, color: C.textSub, whiteSpace: "nowrap" }}>{fmt(e.arrivalAt)}</Td>
                <Td style={{ fontSize: 12, color: C.textSub, whiteSpace: "nowrap" }}>{fmt(e.departureAt)}</Td>
                <Td style={{ maxWidth: 160 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: C.textSub }}>{e.remark}</span>
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
