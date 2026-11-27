"use client";

import { Cross } from "lucide-react";
import ModuleLogin from "./ModuleLogin";

export default function CampLoginPage() {
  return <ModuleLogin title="Medical Camp" icon={Cross} home="/camp" />;
}
