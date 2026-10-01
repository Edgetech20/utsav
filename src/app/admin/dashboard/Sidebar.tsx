"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Wifi, Users, ScrollText, LogOut,
  Car, BedDouble, MessageSquare, ImageIcon, Menu, X,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",     href: "/admin/dashboard",              icon: LayoutDashboard },
  { label: "WhatsApp",      href: "/admin/dashboard/whatsapp",     icon: Wifi },
  { label: "RSVP",          href: "/admin/dashboard/rsvp",         icon: Users },
  { label: "Vehicles",      href: "/admin/dashboard/vehicles",     icon: Car },
  { label: "Accommodation", href: "/admin/dashboard/accommodation", icon: BedDouble },
  { label: "Feedback",      href: "/admin/dashboard/feedback",     icon: MessageSquare },
  { label: "Attractions",   href: "/admin/dashboard/attractions",  icon: ImageIcon },
  { label: "Message Log",   href: "/admin/dashboard/logs",         icon: ScrollText },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [desktop, setDesktop] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  async function logout() {
    await fetch("/api/admin-login", { method: "DELETE" });
    router.push("/admin");
  }

  const currentLabel = NAV.find(n => n.href === pathname)?.label ?? "Dashboard";

  const navLink = (href: string, label: string, Icon: React.ElementType, onClick?: () => void) => {
    const active = pathname === href;
    return (
      <Link key={href} href={href} onClick={onClick} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 8, textDecoration: "none",
        fontSize: 13.5, fontWeight: active ? 600 : 500,
        background: active ? "#F1F5F9" : "transparent",
        color: active ? "#0F172A" : "#64748B",
        borderLeft: active ? "3px solid #0F172A" : "3px solid transparent",
        transition: "background 0.15s",
      }}>
        <Icon size={16} />
        {label}
      </Link>
    );
  };

  const logo = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "#C9A96E",
      }}>প</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", lineHeight: 1.2, margin: 0 }}>Priyabodhi</p>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>Admin Panel</p>
      </div>
    </div>
  );

  return (
    <div className="admin-scroll" style={{ display: "flex", minHeight: "100vh", background: "#F5F7FA", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Desktop Sidebar ── */}
      {desktop && (
        <aside style={{
          width: 240, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20,
          background: "#fff", borderRight: "1px solid #E8ECF0",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #E8ECF0" }}>
            {logo}
          </div>
          <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#CBD5E1", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 12px", marginBottom: 6 }}>Menu</p>
            {NAV.map(({ label, href, icon: Icon }) => navLink(href, label, Icon))}
          </nav>
          <div style={{ padding: "10px", borderTop: "1px solid #E8ECF0" }}>
            <button onClick={logout} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer", width: "100%",
              fontSize: 13.5, fontWeight: 500, color: "#94A3B8",
            }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* ── Mobile Drawer ── */}
      {!desktop && drawerOpen && (
        <>
          <div
            className="admin-overlay"
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 30,
              background: "rgba(15,23,42,0.5)",
            }}
          />
          <aside className="admin-drawer" style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 272, zIndex: 40,
            background: "#fff", display: "flex", flexDirection: "column",
            boxShadow: "4px 0 32px rgba(0,0,0,0.14)",
          }}>
            <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid #E8ECF0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {logo}
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  border: "none", background: "#F1F5F9", borderRadius: 8,
                  padding: 7, cursor: "pointer", display: "flex", color: "#64748B", flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#CBD5E1", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 12px", marginBottom: 6 }}>Menu</p>
              {NAV.map(({ label, href, icon: Icon }) => navLink(href, label, Icon, () => setDrawerOpen(false)))}
            </nav>
            <div style={{ padding: "10px", borderTop: "1px solid #E8ECF0" }}>
              <button onClick={logout} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 12px", borderRadius: 8, border: "none",
                background: "transparent", cursor: "pointer", width: "100%",
                fontSize: 13.5, fontWeight: 500, color: "#94A3B8",
              }}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Main Content ── */}
      <main style={{ flex: 1, marginLeft: desktop ? 240 : 0, minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 56, background: "#fff", borderBottom: "1px solid #E8ECF0",
          display: "flex", alignItems: "center",
          padding: desktop ? "0 28px" : "0 16px",
          justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 10,
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {!desktop && (
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  border: "none", background: "transparent",
                  padding: 4, cursor: "pointer", display: "flex",
                  color: "#0F172A", borderRadius: 6, flexShrink: 0,
                }}
              >
                <Menu size={22} />
              </button>
            )}
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentLabel}
            </p>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "#F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#475569", flexShrink: 0,
          }}>A</div>
        </div>

        <div style={{ padding: desktop ? 28 : 16 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
