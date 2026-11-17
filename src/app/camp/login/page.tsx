"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cross, Eye, EyeOff } from "lucide-react";

const C = {
  bg:        "#F5F7FA",
  surface:   "#ffffff",
  border:    "#E8ECF0",
  text:      "#0F172A",
  textSub:   "#64748B",
  textMuted: "#94A3B8",
  gold:      "#C9A96E",
  goldBg:    "rgba(201,169,110,0.10)",
  goldBorder:"rgba(201,169,110,0.30)",
  primary:   "#0F172A",
  red:       "#EF4444",
  redBg:     "#FFF5F5",
} as const;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box" as const,
  border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
  background: C.surface, outline: "none", fontFamily: "inherit",
};

const ERROR_MSG: Record<string, string> = {
  access:   "You don't have access to the Medical Camp module. Contact your administrator.",
  disabled: "The Medical Camp module is not currently active.",
};

function CampLoginForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const extErr  = params.get("error");

  const [step,     setStep]     = useState<"email" | "otp">("email");
  const [email,    setEmail]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [showOtp,  setShowOtp]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [resendAt, setResendAt] = useState(0);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res  = await fetch("/api/admin-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { setStep("otp"); setResendAt(Date.now() + 60000); }
    else setError(data.error ?? "Something went wrong");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res  = await fetch("/api/admin-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) router.push("/camp");
    else setError(data.error ?? "Invalid OTP");
  }

  async function resend() {
    if (Date.now() < resendAt) return;
    setLoading(true); setError(""); setOtp("");
    const res  = await fetch("/api/admin-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResendAt(Date.now() + 60000);
    else setError(data.error ?? "Something went wrong");
  }

  const resendSecs = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
            background: "linear-gradient(135deg,#1a1a2e,#16213e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}>
            <Cross size={26} color={C.gold} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Medical Camp</h1>
          <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>Sign in to access your dashboard</p>
        </div>

        {/* Access / disabled error from layout redirect */}
        {extErr && ERROR_MSG[extErr] && (
          <div style={{
            background: C.redBg, border: "1px solid #FECACA", borderRadius: 10,
            padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.red, lineHeight: 1.5,
          }}>
            {ERROR_MSG[extErr]}
          </div>
        )}

        {/* Card */}
        <div style={{
          background: C.surface, borderRadius: 16,
          border: `1px solid ${C.border}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
          padding: 28,
        }}>
          {step === "email" ? (
            <form onSubmit={requestOtp} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                  Email address
                </label>
                <input
                  type="email" required autoFocus
                  value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="your@email.com"
                  style={inputStyle}
                />
              </div>
              {error && <p style={{ fontSize: 13, color: C.red, margin: 0 }}>{error}</p>}
              <button
                type="submit" disabled={loading}
                style={{
                  padding: "12px", borderRadius: 10, border: "none",
                  background: loading ? C.textMuted : C.primary,
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "none",
                }}
              >
                {loading ? "Sending OTP…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
              <p style={{ fontSize: 13, color: C.textSub, margin: 0, lineHeight: 1.6 }}>
                OTP sent to <strong style={{ color: C.text }}>{email}</strong>.{" "}
                <button type="button" onClick={() => setStep("email")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>
                  Change
                </button>
              </p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                  One-time password
                </label>
                <div style={{ position: "relative" as const }}>
                  <input
                    type={showOtp ? "text" : "password"} required autoFocus
                    value={otp} onChange={e => { setOtp(e.target.value); setError(""); }}
                    placeholder="Enter OTP"
                    style={{ ...inputStyle, paddingRight: 44, letterSpacing: showOtp ? "normal" : 4 }}
                  />
                  <button
                    type="button" onClick={() => setShowOtp(s => !s)}
                    style={{ position: "absolute" as const, right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 2 }}
                  >
                    {showOtp ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p style={{ fontSize: 13, color: C.red, margin: 0 }}>{error}</p>}
              <button
                type="submit" disabled={loading}
                style={{
                  padding: "12px", borderRadius: 10, border: "none",
                  background: loading ? C.textMuted : C.primary,
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "none",
                }}
              >
                {loading ? "Verifying…" : "Sign In"}
              </button>
              <button
                type="button" onClick={resend} disabled={resendSecs > 0}
                style={{ background: "none", border: "none", fontSize: 12, color: resendSecs > 0 ? C.textMuted : C.gold, cursor: resendSecs > 0 ? "default" : "pointer", padding: 0, textAlign: "center" as const }}
              >
                {resendSecs > 0 ? `Resend OTP in ${resendSecs}s` : "Resend OTP"}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center" as const, fontSize: 12, color: C.textMuted, marginTop: 20 }}>
          Contact your administrator if you need access.
        </p>
      </div>
    </div>
  );
}

export default function CampLoginPage() {
  return (
    <Suspense>
      <CampLoginForm />
    </Suspense>
  );
}
