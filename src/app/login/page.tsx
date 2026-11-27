"use client";

import { LogIn } from "lucide-react";
import ModuleLogin from "./ModuleLogin";

// ponytail: lands on /admin/dashboard without ?next= until the module launcher (Phase 5)
export default function LoginPage() {
  return <ModuleLogin title="Sign in" icon={LogIn} home="/admin/dashboard" />;
}
