"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Building2, Inbox, UserPlus } from "lucide-react";
import { C, Card, PageHeader, StatCard, Button, Spinner } from "@/app/admin/dashboard/ui";
import { useCampUser } from "@/app/camp/(auth)/CampNav";
import { volCanEdit } from "./VolNav";

type Dept = { id: number; code: string; name: string; isActive: boolean };
type Vol  = { id: number; departmentId: number };

export default function VolunteerDashboard() {
  const user = useCampUser();
  const edit = volCanEdit(user);
  const [depts,   setDepts]   = useState<Dept[]>([]);
  const [vols,    setVols]    = useState<Vol[]>([]);
  const [pending, setPending] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/volunteer/departments").then(r => r.json()),
      fetch("/api/volunteer").then(r => r.json()),
      edit ? fetch("/api/volunteer/pending").then(r => r.json()) : Promise.resolve(null),
    ]).then(([d, v, p]) => {
      setDepts(Array.isArray(d) ? d : []);
      setVols(Array.isArray(v) ? v : []);
      setPending(p?.formName ? p.results.length : null);
      setLoading(false);
    });
  }, [edit]);

  const max = Math.max(1, ...depts.map(d => vols.filter(v => v.departmentId === d.id).length));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Volunteer Overview"
        actions={edit && <Link href="/volunteer/list"><Button icon={<UserPlus size={14} />}>Add Volunteer</Button></Link>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <StatCard label="Total Volunteers" value={vols.length} icon={<Users size={18} />} accent={C.gold} accentBg={C.goldBg} />
        <StatCard label="Departments" value={depts.filter(d => d.isActive).length} icon={<Building2 size={18} />} accent={C.blue} accentBg={C.blueBg} />
        {pending !== null && (
          <Link href="/volunteer/list?import=1" style={{ textDecoration: "none" }}>
            <StatCard label="Waiting in linked form" sub="Click to register them" value={pending} icon={<Inbox size={18} />} accent={C.orange} accentBg={C.orangeBg} />
          </Link>
        )}
      </div>

      <Card padding={0}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Volunteers by Department</p>
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner size={22} /></div>
        ) : depts.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: C.textMuted, margin: 0 }}>
            No departments yet. {edit && <Link href="/volunteer/departments" style={{ color: C.gold }}>Add departments →</Link>}
          </p>
        ) : depts.map((d, i) => {
          const n = vols.filter(v => v.departmentId === d.id).length;
          return (
            <Link key={d.id} href={`/volunteer/list?dept=${d.id}`} style={{
              display: "grid", gridTemplateColumns: "64px 1fr 48px", alignItems: "center", gap: 16,
              padding: "12px 20px", textDecoration: "none", opacity: d.isActive ? 1 : 0.5,
              borderBottom: i < depts.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.gold, letterSpacing: "0.06em" }}>{d.code}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 6px" }}>{d.name}</p>
                <div style={{ height: 6, background: C.borderLight, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${(n / max) * 100}%`, height: "100%", background: C.gold, borderRadius: 99 }} />
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{n}</span>
            </Link>
          );
        })}
      </Card>
    </div>
  );
}
