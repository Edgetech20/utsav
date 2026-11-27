"use client";

import { BadgeCheck, LayoutDashboard, Users, Building2, Settings } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import CampNav from "@/app/camp/(auth)/CampNav";

const volCan = (user: SessionUser, action: string) =>
  user.role === "super" || user.permissions.some(p => p.resource === "volunteer" && p.action === action);
export const volCanEdit   = (user: SessionUser) => volCan(user, "edit");
export const volCanDelete = (user: SessionUser) => volCan(user, "delete");

export default function VolNav({ user, eventTitle, children }: { user: SessionUser; eventTitle: string; children: React.ReactNode }) {
  const edit = volCanEdit(user);
  return (
    <CampNav user={user} eventTitle={eventTitle} module={{
      name: "Volunteers", icon: BadgeCheck, home: "/volunteer", login: "/login",
      roleLabel: user.role === "super" ? "Super Admin" : edit ? "Volunteer Admin" : "Viewer",
      sections: [
        { label: "", links: [
          { label: "Dashboard",  href: "/volunteer",      icon: LayoutDashboard, visible: true },
          { label: "Volunteers", href: "/volunteer/list", icon: Users,           visible: true },
        ] },
        { label: "Manage", links: [
          { label: "Departments", href: "/volunteer/departments", icon: Building2, visible: edit },
          { label: "Settings",    href: "/volunteer/settings",    icon: Settings,  visible: edit },
        ] },
      ],
    }}>{children}</CampNav>
  );
}
