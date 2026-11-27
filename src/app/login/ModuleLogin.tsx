"use client";

import { useEffect, useRef, useState, useSyncExternalStore, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Mail, Lock, Users, Tent, BadgeCheck, ExternalLink } from "lucide-react";

const C = {
  bg: "#F5F7FA", surface: "#ffffff", border: "#E8ECF0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  gold: "#C9A96E", goldText: "#9A7B45", goldBg: "rgba(201,169,110,0.10)", goldBorder: "rgba(201,169,110,0.30)",
  navy: "#1a1a2e", navy2: "#16213e", red: "#DC2626", redBg: "#FEF2F2",
} as const;

const CODE_LEN = 6;
const RESEND_SECS = 60;

const CSS = `
.lg-input { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1px solid ${C.border}; border-radius: 10px;
  font: inherit; font-size: 15px; color: ${C.text}; background: ${C.surface}; transition: border-color .15s, box-shadow .15s; }
.lg-input::placeholder { color: ${C.textMuted}; }
.lg-input:focus { outline: none; border-color: ${C.gold}; box-shadow: 0 0 0 3px ${C.goldBg}; }
.lg-btn { width: 100%; padding: 13px; border: none; border-radius: 10px; font: inherit; font-size: 15px; font-weight: 700;
  color: #fff; background: ${C.text}; cursor: pointer; transition: background .15s, opacity .15s; }
.lg-btn:hover:not(:disabled) { background: #1E293B; }
.lg-btn:disabled { opacity: .55; cursor: not-allowed; }
.lg-btn:focus-visible, .lg-link:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
.lg-link { border: none; background: none; padding: 0; font: inherit; font-size: 13px; font-weight: 600; color: ${C.goldText}; cursor: pointer; }
.lg-link:disabled { color: ${C.textMuted}; cursor: default; font-weight: 500; }
.lg-code { position: relative; display: grid; grid-template-columns: repeat(${CODE_LEN}, 1fr); gap: 8px; }
.lg-code input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; font-size: 16px; caret-color: transparent; }
.lg-cell { height: 54px; display: flex; align-items: center; justify-content: center; border: 1px solid ${C.border}; border-radius: 10px;
  background: ${C.surface}; font-size: 24px; font-weight: 700; color: ${C.text}; font-variant-numeric: tabular-nums; transition: border-color .15s, box-shadow .15s; }
.lg-code:focus-within .lg-cell.active { border-color: ${C.gold}; box-shadow: 0 0 0 3px ${C.goldBg}; }
.lg-cell.err { border-color: #FCA5A5; }
.lg-field { position: relative; }
.lg-field svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: ${C.textMuted}; pointer-events: none; }
.lg-field .lg-input { padding-left: 42px; }
.lg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 1px 2px rgba(15,23,42,0.12), 0 6px 16px -6px rgba(15,23,42,0.35); }
.lg-btn svg { transition: transform .2s cubic-bezier(.16,1,.3,1); }
.lg-btn:hover:not(:disabled) svg { transform: translateX(3px); }
.lg-back { color: ${C.textSub}; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
.lg-back:hover { color: ${C.text}; }
@keyframes lg-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.lg-enter { animation: lg-in .5s cubic-bezier(.16,1,.3,1) both; }
@media (prefers-reduced-motion: reduce) { .lg-enter { animation: none; } .lg-btn svg { transition: none; } }
`;

type Brand = { title: string; titleSub: string | null; subtitle: string | null; date: string | null; venue: string | null };

const WIDE = "(min-width: 900px)";
const subscribe = (cb: () => void) => { const m = window.matchMedia(WIDE); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const useWide = () => useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => false);

// ── Left / top brand panel (camp module palette: light slate, gold accents, navy logo tile) ──
function BrandPanel({ brand, wide }: { brand: Brand; wide: boolean }) {
  const mark = (
    <span aria-hidden style={{
      width: wide ? 52 : 44, height: wide ? 52 : 44, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, boxShadow: "0 8px 20px -6px rgba(26,26,46,0.45)",
    }}>
      <span style={{ fontFamily: "var(--font-galada)", fontSize: wide ? 32 : 28, lineHeight: 1, color: C.gold, marginTop: wide ? 8 : 7 }}>প</span>
    </span>
  );

  // warm gold light from the top-left, cool slate base — the camp's surfaces, lit
  const glow = `radial-gradient(900px 600px at -10% -10%, rgba(201,169,110,0.22), transparent 60%),
    radial-gradient(700px 500px at 110% 110%, rgba(201,169,110,0.14), transparent 60%)`;
  const texture = "repeating-linear-gradient(135deg, rgba(201,169,110,0.07) 0 1px, transparent 1px 16px)";

  if (!wide) return (
    <header style={{
      position: "relative", overflow: "hidden", padding: "22px 20px", display: "flex", alignItems: "center", gap: 14,
      background: `${texture}, ${glow}, ${C.bg}`, borderBottom: `1px solid ${C.goldBorder}`,
    }}>
      {mark}
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-galada)", fontSize: 24, lineHeight: 1.25, color: C.text }}>
          {brand.title} <span style={{ color: C.goldText }}>{brand.titleSub}</span>
        </p>
        {brand.date && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: C.textSub, display: "flex", alignItems: "center", gap: 6 }}><CalendarDays size={13} color={C.gold} />{brand.date}</p>}
      </div>
    </header>
  );

  const FEATURES = [
    { icon: Users, text: "RSVPs, guest calls & WhatsApp invites" },
    { icon: Tent, text: "Medical camp: registration to pharmacy" },
    { icon: BadgeCheck, text: "Volunteers, departments & ID cards" },
  ];

  return (
    <aside style={{
      position: "relative", overflow: "hidden", padding: "48px 56px", display: "flex", flexDirection: "column",
      background: `${texture}, ${glow}, ${C.bg}`, borderRight: `1px solid ${C.border}`,
    }}>
      {/* oversized mark as a watermark */}
      <span aria-hidden style={{ position: "absolute", right: -30, bottom: -110, fontFamily: "var(--font-galada)", fontSize: 440, lineHeight: 1, color: "rgba(201,169,110,0.10)", pointerEvents: "none" }}>প</span>

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
        {mark}
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textSub }}>Admin portal</span>
      </div>

      <div style={{ marginTop: "auto", position: "relative" }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-galada)", fontWeight: 400, fontSize: 60, lineHeight: 1.1, color: C.text }}>
          {brand.title}
          {brand.titleSub && <span style={{ display: "block", fontSize: 44, color: C.goldText }}>{brand.titleSub}</span>}
        </h1>
        <span aria-hidden style={{ display: "block", width: 56, height: 3, borderRadius: 2, marginTop: 18, background: `linear-gradient(90deg, ${C.gold}, rgba(201,169,110,0))` }} />
        {brand.subtitle && <p style={{ margin: "16px 0 0", fontSize: 15, color: C.textSub, maxWidth: 440, lineHeight: 1.55 }}>{brand.subtitle}</p>}
        {(brand.date || brand.venue) && (
          <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {brand.date && <span style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "7px 12px", borderRadius: 999, background: C.surface, border: `1px solid ${C.goldBorder}`, fontSize: 13, color: C.text, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}><CalendarDays size={14} color={C.gold} />{brand.date}</span>}
            {brand.venue && <span style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "7px 12px", borderRadius: 999, background: C.surface, border: `1px solid ${C.goldBorder}`, fontSize: 13, color: C.text, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}><MapPin size={14} color={C.gold} />{brand.venue}</span>}
          </div>
        )}
      </div>

      <ul style={{ position: "relative", listStyle: "none", margin: "40px 0 0", padding: "24px 0 0", borderTop: `1px solid ${C.goldBorder}`, display: "flex", flexDirection: "column", gap: 12 }}>
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: C.text }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.goldBg, border: `1px solid ${C.goldBorder}` }}>
              <Icon size={15} color={C.goldText} />
            </span>
            {text}
          </li>
        ))}
      </ul>
      <p style={{ position: "relative", margin: "28px 0 0", fontSize: 12, color: C.textMuted }}>© {new Date().getFullYear()} {brand.title} {brand.titleSub}</p>
    </aside>
  );
}

// ── 6-cell code entry: one real input (paste + SMS/email autofill work), drawn as cells ──
function CodeInput({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <div className="lg-code">
      <input id="lg-code" autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d*" maxLength={CODE_LEN}
        value={value} aria-invalid={invalid} aria-describedby="lg-code-help"
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, CODE_LEN))} />
      {Array.from({ length: CODE_LEN }, (_, i) => (
        <div key={i} aria-hidden className={`lg-cell${i === Math.min(value.length, CODE_LEN - 1) ? " active" : ""}${invalid ? " err" : ""}`}>
          {value[i] ?? ""}
        </div>
      ))}
    </div>
  );
}

function LoginForm({ brand, home }: { brand: Brand; home: string }) {
  const ERROR_MSG: Record<string, string> = {
    access:   "You don't have access to that module. Contact your administrator.",
    disabled: "That module is not currently active.",
  };
  const extErr = useSearchParams().get("error");
  const wide   = useWide();

  const [step, setStep]       = useState<"email" | "code">("email");
  const [email, setEmail]     = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [secs, setSecs]       = useState(0); // resend cooldown
  const submitting = useRef(false);

  // live resend countdown
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  async function post(body: object) {
    const res = await fetch("/api/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: res.ok, data: await res.json().catch(() => ({})) as { error?: string } };
  }

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true); setError("");
    const { ok, data } = await post({ email: email.trim() });
    setLoading(false);
    if (!ok) { setError(data.error === "Email not authorised" ? "This email doesn't have admin access." : data.error ?? "Something went wrong. Try again."); return; }
    setCode(""); setStep("code"); setSecs(RESEND_SECS);
  }

  async function verify(value = code) {
    if (value.length !== CODE_LEN || submitting.current) return;
    submitting.current = true;
    setLoading(true); setError("");
    const { ok, data } = await post({ email: email.trim(), otp: value });
    if (ok) { window.location.assign(home); return; } // full load: server reads the new session and routes to the module
    submitting.current = false;
    setLoading(false); setCode("");
    setError(data.error ?? "That code didn't work.");
  }

  function onCode(v: string) {
    setCode(v); setError("");
    if (v.length === CODE_LEN) verify(v); // submit as soon as the last digit lands
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.surface, display: "grid",
      gridTemplateColumns: wide ? "minmax(380px, 5fr) 6fr" : "1fr", gridTemplateRows: wide ? "1fr" : "auto 1fr",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    }}>
      <style>{CSS}</style>
      <BrandPanel brand={brand} wide={wide} />

      <main style={{ position: "relative", display: "flex", alignItems: wide ? "center" : "flex-start", justifyContent: "center", padding: wide ? 48 : "28px 20px 40px" }}>
        {wide && (
          <Link href="/" className="lg-back" style={{ position: "absolute", top: 28, right: 36 }}>
            View invitation <ExternalLink size={13} />
          </Link>
        )}
        <div key={step} className="lg-enter" style={{ width: "100%", maxWidth: 380 }}>
          {extErr && ERROR_MSG[extErr] && (
            <div role="alert" style={{ background: C.redBg, border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginBottom: 24, fontSize: 13, color: C.red, lineHeight: 1.5 }}>
              {ERROR_MSG[extErr]}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={requestCode} noValidate={false}>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Sign in</h2>
              <p style={{ margin: "8px 0 28px", fontSize: 15, color: C.textSub, lineHeight: 1.5 }}>Enter your email and we&apos;ll send you a 6-digit code. No password needed.</p>

              <label htmlFor="lg-email" style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>Email</label>
              <div className="lg-field">
                <Mail size={16} aria-hidden />
                <input id="lg-email" className="lg-input" type="email" required autoFocus autoComplete="email"
                  value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com"
                  aria-invalid={!!error} aria-describedby={error ? "lg-err" : undefined} />
              </div>

              {error && <p id="lg-err" role="alert" style={{ margin: "8px 0 0", fontSize: 13, color: C.red }}>{error}</p>}

              <button className="lg-btn" type="submit" disabled={loading || !email.trim()} style={{ marginTop: 20 }}>
                {loading ? "Sending code…" : <>Email me a code <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={e => { e.preventDefault(); verify(); }}>
              <button type="button" className="lg-link" onClick={() => { setStep("email"); setError(""); setCode(""); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.textSub, marginBottom: 20 }}>
                <ArrowLeft size={14} /> Use a different email
              </button>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Check your email</h2>
              <p style={{ margin: "8px 0 28px", fontSize: 15, color: C.textSub, lineHeight: 1.5 }}>
                <Mail size={14} style={{ verticalAlign: -2, marginRight: 6, color: C.gold }} />
                We sent a code to <strong style={{ color: C.text, wordBreak: "break-all" }}>{email}</strong>
              </p>

              <label htmlFor="lg-code" style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>6-digit code</label>
              <CodeInput value={code} onChange={onCode} invalid={!!error} />
              <p id="lg-code-help" style={{ margin: "8px 0 0", fontSize: 12, color: C.textMuted }}>The code expires in 5 minutes.</p>

              {error && <p role="alert" style={{ margin: "10px 0 0", fontSize: 13, color: C.red }}>{error}</p>}

              <button className="lg-btn" type="submit" disabled={loading || code.length !== CODE_LEN} style={{ marginTop: 20 }}>
                {loading ? "Signing in…" : <>Sign in <ArrowRight size={16} /></>}
              </button>

              <p style={{ margin: "18px 0 0", fontSize: 13, color: C.textSub, textAlign: "center" }}>
                Didn&apos;t get it? Check spam, or{" "}
                <button type="button" className="lg-link" disabled={secs > 0 || loading} onClick={() => requestCode()}>
                  {secs > 0 ? `resend in ${secs}s` : "resend code"}
                </button>
              </p>
            </form>
          )}

          <div style={{ margin: "36px 0 0", paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Lock size={13} /> Codes expire in 5 minutes and work once.</span>
            <span>Need access? Ask your event administrator to add your email.</span>
            {!wide && <Link href="/" className="lg-back" style={{ marginTop: 4 }}>View invitation <ExternalLink size={13} /></Link>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ModuleLogin(props: { brand: Brand; home: string }) {
  return (
    <Suspense>
      <LoginForm {...props} />
    </Suspense>
  );
}
