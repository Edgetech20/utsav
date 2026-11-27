"use client";

import { BadgeCheck } from "lucide-react";
import ModuleLogin from "@/app/login/ModuleLogin";

export default function VolunteerLoginPage() {
  return <ModuleLogin title="Volunteers" icon={BadgeCheck} home="/volunteer" />;
}
