"use client";

import { useEffect, useState, useCallback } from "react";
import { Users } from "lucide-react";
import { C, PageHeader, Card, Spinner, Table, Thead, Tbody, Th, Td, Tr, Empty, Badge, Search, useDesktop } from "../../ui";

type Patient = {
  id: number; token: string; name: string; age: number; gender: string;
  mobile: string; address: string | null; status: string;
  registeredAt: string;
  department: { id: number; code: string; name: string };
};
type Dept = { id: number; code: string; name: string };

const STATUS_BADGE: Record<string, "orange" | "blue" | "green"> = {
  waiting:   "orange",
  called:    "blue",
  completed: "green",
};

export default function CampPatientsPage() {
  const desktop = useDesktop();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [depts,    setDepts]    = useState<Dept[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState("");
  const [deptId,   setDeptId]   = useState("");
  const [status,   setStatus]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (deptId) params.set("departmentId", deptId);
    if (status) params.set("status", status);
    if (q)      params.set("q", q);
    const r = await fetch(`/api/camp/patients?${params}`);
    if (r.ok) setPatients(await r.json());
    setLoading(false);
  }, [deptId, status, q]);

  useEffect(() => {
    fetch("/api/camp/departments").then(r => r.json()).then(setDepts);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectStyle: React.CSSProperties = {
    padding: "7px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.text, background: C.surface, outline: "none",
    fontFamily: "inherit",
  };

  return (
    <>
      <PageHeader
        title="Camp Patients"
        subtitle={`${patients.length} patient${patients.length !== 1 ? "s" : ""} found`}
        icon={<Users size={18} color={C.gold} />}
      />

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Search value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, token, mobile…" />
          </div>
          <select style={selectStyle} value={deptId} onChange={e => setDeptId(e.target.value)}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="called">Being Seen</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} /></div></Card>
      ) : patients.length === 0 ? (
        <Card><Empty icon={<Users size={32} color={C.textMuted} />} title="No patients found" subtitle="Try adjusting your filters" /></Card>
      ) : (
        <Card padding={0}>
          <Table>
            <Thead>
              <Tr>
                <Th>Token</Th>
                <Th>Name</Th>
                {desktop && <Th>Age / Gender</Th>}
                {desktop && <Th>Mobile</Th>}
                <Th>Department</Th>
                <Th>Status</Th>
                {desktop && <Th>Registered</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {patients.map(p => (
                <Tr key={p.id}>
                  <Td>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.gold, letterSpacing: 1, fontVariantNumeric: "tabular-nums" }}>
                      {p.token}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</span>
                    {p.address && <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{p.address}</p>}
                  </Td>
                  {desktop && <Td><span style={{ fontSize: 13, color: C.textSub }}>{p.age} · {p.gender}</span></Td>}
                  {desktop && <Td><span style={{ fontSize: 13, color: C.textSub }}>{p.mobile}</span></Td>}
                  <Td>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textSub }}>{p.department.name}</span>
                  </Td>
                  <Td>
                    <Badge variant={STATUS_BADGE[p.status] ?? "gray"} dot>
                      {p.status === "called" ? "Being Seen" : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Badge>
                  </Td>
                  {desktop && (
                    <Td>
                      <span style={{ fontSize: 12, color: C.textMuted }}>
                        {new Date(p.registeredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
