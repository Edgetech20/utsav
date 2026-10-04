"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem { id: number; message: string; type: ToastType; }
interface ToastCtxValue { toast: (message: string, type?: ToastType) => void; }

const Ctx = createContext<ToastCtxValue>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

const CONFIG: Record<ToastType, { icon: string; color: string; bg: string; border: string }> = {
  success: { icon: "✓", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
  error:   { icon: "✕", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  warning: { icon: "⚠", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  info:    { icon: "ℹ", color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE" },
};

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = _id++;
    setItems(prev => [...prev, { id, message, type }]);
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {/* Toast stack */}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column-reverse", gap: 8,
        pointerEvents: "none",
      }}>
        {items.map(({ id, message, type }) => {
          const { icon, color, bg, border } = CONFIG[type];
          return (
            <div key={id} className="admin-toast" style={{
              display: "flex", alignItems: "center", gap: 10,
              background: bg, border: `1px solid ${border}`, color,
              borderRadius: 10, padding: "11px 16px",
              fontSize: 13, fontWeight: 600,
              boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
              minWidth: 220, maxWidth: 360,
              pointerEvents: "auto",
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
              <span style={{ color: "#0F172A", fontWeight: 500 }}>{message}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
