"use client";

import DeptManager from "./DeptManager";

export default function ManageDepartmentsPage() {
  return <DeptManager api="/api/camp/departments" sub="Manage medical departments and their token prefixes" members="patients" idLabel="Tokens" />;
}
