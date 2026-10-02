"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Wifi, Users, LogOut,
  Car, BedDouble, MessageSquare, ImageIcon, Menu, X, QrCode,
} from "lucide-react";
import { ToastProvider } from "./toast";
import { C } from "./ui";

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Registrations",
    items: [
      { label: "RSVP",          href: "/admin/dashboard/rsvp",          icon: Users },
      { label: "Vehicles",      href: "/admin/dashboard/vehicles",      icon: Car },
      { label: "Accommodation", href: "/admin/dashboard/accommodation",  icon: BedDouble },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Feedback",    href: "/admin/dashboard/feedback",    icon: MessageSquare },
      { label: "Attractions", href: "/admin/dashboard/attractions", icon: ImageIcon },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "QR Codes",    href: "/admin/dashboard/qr",        icon: QrCode },
      { label: "WhatsApp",    href: "/admin/dashboard/whatsapp",  icon: Wifi },
    ],
  },
];

// Flat list for header label lookup
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [desktop, setDesktop]     = useState(false);
  const [drawerOpen, setDrawer]   = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => { setDrawer(false); }, [pathname]);

  async function logout() {
    await fetch("/api/admin-login", { method: "DELETE" });
    router.push("/admin");
  }

  const currentLabel = ALL_NAV.find(n => n.href === pathname)?.label ?? "Dashboard";

  // ── Nav item ───────────────────────────────────────────────────────────────
  function NavItem({ label, href, icon: Icon, onClick }: { label: string; href: string; icon: React.ElementType; onClick?: () => void }) {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "8px 12px", borderRadius: 8, textDecoration: "none",
          fontSize: 13, fontWeight: active ? 600 : 500,
          color: active ? C.text : C.textSub,
          background: active ? C.goldBg : "transparent",
          borderLeft: `3px solid ${active ? C.gold : "transparent"}`,
          transition: "background 0.12s, color 0.12s",
          marginLeft: -3, // compensate border-left shifting content
        }}
      >
        <Icon size={15} color={active ? C.gold : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />
        {label}
      </Link>
    );
  }

  // ── Nav body (shared between sidebar + drawer) ─────────────────────────────
  function NavBody({ onItemClick }: { onItemClick?: () => void }) {
    return (
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: C.textMuted,
              letterSpacing: "0.09em", textTransform: "uppercase",
              padding: "6px 15px 4px", margin: 0,
            }}>
              {group.label}
            </p>
            {group.items.map(item => (
              <NavItem key={item.href} {...item} onClick={onItemClick} />
            ))}
          </div>
        ))}
      </nav>
    );
  }

  // ── Logo ───────────────────────────────────────────────────────────────────
  const Logo = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: "linear-gradient(135deg,#1a1a2e,#16213e)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, color: C.gold,
      }}>
        প
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2, margin: 0 }}>Priyabodhi</p>
        <p style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>Admin Panel</p>
      </div>
    </div>
  );

  // ── Bottom user bar ────────────────────────────────────────────────────────
  const BottomBar = (
    <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg,#1a1a2e,#16213e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: C.gold, flexShrink: 0,
          }}>
            A
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.2 }}>Admin</p>
            <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>Priyabodhi</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: 6, borderRadius: 6, color: C.textMuted,
            display: "flex", alignItems: "center",
            transition: "color 0.15s",
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="admin-scroll" style={{
        display: "flex", minHeight: "100vh",
        background: C.bg, fontFamily: "system-ui, -apple-system, sans-serif",
      }}>

        {/* ── Desktop sidebar ────────────────────────────────────────────── */}
        {desktop && (
          <aside style={{
            width: 232, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20,
            background: C.surface, borderRight: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
              {Logo}
            </div>
            <NavBody />
            {BottomBar}
          </aside>
        )}

        {/* ── Mobile drawer overlay ──────────────────────────────────────── */}
        {!desktop && drawerOpen && (
          <>
            <div
              className="admin-overlay"
              onClick={() => setDrawer(false)}
              style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(15,23,42,0.45)" }}
            />
            <aside className="admin-drawer" style={{
              position: "fixed", top: 0, left: 0, bottom: 0, width: 268, zIndex: 40,
              background: C.surface, display: "flex", flexDirection: "column",
              boxShadow: "4px 0 32px rgba(0,0,0,0.14)",
            }}>
              <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {Logo}
                <button
                  onClick={() => setDrawer(false)}
                  style={{ border: "none", background: "#F1F5F9", borderRadius: 7, padding: 7, cursor: "pointer", color: C.textSub, display: "flex" }}
                >
                  <X size={15} />
                </button>
              </div>
              <NavBody onItemClick={() => setDrawer(false)} />
              {BottomBar}
            </aside>
          </>
        )}

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main style={{ flex: 1, marginLeft: desktop ? 232 : 0, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Top bar */}
          <div style={{
            height: 54, background: C.surface, borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center",
            padding: desktop ? "0 28px" : "0 16px",
            justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 10,
            gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              {!desktop && (
                <button
                  onClick={() => setDrawer(true)}
                  style={{ border: "none", background: "transparent", padding: 4, cursor: "pointer", display: "flex", color: C.text, borderRadius: 6, flexShrink: 0 }}
                >
                  <Menu size={20} />
                </button>
              )}
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentLabel}
              </p>
            </div>
            {/* Right side: event countdown chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: C.goldBg, border: `1px solid ${C.goldBorder}`,
              borderRadius: 20, padding: "4px 12px", flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>
                {Math.max(0, Math.ceil((new Date("2026-12-20").getTime() - Date.now()) / 86400000))}d
              </span>
              <span style={{ fontSize: 11, color: C.textMuted }}>to event</span>
            </div>
          </div>

          {/* Page content */}
          <div style={{ padding: desktop ? "28px 28px" : "16px", flex: 1 }}>
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
