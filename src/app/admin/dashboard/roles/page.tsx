"use client";

import { useCallback, useEffect, useState } from "react";
import RolesManager, { type Role } from "./RolesManager";

const fetchRoles = (): Promise<Role[]> => fetch("/api/admin/roles").then(r => r.ok ? r.json() : []);

export default function RolesPage() {
  const [roles, setRoles]     = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => { fetchRoles().then(setRoles); }, []);

  useEffect(() => {
    fetchRoles().then(r => { setRoles(r); setLoading(false); });
  }, []);

  return <RolesManager roles={roles} loading={loading} reload={load} />;
}
