"use client";

import { createContext, useContext, useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserPlus, Stethoscope, Users, BarChart2, Pill, Package, FileText,
  LogOut, LayoutGrid, Menu, X, Tent, Building2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { ToastProvider } from "@/app/admin/dashboard/toast";

// ── Context ───────────────────────────────────────────────────────────────────
const CampCtx = createContext<SessionUser | null>(null);
export function useCampUser() {
  const u = useContext(CampCtx);
  if (!u) throw new Error("No CampCtx");
  return u;
}

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:         "#F5F7FA",
  surface:    "#ffffff",
  border:     "#E8ECF0",
  text:       "#0F172A",
  textSub:    "#64748B",
  textMuted:  "#94A3B8",
  gold:       "#C9A96E",
  goldBg:     "rgba(201,169,110,0.10)",
  goldBorder: "rgba(201,169,110,0.30)",
} as const;

const SIDEBAR_W   = 232;
const COLLAPSED_W = 60;
const LS_KEY      = "camp_sidebar_collapsed";

// ── Nav definitions ───────────────────────────────────────────────────────────
export type NavLink = { label: string; href: string; icon: React.ElementType; visible: boolean };
export type ModuleCfg = { name: string; icon: React.ElementType; home: string; login: string; roleLabel: string; sections: { label: string; links: NavLink[] }[] };

// ── Main component ────────────────────────────────────────────────────────────
export default function CampNav({
  user, eventTitle, children, module: mod,
}: {
  user: SessionUser;
  eventTitle: string;
  children: React.ReactNode;
  module?: ModuleCfg; // other modules (e.g. volunteer) reuse this shell; defaults to Medical Camp
}) {
  const pathname  = usePathname();
  const [desktop,   setDesktop]   = useState(false);
  const [drawer,    setDrawer]    = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Responsive breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved !== null) setCollapsed(saved === "1");
  }, []);

  function toggleCollapse() {
    setCollapsed(prev => {
      localStorage.setItem(LS_KEY, prev ? "0" : "1");
      return !prev;
    });
  }

  useEffect(() => { setDrawer(false); }, [pathname]);

  async function logout() {
    await fetch("/api/admin-login", { method: "DELETE" });
    window.location.assign(cfg.login);
  }

  const campPerms    = user.permissions.filter(p => p.resource === "camp").map(p => p.action);
  const isSuper      = user.role === "super";
  const has          = (a: string) => isSuper || campPerms.includes(a);
  const hasEdit      = has("manage");
  const hasAny       = isSuper || campPerms.length > 0;
  const isDoctor     = has("consult");
  const isPharmacist = has("dispense");
  const isMedical    = has("register");

  const roleLabel = isSuper ? "Super Admin" : user.roles.join(" · ") || "Member";

  const MANAGE: NavLink[] = [
    { label: "Departments", href: "/camp/manage/departments", icon: Building2,   visible: hasEdit },
    { label: "Doctors",     href: "/camp/manage/doctors",     icon: Stethoscope, visible: hasEdit },
  ];
  const PHARMACY: NavLink[] = [
    { label: "Pharmacy",  href: "/camp/pharmacy",         icon: Pill,     visible: isPharmacist },
    { label: "Reports",   href: "/camp/pharmacy/reports", icon: FileText, visible: hasAny },
    { label: "Medicines", href: "/camp/manage/medicines", icon: Package,  visible: hasEdit },
  ];
  const NAV: NavLink[] = [
    { label: "Patient",        href: "/camp/register",  icon: UserPlus,    visible: hasEdit || isMedical },
    { label: "Doctor",         href: "/camp/doctor",    icon: Stethoscope, visible: isDoctor },
    { label: "Medical Users",  href: "/camp/volunteer", icon: Users,       visible: hasAny },
    { label: "Reports",        href: "/camp/reports",   icon: BarChart2,   visible: hasAny },
  ];

  const cfg: ModuleCfg = mod ?? {
    name: "Medical Camp", icon: Tent, home: "/camp", login: "/login", roleLabel,
    sections: [{ label: "Manage", links: MANAGE }, { label: "Pharmacy", links: PHARMACY }, { label: "", links: NAV }],
  };
  const ModIcon  = cfg.icon;
  const sections = cfg.sections.map(s => ({ ...s, links: s.links.filter(l => l.visible) })).filter(s => s.links.length);

  const displayName = user.name || user.email.split("@")[0];
  const initials    = displayName.slice(0, 2).toUpperCase();
  const sideW       = collapsed ? COLLAPSED_W : SIDEBAR_W;

  // ── Sidebar nav item ─────────────────────────────────────────────────────────
  function SideNavItem({ link, onClick }: { link: NavLink; onClick?: () => void }) {
    const active = pathname === link.href || (link.href !== cfg.home && pathname.startsWith(link.href + "/"));
    const Icon   = link.icon;

    return (
      <Link
        href={link.href}
        onClick={onClick}
        title={collapsed ? link.label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 9,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "9px 0" : "8px 12px",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: active ? 600 : 500,
          color: active ? C.text : C.textSub,
          background: active ? C.goldBg : "transparent",
          borderLeft: collapsed ? "none" : `3px solid ${active ? C.gold : "transparent"}`,
          marginLeft: collapsed ? 0 : -3,
          transition: "background 0.12s, color 0.12s",
        }}
      >
        <Icon size={15} color={active ? C.gold : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />
        {!collapsed && link.label}
      </Link>
    );
  }

  // ── Sidebar body (shared between desktop sidebar + mobile drawer) ─────────────
  function SidebarBody({ forDrawer = false, onClose }: { forDrawer?: boolean; onClose?: () => void }) {
    const NavItemEl = forDrawer
      ? ({ link }: { link: NavLink }) => (
          <Link
            href={link.href}
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 12px", borderRadius: 8, textDecoration: "none",
              fontSize: 13, fontWeight: (pathname === link.href || (link.href !== cfg.home && pathname.startsWith(link.href + "/"))) ? 600 : 500,
              color: (pathname === link.href || (link.href !== cfg.home && pathname.startsWith(link.href + "/"))) ? C.text : C.textSub,
              background: (pathname === link.href || (link.href !== cfg.home && pathname.startsWith(link.href + "/"))) ? C.goldBg : "transparent",
              borderLeft: `3px solid ${(pathname === link.href || (link.href !== cfg.home && pathname.startsWith(link.href + "/"))) ? C.gold : "transparent"}`,
              marginLeft: -3,
            }}
          >
            {(() => { const Icon = link.icon; const active = pathname === link.href || (link.href !== cfg.home && pathname.startsWith(link.href + "/")); return <Icon size={15} color={active ? C.gold : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />; })()}
            {link.label}
          </Link>
        )
      : ({ link }: { link: NavLink }) => <SideNavItem link={link} />;

    const showLabel = !collapsed || forDrawer;
    const Section = ({ label, links }: { label: string; links: NavLink[] }) => (
      links.length === 0 ? null : (
        <div style={{ marginBottom: 4 }}>
          {showLabel
            ? <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.09em", textTransform: "uppercase" as const, padding: "6px 15px 4px", margin: 0 }}>{label}</p>
            : <div style={{ height: 1, background: C.border, margin: "6px 10px 10px" }} />
          }
          {links.map(link => <NavItemEl key={link.href} link={link} />)}
        </div>
      )
    );

    return (
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column" as const, gap: 4, overflowY: "auto" as const }}>
        {sections.map((s, i) => (
          <Fragment key={s.label || i}>
            {i > 0 && <div style={{ height: 1, background: C.border, margin: "4px 10px 8px" }} />}
            {s.label ? <Section label={s.label} links={s.links} /> : s.links.map(link => <NavItemEl key={link.href} link={link} />)}
          </Fragment>
        ))}
      </nav>
    );
  }

  return (
    <ToastProvider>
    <CampCtx.Provider value={user}>
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* ── Desktop sidebar ── */}
        {desktop && (
          <aside style={{
            width: sideW,
            position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20,
            background: C.surface, borderRight: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column",
            transition: "width 0.2s ease",
            overflow: "hidden",
          }}>

            {/* Logo */}
            <div style={{
              padding: collapsed ? "18px 0" : "18px 16px 14px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex", justifyContent: collapsed ? "center" : "flex-start",
            }}>
              <Link href={cfg.home} style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : 10, textDecoration: "none", minWidth: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: "linear-gradient(135deg,#1a1a2e,#16213e)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ModIcon size={16} color={C.gold} />
                </div>
                {!collapsed && (
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.2, whiteSpace: "nowrap" }}>{eventTitle}</p>
                    <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>{cfg.name}</p>
                  </div>
                )}
              </Link>
            </div>

            {/* Nav body */}
            <SidebarBody />

            {/* Bottom bar */}
            <div style={{ padding: collapsed ? "10px 0" : "10px 12px", borderTop: `1px solid ${C.border}` }}>
              {collapsed ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div title={displayName} style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#1a1a2e,#16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.gold, cursor: "default" }}>
                    {initials}
                  </div>
                  <a href="/login" title="Switch module" aria-label="Switch module" style={{ padding: 5, borderRadius: 6, color: C.textMuted, display: "flex" }}><LayoutGrid size={14} /></a>
                  <button onClick={logout} title="Sign out" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, borderRadius: 6, color: C.textMuted, display: "flex" }}>
                    <LogOut size={14} />
                  </button>
                  <button onClick={toggleCollapse} title="Expand sidebar" style={{ border: "none", background: "#F1F5F9", cursor: "pointer", padding: 5, borderRadius: 6, color: C.textSub, display: "flex" }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#1a1a2e,#16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.gold }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
                      <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>
                        {cfg.roleLabel}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <a href="/login" title="Switch module" aria-label="Switch module" style={{ padding: 5, borderRadius: 6, color: C.textMuted, display: "flex" }}><LayoutGrid size={14} /></a>
                    <button onClick={logout} title="Sign out" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, borderRadius: 6, color: C.textMuted, display: "flex" }}>
                      <LogOut size={14} />
                    </button>
                    <button onClick={toggleCollapse} title="Collapse sidebar" style={{ border: "none", background: "#F1F5F9", cursor: "pointer", padding: 5, borderRadius: 6, color: C.textSub, display: "flex" }}>
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── Mobile top bar ── */}
        {!desktop && (
          <header style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 20,
            height: 54, background: C.surface, borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setDrawer(true)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: C.text, display: "flex" }}>
                <Menu size={20} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#1a1a2e,#16213e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ModIcon size={13} color={C.gold} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{eventTitle} · {cfg.name}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1a1a2e,#16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.gold }}>
                {initials}
              </div>
              <a href="/login" title="Switch module" aria-label="Switch module" style={{ padding: 5, borderRadius: 6, color: C.textMuted, display: "flex" }}><LayoutGrid size={14} /></a>
              <button onClick={logout} title="Sign out" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, borderRadius: 6, color: C.textMuted, display: "flex" }}>
                <LogOut size={15} />
              </button>
            </div>
          </header>
        )}

        {/* ── Mobile drawer ── */}
        {!desktop && drawer && (
          <>
            <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(15,23,42,0.45)" }} />
            <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 268, zIndex: 40, background: C.surface, display: "flex", flexDirection: "column", boxShadow: "4px 0 32px rgba(0,0,0,0.14)" }}>
              <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#1a1a2e,#16213e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ModIcon size={14} color={C.gold} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.2 }}>{eventTitle}</p>
                    <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>{cfg.name}</p>
                  </div>
                </div>
                <button onClick={() => setDrawer(false)} style={{ border: "none", background: "#F1F5F9", borderRadius: 7, padding: 7, cursor: "pointer", color: C.textSub, display: "flex" }}>
                  <X size={15} />
                </button>
              </div>
              <SidebarBody forDrawer onClose={() => setDrawer(false)} />
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: "0 0 1px" }}>{displayName}</p>
                <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{user.email}</p>
              </div>
            </aside>
          </>
        )}

        {/* ── Main content ── */}
        <main style={{
          marginLeft: desktop ? sideW : 0,
          paddingTop: !desktop ? 54 : 0,
          transition: "margin-left 0.2s ease",
          minHeight: "100vh",
          padding: desktop ? `28px 28px 28px 28px` : undefined,
        }}>
          {!desktop
            ? <div style={{ padding: "16px" }}>{children}</div>
            : children
          }
        </main>

      </div>
    </CampCtx.Provider>
    </ToastProvider>
  );
}
