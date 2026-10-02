"use client";
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
export const C = {
  bg:          "#F5F7FA",
  surface:     "#ffffff",
  border:      "#E8ECF0",
  borderLight: "#F1F5F9",

  text:      "#0F172A",
  textSub:   "#64748B",
  textMuted: "#94A3B8",

  primary:  "#0F172A",
  gold:     "#C9A96E",
  goldBg:   "rgba(201,169,110,0.10)",
  goldBorder: "rgba(201,169,110,0.30)",

  green:  "#10B981", greenBg:  "#ECFDF5",
  blue:   "#6366F1", blueBg:   "#EEF2FF",
  orange: "#F59E0B", orangeBg: "#FFFBEB",
  red:    "#EF4444", redBg:    "#FFF5F5",
  purple: "#8B5CF6", purpleBg: "#F5F3FF",
  pink:   "#EC4899", pinkBg:   "#FDF2F8",
} as const;

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize    = "sm" | "md" | "lg";

const BTN_VARIANT: Record<BtnVariant, React.CSSProperties> = {
  primary:   { background: C.primary, color: "#fff", border: "1px solid transparent" },
  secondary: { background: "#F1F5F9", color: C.textSub, border: `1px solid ${C.border}` },
  ghost:     { background: "transparent", color: C.textSub, border: `1px solid ${C.border}` },
  danger:    { background: C.redBg, color: C.red, border: "1px solid #FECACA" },
};
const BTN_SIZE: Record<BtnSize, React.CSSProperties> = {
  sm: { padding: "5px 12px",  fontSize: 12, gap: 5, borderRadius: 7 },
  md: { padding: "8px 16px",  fontSize: 13, gap: 6, borderRadius: 8 },
  lg: { padding: "10px 20px", fontSize: 14, gap: 7, borderRadius: 9 },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: ReactNode;
}
export function Button({ variant = "primary", size = "md", loading, icon, children, style, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        transition: "opacity 0.15s, background 0.15s",
        whiteSpace: "nowrap",
        ...BTN_VARIANT[variant], ...BTN_SIZE[size], ...style,
      }}
      {...rest}
    >
      {loading ? <Spinner size={13} /> : icon}
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = "green" | "red" | "orange" | "blue" | "purple" | "gray" | "gold";
const BADGE_COLOR: Record<BadgeVariant, [string, string]> = {
  green:  [C.green,  C.greenBg],
  red:    [C.red,    C.redBg],
  orange: [C.orange, C.orangeBg],
  blue:   [C.blue,   C.blueBg],
  purple: [C.purple, C.purpleBg],
  gray:   [C.textSub, "#F1F5F9"],
  gold:   [C.gold,   C.goldBg],
};

interface BadgeProps { variant?: BadgeVariant; children: ReactNode; dot?: boolean; icon?: ReactNode; style?: React.CSSProperties; }
export function Badge({ variant = "gray", children, dot, icon, style }: BadgeProps) {
  const [color, bg] = BADGE_COLOR[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, color,
      padding: "3px 8px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, lineHeight: 1.4,
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />}
      {icon}
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps { children: ReactNode; style?: React.CSSProperties; padding?: number | string; onClick?: React.MouseEventHandler<HTMLDivElement>; }
export function Card({ children, style, padding = 20, onClick }: CardProps) {
  return (
    <div style={{
      background: C.surface, borderRadius: 14,
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      padding, ...style,
    }} onClick={onClick}>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; }
export function Input({ label, style, ...rest }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </label>
      )}
      <input
        style={{
          padding: "9px 12px", border: `1px solid ${C.border}`,
          borderRadius: 8, fontSize: 13, color: C.text,
          outline: "none", background: C.surface,
          transition: "border-color 0.15s",
          width: "100%", boxSizing: "border-box",
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}

// ── Search input ──────────────────────────────────────────────────────────────
interface SearchProps extends InputHTMLAttributes<HTMLInputElement> { width?: number | string; }
export function Search({ style, width = 260, ...rest }: SearchProps) {
  return (
    <div style={{ position: "relative", width }}>
      <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        style={{
          width: "100%", padding: "8px 12px 8px 32px",
          border: `1px solid ${C.border}`, borderRadius: 8,
          fontSize: 13, color: C.text, outline: "none",
          background: C.surface, boxSizing: "border-box",
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ width = "100%", height = 16, radius = 6, style }: {
  width?: number | string; height?: number | string; radius?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width, height, borderRadius: radius, flexShrink: 0,
      background: "linear-gradient(90deg,#F1F5F9 25%,#E8ECF0 50%,#F1F5F9 75%)",
      backgroundSize: "400% 100%",
      animation: "shimmer 1.5s infinite linear",
      ...style,
    }} />
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
      <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
        {children}
      </table>
    </div>
  );
}
export function Thead({ children }: { children: ReactNode }) {
  return <thead style={{ background: "#FAFBFC" }}>{children}</thead>;
}
export function Tbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}
export function Th({ children, style }: { children?: ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{
      padding: "10px 16px", textAlign: "left",
      fontSize: 11, fontWeight: 600, color: C.textMuted,
      textTransform: "uppercase", letterSpacing: "0.06em",
      borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
      ...style,
    }}>
      {children}
    </th>
  );
}
export function Td({ children, style, colSpan }: { children?: ReactNode; style?: React.CSSProperties; colSpan?: number }) {
  return (
    <td colSpan={colSpan} style={{
      padding: "12px 16px",
      borderBottom: `1px solid ${C.borderLight}`,
      color: C.text, verticalAlign: "middle",
      ...style,
    }}>
      {children}
    </td>
  );
}
export function Tr({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <tr style={{ transition: "background 0.1s", ...style }}>{children}</tr>;
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", color: C.textMuted }}>
      <div style={{ opacity: 0.25, marginBottom: 14, display: "flex", justifyContent: "center" }}>{icon}</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: C.textSub, margin: 0 }}>{title}</p>
      {sub && <p style={{ fontSize: 12, marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; sub?: string; icon: ReactNode; accent: string; accentBg: string; suffix?: string; }
export function StatCard({ label, value, sub, icon, accent, accentBg, suffix }: StatCardProps) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ background: accentBg, borderRadius: 9, padding: 8, display: "flex" }}>
          <span style={{ color: accent, display: "flex" }}>{icon}</span>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1, margin: 0 }}>
          {value}{suffix}
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 6 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</p>}
      </div>
    </Card>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: C.border, ...style }} />;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.65s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 36, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: C.textSub, flexShrink: 0,
      ...style,
    }}>
      {initials}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 12 }}>
      <span style={{ fontSize: 12, color: C.textMuted }}>
        Showing {from}–{to} of {total}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          style={{
            padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
            background: "#fff", color: page <= 1 ? C.textMuted : C.textSub,
            cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600,
          }}
        >← Prev</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) => p === "…" ? (
            <span key={`e${i}`} style={{ padding: "5px 8px", fontSize: 12, color: C.textMuted }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              style={{
                padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                border: `1px solid ${p === page ? C.primary : C.border}`,
                background: p === page ? C.primary : "#fff",
                color: p === page ? "#fff" : C.textSub,
                cursor: "pointer",
              }}
            >{p}</button>
          ))}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          style={{
            padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
            background: "#fff", color: page >= totalPages ? C.textMuted : C.textSub,
            cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600,
          }}
        >Next →</button>
      </div>
    </div>
  );
}
