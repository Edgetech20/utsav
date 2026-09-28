"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep]         = useState<"email" | "otp">("email");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [showOtp, setShowOtp]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [resendAt, setResendAt] = useState(0);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/admin-login", {
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
    const res = await fetch("/api/admin-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) router.push(params.get("from") ?? "/admin/dashboard");
    else setError(data.error ?? "Something went wrong");
  }

  async function resendOtp() {
    if (Date.now() < resendAt) return;
    setLoading(true); setError(""); setOtp("");
    const res = await fetch("/api/admin-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResendAt(Date.now() + 60000);
    else setError(data.error ?? "Something went wrong");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
    border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A",
    background: "#fff", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FA", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: "40px 32px", width: "100%", maxWidth: 380 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px", background: "linear-gradient(135deg,#1a1a2e,#16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#C9A96E" }}>প</div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>Admin Login</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>প্রিয়বোধী মহোৎসব</p>
        </div>

        {/* Step bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: "#0F172A" }} />
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: step === "otp" ? "#0F172A" : "#E2E8F0", transition: "background 0.3s" }} />
        </div>

        {step === "email" ? (
          <form onSubmit={requestOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Authorised Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                <input type="email" required placeholder="your@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36 }} />
              </div>
            </div>
            {error && <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ padding: "12px", borderRadius: 10, border: "none", background: loading ? "#E2E8F0" : "#0F172A", color: loading ? "#94A3B8" : "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
              {loading ? "Sending OTP…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={14} color="#16A34A" />
              OTP sent to <strong>{email}</strong>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Enter 6-digit OTP</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showOtp ? "text" : "password"}
                  required inputMode="numeric" maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ ...inputStyle, paddingRight: 40, letterSpacing: otp ? 8 : 0, fontSize: 22, fontWeight: 800, textAlign: "center" }}
                />
                <button type="button" onClick={() => setShowOtp(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                  {showOtp ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>{error}</p>}
            <button type="submit" disabled={loading || otp.length < 6} style={{ padding: "12px", borderRadius: 10, border: "none", background: loading || otp.length < 6 ? "#E2E8F0" : "#0F172A", color: loading || otp.length < 6 ? "#94A3B8" : "#fff", fontSize: 14, fontWeight: 600, cursor: loading || otp.length < 6 ? "default" : "pointer" }}>
              {loading ? "Verifying…" : "Verify & Login"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button type="button" onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                style={{ background: "none", border: "none", fontSize: 12, color: "#94A3B8", cursor: "pointer" }}>← Change email</button>
              <button type="button" onClick={resendOtp} disabled={Date.now() < resendAt}
                style={{ background: "none", border: "none", fontSize: 12, cursor: Date.now() < resendAt ? "default" : "pointer", color: Date.now() < resendAt ? "#CBD5E1" : "#6366F1" }}>
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#CBD5E1", marginTop: 24 }}>
          <a href="/admin" style={{ color: "#CBD5E1", textDecoration: "none" }}>← Back to public stats</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
