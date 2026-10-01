"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Wifi, Users, ScrollText, LogOut, Car, BedDouble, MessageSquare } from "lucide-react";

const NAV = [
  { label: "Dashboard",      href: "/admin/dashboard",               icon: LayoutDashboard },
  { label: "WhatsApp",       href: "/admin/dashboard/whatsapp",      icon: Wifi },
  { label: "RSVP",           href: "/admin/dashboard/rsvp",          icon: Users },
  { label: "Vehicles",       href: "/admin/dashboard/vehicles",      icon: Car },
  { label: "Accommodation",  href: "/admin/dashboard/accommodation",  icon: BedDouble },
  { label: "Feedback",       href: "/admin/dashboard/feedback",      icon: MessageSquare },
  { label: "Message Log",    href: "/admin/dashboard/logs",          icon: ScrollText },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  async function logout() {
    await fetch("/api/admin-login", { method: "DELETE" });
    router.push("/admin");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F7FA", fontFamily: "system-ui, sans-serif" }}>

      {desktop && (
        <aside style={{
          width: 240, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20,
          background: "#fff", borderRight: "1px solid #E8ECF0",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid #E8ECF0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#C9A96E",
              }}>প</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>Priyabodhi</p>
                <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>Admin Panel</p>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#CBD5E1", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 12px", marginBottom: 6 }}>Menu</p>
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                  fontSize: 13.5, fontWeight: active ? 600 : 500,
                  background: active ? "#F1F5F9" : "transparent",
                  color: active ? "#0F172A" : "#64748B",
                  borderLeft: active ? "3px solid #0F172A" : "3px solid transparent",
                }}>
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: "12px", borderTop: "1px solid #E8ECF0" }}>
            <button onClick={logout} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer", width: "100%",
              fontSize: 13.5, fontWeight: 500, color: "#94A3B8",
            }}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>
      )}

      <main style={{ flex: 1, marginLeft: desktop ? 240 : 0, paddingBottom: desktop ? 0 : 80 }}>
        <div style={{
          height: 60, background: "#fff", borderBottom: "1px solid #E8ECF0",
          display: "flex", alignItems: "center", padding: "0 28px",
          justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
            {NAV.find(n => n.href === pathname)?.label ?? "Dashboard"}
          </p>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "#F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#475569",
          }}>A</div>
        </div>

        <div style={{ padding: 28 }}>
          {children}
        </div>
      </main>

      {!desktop && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
          display: "flex", background: "#fff", borderTop: "1px solid #E8ECF0",
        }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, padding: "10px 0", textDecoration: "none",
                fontSize: 10, fontWeight: 500,
                color: active ? "#0F172A" : "#94A3B8",
              }}>
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
          <button onClick={logout} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "10px 0", border: "none", background: "transparent",
            cursor: "pointer", fontSize: 10, fontWeight: 500, color: "#94A3B8",
          }}>
            <LogOut size={19} strokeWidth={1.8} />
            Sign Out
          </button>
        </nav>
      )}
    </div>
  );
}
