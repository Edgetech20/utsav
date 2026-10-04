"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Calendar, Navigation, CheckCircle, ChevronDown, Stethoscope, UtensilsCrossed, Footprints, BookOpen, Camera, ShoppingBag, Music, Mic, Palette, Theater, Sparkles } from "lucide-react";
import * as Icons from "lucide-react";
function LucideIcon({ name, size = 14 }: { name: string; size?: number }) {
  if (!name?.trim()) return null;
  const key = name.charAt(0).toUpperCase() + name.slice(1);
  const Icon = (Icons as Record<string, unknown>)[key] as React.ComponentType<{ size?: number }> | undefined;
  return Icon ? <Icon size={size} /> : null;
}

const DEFAULT_EVENT = {
  date: "Sunday, 20 December 2026 | ৪ ই পৌষ, ১৪৩৩",
  dateIso: "2026-12-20",
  venue: "Alinagar Playground, Bhatar, Purba Burdwan, West Bengal 713125",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Alinagar+Playground,+Bhatar,+Purba+Burdwan,+West+Bengal+713125",
  embedUrl: "https://maps.google.com/maps?q=Alinagar+Playground,+Bhatar,+Purba+Burdwan,+West+Bengal+713125&output=embed",
};

const DEFAULT_CONTACTS = [
  { label: "Organiser", key: "contact_organiser", fallback: "Purba Bardhaman North-Subdivision Satsang" },
  { label: "Phone",     key: "contact_phone",     fallback: "+91 XXXXX XXXXX" },
  { label: "WhatsApp",  key: "contact_whatsapp",  fallback: "+91 91535 71828" },
  { label: "Email",     key: "contact_email",     fallback: "priyabodhimahotsav@gmail.com" },
];

function drawShareCard(canvas: HTMLCanvasElement, name: string, venue: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = 1080, H = 1080;
  canvas.width = W; canvas.height = H;
  const cx = W / 2;

  // Background
  ctx.fillStyle = "#0E0E0E";
  ctx.fillRect(0, 0, W, H);

  // Gold radial glow
  const glow = ctx.createRadialGradient(cx, H * 0.44, 0, cx, H * 0.44, 640);
  glow.addColorStop(0, "rgba(44,26,0,0.95)");
  glow.addColorStop(1, "rgba(14,14,14,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Borders
  ctx.strokeStyle = "rgba(201,169,110,0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, W - 88, H - 88);
  ctx.strokeStyle = "rgba(201,169,110,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(58, 58, W - 116, H - 116);

  function goldGrad(x1: number, x2: number) {
    const g = ctx.createLinearGradient(x1, 0, x2, 0);
    g.addColorStop(0, "#9A7840");
    g.addColorStop(0.35, "#C9A96E");
    g.addColorStop(0.5, "#E8D5B0");
    g.addColorStop(0.65, "#C9A96E");
    g.addColorStop(1, "#9A7840");
    return g;
  }

  ctx.textAlign = "center";

  // Top ornament
  ctx.strokeStyle = "rgba(201,169,110,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 180, 138); ctx.lineTo(cx - 26, 138); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 26, 138); ctx.lineTo(cx + 180, 138); ctx.stroke();
  ctx.fillStyle = "#C9A96E";
  ctx.font = "22px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", cx, 138);

  // "JAI GURU"
  ctx.font = "600 26px 'Geist', system-ui, sans-serif";
  ctx.fillStyle = "rgba(201,169,110,0.55)";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("J A I   G U R U", cx, 205);

  // Name
  const fs = name.length > 18 ? 68 : name.length > 12 ? 82 : 96;
  ctx.font = `700 ${fs}px 'Geist', system-ui, sans-serif`;
  ctx.fillStyle = goldGrad(cx - 400, cx + 400);
  ctx.fillText(name.toUpperCase(), cx, 330);

  // Subtitle
  ctx.font = "400 30px 'Geist', system-ui, sans-serif";
  ctx.fillStyle = "rgba(232,213,176,0.55)";
  ctx.fillText("উৎসবে উপস্থিত থাকবেন", cx, 392);

  // Divider
  const div = ctx.createLinearGradient(cx - 320, 0, cx + 320, 0);
  div.addColorStop(0, "transparent");
  div.addColorStop(0.5, "rgba(201,169,110,0.35)");
  div.addColorStop(1, "transparent");
  ctx.strokeStyle = div;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 320, 442); ctx.lineTo(cx + 320, 442); ctx.stroke();

  // Event name
  ctx.font = "400 136px 'Galada', serif";
  ctx.fillStyle = goldGrad(cx - 400, cx + 400);
  ctx.fillText("প্ৰিয়বোধী", cx, 592);

  ctx.font = "400 68px 'Galada', serif";
  ctx.fillStyle = "rgba(201,169,110,0.85)";
  ctx.fillText("মহোৎসব", cx, 672);

  // Date & venue
  ctx.font = "600 30px 'Geist', system-ui, sans-serif";
  ctx.fillStyle = "rgba(232,213,176,0.7)";
  ctx.fillText("20 December 2026  ·  ৪ পৌষ ১৪৩৩", cx, 752);

  ctx.font = "400 24px 'Geist', system-ui, sans-serif";
  ctx.fillStyle = "rgba(201,169,110,0.45)";
  ctx.fillText(venue, cx, 800);

  // Bottom ornament
  ctx.strokeStyle = "rgba(201,169,110,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 180, 900); ctx.lineTo(cx - 26, 900); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 26, 900); ctx.lineTo(cx + 180, 900); ctx.stroke();
  ctx.fillStyle = "rgba(201,169,110,0.5)";
  ctx.font = "22px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", cx, 900);

  // Watermark
  ctx.font = "400 20px 'Geist', system-ui, sans-serif";
  ctx.fillStyle = "rgba(201,169,110,0.25)";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("utsav.databind.in", cx, 970);
}

function useCountdown(isoDate: string) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date(isoDate + "T00:00:00").getTime();
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isoDate]);
  return t;
}

function AttendCount({ className }: { className?: string }) {
  const [count, setCount]     = useState<number | null>(null);
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  // Poll every 30 s — state is local so only this element re-renders
  useEffect(() => {
    const tick = () =>
      fetch("/api/track").then(r => r.json()).then(d => setCount(d.attending ?? null)).catch(() => {});
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Animate on change
  useEffect(() => {
    if (count === null) return;
    const from = prev.current, to = count;
    prev.current = to;
    if (from === to) return;
    const start = performance.now();
    function step(now: number) {
      const p    = Math.min((now - start) / 700, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [count]);

  if (count === null) return null;
  return <span className={className}>({display} attending)</span>;
}

export default function HomeClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [attended, setAttended] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ name: "", whatsapp: "", village: "", postOffice: "", district: "", pinCode: "" });
  const [rsvpState, setRsvpState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  // dynamic form modal
  const [dynFormSlug, setDynFormSlug]   = useState<string | null>(null);
  const [dynFormData, setDynFormData]   = useState<{ id: number; name: string; description: string | null; fields: { id: number; label: string; type: string; placeholder: string | null; options: string | null; validation: string | null; required: boolean }[] } | null>(null);
  const [dynFormValues, setDynFormValues]   = useState<Record<string, string>>({});
  const [dynFormErrors, setDynFormErrors]   = useState<Record<string, string>>({});
  const [dynFormState, setDynFormState]     = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (!dynFormSlug) { setDynFormData(null); setDynFormValues({}); setDynFormErrors({}); setDynFormState("idle"); return; }
    fetch(`/api/forms/${dynFormSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setDynFormData(data);
        const init: Record<string, string> = {};
        data.fields.forEach((f: { label: string }) => { init[f.label] = ""; });
        setDynFormValues(init);
      });
  }, [dynFormSlug]);

  function dynValidate(): boolean {
    if (!dynFormData) return false;
    const errs: Record<string, string> = {};
    for (const field of dynFormData.fields) {
      if (field.type === "section") continue;
      if (field.type === "checkbox") {
        if (field.required && dynFormValues[field.label] !== "true") errs[field.label] = "You must confirm this";
        continue;
      }
      if (field.type === "file") {
        if (field.required && !dynFormValues[field.label]) errs[field.label] = "Please upload a file";
        continue;
      }
      const val = (dynFormValues[field.label] ?? "").trim();
      if (field.required && !val) { errs[field.label] = `${field.label} is required`; continue; }
      if (!val) continue;
      const v = field.validation ? JSON.parse(field.validation) : {};
      if (field.type === "text") {
        if (v.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errs[field.label] = "Invalid email address";
        else if (v.format === "phone" && !/^[6-9]\d{9}$/.test(val.replace(/\D/g, ""))) errs[field.label] = "Enter a valid 10-digit mobile number";
        else if (v.format === "numeric" && !/^\d+$/.test(val)) errs[field.label] = "Only numbers allowed";
        else if (v.minLength && val.length < v.minLength) errs[field.label] = `Minimum ${v.minLength} characters`;
        else if (v.maxLength && val.length > v.maxLength) errs[field.label] = `Maximum ${v.maxLength} characters`;
      }
      if (field.type === "date") {
        const d = new Date(val); const today = new Date(); today.setHours(0,0,0,0);
        if (isNaN(d.getTime())) errs[field.label] = "Invalid date";
        else if (v.disallowPast && d < today) errs[field.label] = "Date cannot be in the past";
        else if (v.disallowFuture && d > today) errs[field.label] = "Date cannot be in the future";
      }
    }
    setDynFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function dynSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dynFormSlug || !dynValidate()) return;
    setDynFormState("loading");
    const payload = Object.fromEntries(Object.entries(dynFormValues).filter(([k]) => !k.startsWith("__")));
    const res = await fetch(`/api/forms/${dynFormSlug}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setDynFormState(res.ok ? "done" : "error");
  }

  const [entered, setEntered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [dbAttractions, setDbAttractions] = useState<{ id: number; name: string; description: string | null; url: string | null; navigateToVenue: boolean; formSlug: string | null; images: { id: number; imageUrl: string }[] }[]>([]);
  const [event] = useState(() => ({
    date:     initialSettings.event_date       || DEFAULT_EVENT.date,
    dateIso:  initialSettings.event_date_iso   || DEFAULT_EVENT.dateIso,
    venue:    initialSettings.event_venue      || DEFAULT_EVENT.venue,
    mapsUrl:  initialSettings.event_maps_url   || DEFAULT_EVENT.mapsUrl,
    embedUrl: initialSettings.event_maps_embed || DEFAULT_EVENT.embedUrl,
  }));
  const settings = initialSettings;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch("/api/attractions").then(r => r.ok ? r.json() : Promise.reject()).then(setDbAttractions).catch(() => {});
    setMounted(true);
    fetch("/music.mp3", { method: "HEAD" }).then((res) => {
      if (!res.ok) return;
      const audio = new Audio("/music.mp3");
      audio.loop = true;
      audio.volume = 0.35;
      audioRef.current = audio;
    }).catch(() => {});
    return () => { audioRef.current?.pause(); };
  }, []);

  function handleEnter() {
    setEntered(true);
    const audio = audioRef.current;
    if (audio) audio.play().then(() => setPlaying(true)).catch(() => {});
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  }
  const t = useCountdown(event.dateIso);

  useEffect(() => {
    fetch("/api/track?type=view", { method: "POST" }).catch(() => {});
  }, []);


  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
          } else {
            e.target.classList.remove("revealed");
          }
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -80px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dbAttractions]);

  useEffect(() => {
    if (rsvpState !== "done" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    document.fonts.ready.then(() => drawShareCard(canvas, rsvpForm.name, event.venue));
  }, [rsvpState]);

  function shareCard() {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "priyabodhi-invitation.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "প্রিয়বোধী মহোৎসব · 20 December 2026" });
      } else {
        const a = document.createElement("a");
        a.download = "priyabodhi-invitation.png";
        a.href = URL.createObjectURL(blob);
        a.click();
      }
    }, "image/png");
  }

  function handleMap() {
    fetch("/api/track?type=map", { method: "POST" }).catch(() => {});
  }

  async function handleAttend() {
    if (attended) return;
    await fetch("/api/track?type=attend", { method: "POST" });
    setAttended(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start" style={{ background: "#0E0E0E" }}>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #9A7840 20%, #C9A96E 40%, #E8D5B0 50%, #C9A96E 60%, #9A7840 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        @keyframes pulse-bar {
          0%, 100% { opacity: 0.35; transform: scaleX(0.85); }
          50%       { opacity: 1;    transform: scaleX(1); }
        }
        .pulse-bar { animation: pulse-bar 2s ease-in-out infinite; }
        @keyframes title-entrance {
          0%   { opacity: 0; transform: scale(0.82) translateY(20px); filter: blur(12px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0);   }
        }
        @keyframes title-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes bloom-breathe {
          0%, 100% { opacity: 0.25; transform: scale(0.9); }
          50%       { opacity: 0.6;  transform: scale(1.1); }
        }
        @keyframes shimmer-gold {
          0%   { background-position: -300% center; }
          100% { background-position:  300% center; }
        }
        .event-title-wrap {
          animation: title-float 5s ease-in-out 1s infinite;
        }
        .event-title {
          font-family: var(--font-galada), serif;
          background: linear-gradient(90deg,
            #3D2500 0%, #9A7840 20%, #C9A96E 35%,
            #F5EDD0 50%,
            #C9A96E 65%, #9A7840 80%, #3D2500 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-gold 6s linear infinite;
        }
        @keyframes splash-zoom-in {
          0%   { opacity: 0; transform: scale(0.3); filter: blur(10px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .splash-title { animation: splash-zoom-in 5s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        @keyframes splash-fade-out {
          0%   { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        .splash-out { animation: splash-fade-out 1.2s ease forwards; }
        @keyframes tap-pulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .music-disc { animation: spin-slow 4s linear infinite; }
        .vf-input:focus { border-color: rgba(201,169,110,0.55) !important; box-shadow: 0 0 0 3px rgba(201,169,110,0.07); outline: none; }
        .vf-input::placeholder { color: rgba(232,213,176,0.22); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        [data-reveal] {
          opacity: 0;
          transform: translateX(-48px);
          transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }
        [data-reveal].revealed {
          opacity: 1;
          transform: translateX(0);
        }
        [data-reveal] .reveal-bar {
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.25s;
        }
        [data-reveal].revealed .reveal-bar {
          transform: scaleX(1);
        }
      `}</style>

      {/* ── Splash Overlay ── */}
      {mounted ? (
        <div
          className={entered ? "splash-out" : ""}
          onClick={handleEnter}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "radial-gradient(ellipse 80% 80% at 50% 40%, #2C1A00 0%, #0E0E0E 70%)",
            display: entered ? "flex" : "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            pointerEvents: entered ? "none" : "auto",
          }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px w-16" style={{ background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
            <span style={{ color: "#C9A96E", fontSize: 20 }}>✦</span>
            <div className="flex-1 h-px w-16" style={{ background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
          </div>

          <h1 className="event-title splash-title mb-2" style={{ fontSize: "clamp(5rem, 28vw, 8rem)", letterSpacing: "0.06em", lineHeight: 1.6 }}>
            প্ৰিয়বোধী
          </h1>
          <p className="shimmer-text font-black mb-10" style={{ fontSize: "clamp(1rem, 4vw, 1.4rem)", letterSpacing: "0.1em" }}>
            মহোৎসব
          </p>

          <div style={{ animation: "tap-pulse 2s ease-in-out infinite" }}>
            <div
              className="flex flex-col items-center gap-2 px-8 py-3 rounded-full border"
              style={{ borderColor: "rgba(201,169,110,0.45)", background: "rgba(201,169,110,0.06)" }}
            >
              <span className="text-xs uppercase tracking-[0.4em]" style={{ color: "#C9A96E", opacity: 0.8 }}>Tap to Enter</span>
            </div>
          </div>

        </div>
      ) : null}

      {/* ── Hero ── */}
      <div
        className="w-full flex flex-col items-center text-center px-6 pt-16 pb-14"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, #2C2010 0%, #0E0E0E 70%)" }}
      >
        {/* Ornamental top rule */}
        <div className="flex items-center gap-3 w-full max-w-xs mb-8">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
          <span style={{ color: "#C9A96E", fontSize: 18, lineHeight: 1 }}>✦</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
        </div>

        <p className="uppercase tracking-[0.4em] mb-4" style={{ color: "#C9A96E", opacity: 0.5, fontSize: "0.6rem" }}>
          You are cordially invited to
        </p>

        <p className="shimmer-text font-semibold text-center leading-relaxed mb-0" style={{ maxWidth: "min(90vw, 480px)" }}>
          <span style={{ fontSize: "clamp(0.65rem, 2.5vw, 0.8rem)" }}>যুগপুরুষোত্তম পরমপ্রেমময়</span>
          <br />
          <span style={{ fontSize: "clamp(1.5rem, 6vw, 2.2rem)", whiteSpace: "nowrap" }}>শ্রীশ্রীঠাকুর অনুকূলচন্দ্রের</span>
          {" "}
          {/* <span style={{ fontSize: "clamp(0.85rem, 3.5vw, 1.1rem)", whiteSpace: "nowrap" }}>শুভ ১৩৯তম জন্ম মহোৎসব তৎসহ</span> */}
        </p>

        <div className="flex flex-col items-center gap-0 mb-2 mt-1" style={{ overflow: "visible", padding: "12px 0" }}>
          {/* Bloom glow + float wrapper */}
          <div className="event-title-wrap relative flex items-center justify-center" style={{ overflow: "visible", padding: "16px 8px 0 8px" }}>
            {/* Radial bloom behind the text */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,169,110,0.22) 0%, transparent 70%)",
                filter: "blur(18px)",
                animation: "bloom-breathe 4s ease-in-out infinite",
              }}
            />
            <h1 className="event-title relative" style={{ fontSize: "clamp(4rem, 18vw, 7rem)", letterSpacing: "0.06em", lineHeight: 1.3, paddingTop: "0.2em" }}>
              প্ৰিয়বোধী
            </h1>
          </div>
          <h2 className="shimmer-text font-black" style={{ fontSize: "clamp(1.4rem, 6vw, 2rem)", letterSpacing: "0.06em", lineHeight: 1.6, opacity: 0.85 }}>
            মহোৎসব
          </h2>
          <p className="shimmer-text font-semibold" style={{ fontSize: "clamp(0.7rem, 2.5vw, 0.95rem)", letterSpacing: "0.08em", lineHeight: 1.6 }}>
            প্রথম বর্ষ
          </p>
        </div>

        <p className="mt-3 text-sm font-medium tracking-wide" style={{ color: "#C9A96E", opacity: 0.75 }}>
          Purba Bardhaman Sadar North Subdivision
        </p>

        {/* Bottom rule */}
        <div className="flex items-center gap-3 w-full max-w-xs mt-8">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
          <span style={{ color: "#C9A96E", fontSize: 18, lineHeight: 1 }}>✦</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
        </div>
      </div>

      {/* ── Countdown ── */}
      <div className="w-full px-5 py-8" style={{ background: "#141414" }}>
        <p className="text-center text-xs uppercase tracking-[0.3em] mb-6" style={{ color: "#C9A96E", opacity: 0.45 }}>
          Counting down to the event
        </p>
        <div className="flex items-start justify-center gap-0">
          {[
            { value: t.days,    label: "Days"  },
            { value: t.hours,   label: "Hours" },
            { value: t.minutes, label: "Mins"  },
            { value: t.seconds, label: "Secs"  },
          ].map(({ value, label }, i) => (
            <div key={label} className="flex items-start">
              <div className="flex flex-col items-center w-[72px]">
                <span
                  className="text-5xl font-black tabular-nums leading-none"
                  style={{ color: "#E8D5B0", fontVariantNumeric: "tabular-nums" }}
                >
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-widest mt-2" style={{ color: "#C9A96E", opacity: 0.5 }}>
                  {label}
                </span>
              </div>
              {i < 3 && (
                <span className="text-3xl font-light mt-1 mx-1 select-none" style={{ color: "#C9A96E", opacity: 0.35 }}>
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Event Details ── */}
      <div className="w-full max-w-lg px-6 py-8 grid grid-cols-2 gap-4" style={{ background: "#0E0E0E" }}>
        <div className="flex flex-col gap-1 border-l-2 pl-4" style={{ borderColor: "#C9A96E" }}>
          <div className="flex items-center gap-1.5 mb-1" style={{ color: "#C9A96E" }}>
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-widest" style={{ opacity: 0.55 }}>Date</span>
          </div>
          <p className="text-sm font-semibold leading-snug" style={{ color: "#E8D5B0" }}>{event.date}</p>
        </div>

        <div className="flex flex-col gap-1 border-l-2 pl-4" style={{ borderColor: "#C9A96E" }}>
          <div className="flex items-center gap-1.5 mb-1" style={{ color: "#C9A96E" }}>
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-widest" style={{ opacity: 0.55 }}>Place</span>
          </div>
          <p className="text-sm font-semibold leading-snug" style={{ color: "#E8D5B0" }}>{event.venue}</p>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="w-full" style={{ background: "#0E0E0E" }}>
        <div className="mx-5 mb-6 rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(201,169,110,0.25)" }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#1A1A1A", borderBottom: "1px solid rgba(201,169,110,0.15)" }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
            <span className="text-xs tracking-wide" style={{ color: "#C9A96E", opacity: 0.65 }}>Venue Location</span>
          </div>
          <iframe
            src={event.embedUrl}
            width="100%"
            height="210"
            style={{ border: 0, display: "block", filter: "grayscale(20%) brightness(0.88)" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Venue Location"
          />
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="w-full max-w-lg px-5 flex flex-col gap-3 pb-6" style={{ background: "#0E0E0E" }}>
        <a
          data-reveal
          href={event.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleMap}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: "linear-gradient(90deg, #9A7840, #C9A96E, #E8D5B0, #C9A96E, #9A7840)", backgroundSize: "200% auto", color: "#0E0E0E", transitionDelay: "0ms" }}
        >
          <Navigation className="w-4 h-4" />
          Get Directions on Google Maps
        </a>

        <button
          data-reveal
          onClick={() => { if (!attended) setShowRsvpModal(true); }}
          disabled={attended}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold text-sm border transition-all active:scale-[0.98]"
          style={
            attended
              ? { background: "rgba(34,197,94,0.08)", borderColor: "#22c55e", color: "#4ade80", transitionDelay: "120ms" }
              : { background: "transparent", borderColor: "rgba(201,169,110,0.35)", color: "#C9A96E", transitionDelay: "120ms" }
          }
        >
          {attended ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Jai Guru! Marked as Attending
              <AttendCount className="ml-1 text-xs text-green-400" />
            </>
          ) : (
            "জয় গুরু — আমি উৎসবে উপস্থিত থাকব"
          )}
        </button>

      </div>

      {/* ── Attractions ── */}
      <div className="w-full py-10" style={{ background: "#141414" }}>
        <div className="flex items-center gap-3 px-5 mb-8">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: "#C9A96E", opacity: 0.55 }}>Specialties &amp; Attractions</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
        </div>
        <div className="flex flex-col">
          {(() => {
            const ICON_MAP: Record<string, React.ElementType> = {
              "Medical Camp": Stethoscope, "Cheap Canteen": UtensilsCrossed,
              "Jajan Parikrama": Footprints, "Diksha Grahan": BookOpen,
              "Photo Gallery": Camera, "Ananda Bazar": ShoppingBag,
              "Music Event": Music, "Istaprasanga": Mic,
              "Cultural Events": Palette, "Drama": Theater,
            };
            const items = dbAttractions;
            return items.map((a, i) => {
              const Icon = ICON_MAP[a.name] ?? Sparkles;
              const imgs = a.images.map(x => x.imageUrl);
              const open = expanded === a.id;
              return (
                <div
                  key={a.id}
                  data-reveal
                  style={{ borderBottom: i < items.length - 1 ? "1px solid rgba(201,169,110,0.06)" : "none" }}
                >
                  <button
                    onClick={() => setExpanded(open ? null : a.id)}
                    className="w-full flex items-center gap-5 px-6 py-4 relative text-left"
                    style={{ background: open ? "rgba(201,169,110,0.04)" : "transparent" }}
                  >
                    <div className="reveal-bar absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: "linear-gradient(180deg, #C9A96E, #9A7840)" }} />
                    <span className="font-black tabular-nums select-none" style={{ color: "#C9A96E", opacity: open ? 0.5 : 0.18, fontSize: "clamp(2rem, 7vw, 2.8rem)", lineHeight: 1, minWidth: "2.2ch", transition: "opacity 0.3s" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-semibold tracking-wide" style={{ color: open ? "#C9A96E" : "#E8D5B0", fontSize: "clamp(1rem, 3.8vw, 1.15rem)", transition: "color 0.3s" }}>
                      {a.name}
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#C9A96E", opacity: 0.6, transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>

                  <div style={{ maxHeight: open ? "500px" : "0px", overflow: "hidden", transition: "max-height 0.45s cubic-bezier(0.16,1,0.3,1)" }}>
                    {open && (
                    <div className="mx-6 mb-4 flex flex-col gap-2">
                      {a.description && <p className="text-xs leading-relaxed" style={{ color: "#C9A96E", opacity: 0.55 }}>{a.description}</p>}
                      {imgs.length > 0 && (
                        <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: imgs.length === 1 ? "1fr" : "1fr 1fr" }}>
                          {imgs.map((src, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden aspect-video" style={{ border: "1px solid rgba(201,169,110,0.2)" }}>
                              <img src={src} alt={`${a.name} ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ))}
                        </div>
                      )}
                      {a.formSlug && (
                        <button onClick={() => setDynFormSlug(a.formSlug)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm mt-2" style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.22), rgba(154,120,64,0.16))", border: "1px solid rgba(201,169,110,0.45)", color: "#C9A96E", letterSpacing: "0.04em" }}>
                          <CheckCircle className="w-4 h-4" /> Register
                        </button>
                      )}
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm" style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(154,120,64,0.12))", border: "1px solid rgba(201,169,110,0.35)", color: "#C9A96E", letterSpacing: "0.04em" }}>
                          <Sparkles className="w-4 h-4" /> Open Link
                        </a>
                      )}
                      {a.navigateToVenue && (
                        <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm" style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(154,120,64,0.12))", border: "1px solid rgba(201,169,110,0.35)", color: "#C9A96E" }}>
                          <Navigation className="w-4 h-4" /> Navigate to Venue
                        </a>
                      )}
                      {imgs.length === 0 && !a.url && !a.formSlug && !a.navigateToVenue && !a.description && (
                        <div className="rounded-xl flex flex-col items-center justify-center gap-2 py-8" style={{ background: "#1A1A1A", border: "1px solid rgba(201,169,110,0.15)" }}>
                          <Icon className="w-8 h-8" style={{ color: "#C9A96E", opacity: 0.35 }} />
                          <p className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.35 }}>Photo coming soon</p>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>


      {/* ── Contact ── */}
      <div className="w-full px-5 py-8" style={{ background: "#0E0E0E" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: "#C9A96E", opacity: 0.55 }}>Contact</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
        </div>
        <div className="flex flex-col gap-3">
          {DEFAULT_CONTACTS.map(({ label, key, fallback }) => (
            <div key={label} className="flex flex-col gap-1 px-4 py-3 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(201,169,110,0.12)" }}>
              <span className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.55 }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: "#E8D5B0" }}>{settings[key] || fallback}</span>
            </div>
          ))}

          {/* Social icons */}
          {(() => {
            const SOCIALS = [
              { key: "social_facebook",  label: "Facebook",
                svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/> },
              { key: "social_instagram", label: "Instagram",
                svg: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></> },
              { key: "social_youtube",   label: "YouTube",
                svg: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></> },
              { key: "social_whatsapp",  label: "WhatsApp",
                svg: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/> },
              { key: "social_twitter",   label: "Twitter / X",
                svg: <path d="M4 4l16 16M20 4 4 20"/> },
              { key: "social_website",   label: "Website",
                svg: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> },
            ];
            const active = SOCIALS.filter(s => initialSettings[s.key]);
            if (!active.length) return null;
            return (
              <div className="flex items-center justify-center gap-3 pt-1">
                {active.map(({ key, label, svg }) => (
                  <a
                    key={key}
                    href={initialSettings[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 40, height: 40,
                      background: "#141414",
                      border: "1px solid rgba(201,169,110,0.25)",
                      color: "#C9A96E",
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {svg}
                    </svg>
                  </a>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── RSVP Modal ── */}
      {showRsvpModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRsvpModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl px-5 pt-6 pb-10 flex flex-col gap-5"
            style={{ background: "#141414", border: "1px solid rgba(201,169,110,0.2)", borderBottom: "none" }}
          >
            {/* Handle + header */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(201,169,110,0.3)" }} />
              <p className="font-bold text-base tracking-wide" style={{ color: "#E8D5B0" }}>Confirm Your Attendance</p>
            </div>

            {rsvpState === "done" ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle className="w-8 h-8" style={{ color: "#C9A96E" }} />
                  <p className="font-bold text-base" style={{ color: "#E8D5B0" }}>Thank you! We'll be in touch.</p>
                  <p className="text-xs" style={{ color: "#C9A96E", opacity: 0.55 }}>Save this card and share on WhatsApp</p>
                </div>
                <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(201,169,110,0.25)" }}>
                  <canvas ref={canvasRef} style={{ display: "block", width: "100%", aspectRatio: "1 / 1" }} />
                </div>
                <button
                  onClick={shareCard}
                  className="w-full py-3.5 rounded-xl font-bold text-sm"
                  style={{ background: "linear-gradient(135deg, #C9A96E, #9A7840)", color: "#0E0E0E" }}
                >Share on WhatsApp</button>
                <button
                  onClick={() => setShowRsvpModal(false)}
                  className="text-xs pb-2"
                  style={{ color: "#C9A96E", opacity: 0.45 }}
                >Close</button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setRsvpState("loading");
                  try {
                    const res = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rsvpForm) });
                    if (res.ok) { setRsvpState("done"); handleAttend(); }
                    else setRsvpState("error");
                  } catch { setRsvpState("error"); }
                }}
                className="flex flex-col gap-4"
              >
                {([
                  { key: "name",       label: "Full Name",     type: "text", required: true },
                  { key: "whatsapp",   label: "WhatsApp No.",  type: "tel",  required: true },
                  { key: "village",    label: "Village / Town / Area", type: "text", required: true },
                  { key: "postOffice", label: "Post Office",   type: "text", required: false },
                  { key: "pinCode",    label: "PIN Code",      type: "text", required: true },
                  { key: "district",   label: "District",      type: "text", required: false },
                ] as const).map(({ key, label, type, required }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.55 }}>
                      {label}{required ? <span style={{ color: "#f87171" }}> *</span> : <span style={{ opacity: 0.5 }}> (optional)</span>}
                    </label>
                    <input
                      type={type}
                      required={required}
                      value={rsvpForm[key]}
                      onChange={(e) => setRsvpForm(p => ({ ...p, [key]: e.target.value }))}
                      className="rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E" }}
                    />
                  </div>
                ))}
                {rsvpState === "error" && (
                  <p className="text-xs text-center" style={{ color: "#ff6b6b" }}>Something went wrong. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={rsvpState === "loading"}
                  className="w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase"
                  style={{ background: "linear-gradient(135deg, #C9A96E, #9A7840)", color: "#0E0E0E", opacity: rsvpState === "loading" ? 0.6 : 1 }}
                >
                  {rsvpState === "loading" ? "Submitting…" : "Confirm Attendance"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}



      {/* ── Dynamic Form Modal ── */}
      {dynFormSlug && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDynFormSlug(null); }}
        >
          <div
            className="no-scrollbar w-full max-w-lg rounded-t-3xl px-5 pt-6 pb-10 flex flex-col gap-4"
            style={{ background: "#141414", border: "1px solid rgba(201,169,110,0.2)", borderBottom: "none", maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Handle + header */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(201,169,110,0.3)" }} />
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.2)" }}>
                  <CheckCircle className="w-4 h-4" style={{ color: "#C9A96E" }} />
                </div>
                <div>
                  <p className="font-bold text-base leading-tight" style={{ color: "#E8D5B0" }}>{dynFormData?.name ?? "Registration"}</p>
                  {dynFormData?.description && <p className="text-xs" style={{ color: "#C9A96E", opacity: 0.5 }}>{dynFormData.description}</p>}
                </div>
              </div>
            </div>

            {!dynFormData ? (
              <div className="flex justify-center py-8">
                <div style={{ width: 28, height: 28, border: "2.5px solid rgba(201,169,110,0.4)", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : dynFormState === "done" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="w-10 h-10" style={{ color: "#C9A96E" }} />
                <p className="font-bold text-base" style={{ color: "#E8D5B0" }}>Submitted!</p>
                <p className="text-xs" style={{ color: "#C9A96E", opacity: 0.55 }}>Your registration has been received. Thank you!</p>
                <button onClick={() => setDynFormSlug(null)} className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm" style={{ background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.3)", color: "#C9A96E" }}>Close</button>
              </div>
            ) : (
              <form onSubmit={dynSubmit} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
                {dynFormState === "error" && (
                  <p className="text-xs text-center py-2 rounded-lg" style={{ gridColumn: "span 2", background: "rgba(239,68,68,0.1)", color: "#f87171" }}>Something went wrong. Please try again.</p>
                )}
                {dynFormData.fields.map(field => {
                  const err = dynFormErrors[field.label];
                  const opts: string[] = field.options ? (() => { try { return JSON.parse(field.options!); } catch { return []; } })() : [];
                  const v = field.validation ? (() => { try { return JSON.parse(field.validation!); } catch { return {}; } })() : {} as Record<string, unknown>;
                  const colSpan: React.CSSProperties = { gridColumn: (field.type === "section" || (v.colSpan ?? "full") === "full") ? "span 2" : "span 1" };
                  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none";
                  const inputStyle: React.CSSProperties = {
                    background: "#0E0E0E", border: `1px solid ${err ? "rgba(239,68,68,0.5)" : "rgba(201,169,110,0.2)"}`,
                    color: "#E8D5B0", fontFamily: "inherit",
                  };
                  if (field.type === "section") return (
                    <div key={field.id} style={{ gridColumn: "span 2", borderTop: "1px solid rgba(201,169,110,0.2)", paddingTop: 14, marginTop: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#C9A96E", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>{field.label}</p>
                      {field.placeholder && <p style={{ fontSize: 11, color: "#666", margin: "3px 0 0" }}>{field.placeholder}</p>}
                    </div>
                  );
                  return (
                    <div key={field.id} className="flex flex-col gap-1.5" style={colSpan}>
                      {field.type !== "checkbox" && field.type !== "file" && (
                        <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>
                          {field.label}{field.required && <span style={{ color: "#f87171" }}> *</span>}
                        </label>
                      )}
                      {field.type === "text" && (
                        <input
                          type={v.format === "email" ? "email" : v.format === "numeric" ? "number" : "text"}
                          className={inputCls} style={inputStyle}
                          placeholder={field.placeholder ?? ""}
                          value={dynFormValues[field.label] ?? ""}
                          onChange={e => { setDynFormValues(p => ({ ...p, [field.label]: e.target.value })); setDynFormErrors(p => { const n = { ...p }; delete n[field.label]; return n; }); }}
                        />
                      )}
                      {field.type === "textarea" && (
                        <textarea
                          className={inputCls} style={{ ...inputStyle, height: 90, resize: "vertical" }}
                          placeholder={field.placeholder ?? ""}
                          value={dynFormValues[field.label] ?? ""}
                          onChange={e => { setDynFormValues(p => ({ ...p, [field.label]: e.target.value })); setDynFormErrors(p => { const n = { ...p }; delete n[field.label]; return n; }); }}
                        />
                      )}
                      {(field.type === "date" || field.type === "datetime") && (
                        <input
                          type={field.type === "datetime" ? "datetime-local" : "date"}
                          className={inputCls} style={{ ...inputStyle, colorScheme: "dark" }}
                          min={v.disallowPast ? new Date().toISOString().slice(0, field.type === "datetime" ? 16 : 10) : (v.minDate as string | undefined)}
                          max={v.disallowFuture ? new Date().toISOString().slice(0, field.type === "datetime" ? 16 : 10) : (v.maxDate as string | undefined)}
                          value={dynFormValues[field.label] ?? ""}
                          onChange={e => { setDynFormValues(p => ({ ...p, [field.label]: e.target.value })); setDynFormErrors(p => { const n = { ...p }; delete n[field.label]; return n; }); }}
                        />
                      )}
                      {field.type === "select" && (v.selectStyle ?? "pills") === "pills" && (
                        <div className="flex flex-wrap gap-2">
                          {opts.filter((o: string) => o.trim()).map((o: string, oi: number) => {
                            const sel = dynFormValues[field.label] === o;
                            const iconName = (v.selectIcons as string[] | undefined)?.[oi] ?? "";
                            return (
                              <button
                                key={o} type="button"
                                onClick={() => { setDynFormValues(p => ({ ...p, [field.label]: o })); setDynFormErrors(p => { const n = { ...p }; delete n[field.label]; return n; }); }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6,
                                  padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                                  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                                  border: `1.5px solid ${sel ? "#C9A96E" : "rgba(201,169,110,0.25)"}`,
                                  background: sel ? "rgba(201,169,110,0.18)" : "transparent",
                                  color: sel ? "#C9A96E" : "#666",
                                }}
                              >
                                {iconName && <LucideIcon name={iconName} size={14} />}
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {field.type === "select" && v.selectStyle === "dropdown" && (
                        <select
                          className={inputCls}
                          style={{ ...inputStyle, cursor: "pointer" }}
                          value={dynFormValues[field.label] ?? ""}
                          onChange={e => { setDynFormValues(p => ({ ...p, [field.label]: e.target.value })); setDynFormErrors(p => { const n = { ...p }; delete n[field.label]; return n; }); }}
                        >
                          <option value="">— Select an option —</option>
                          {opts.filter((o: string) => o.trim()).map((o: string) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      )}
                      {field.type === "file" && (() => {
                        const accept = v.accept === "image" ? "image/*" : v.accept === "pdf" ? "application/pdf" : v.accept === "doc" ? "application/pdf,.doc,.docx" : undefined;
                        const uploaded = dynFormValues[field.label];
                        const uploading = dynFormValues[`__uploading_${field.label}`] === "1";
                        return (
                          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "18px 12px", borderRadius: 12, border: `2px dashed ${err ? "rgba(239,68,68,0.5)" : uploaded ? "rgba(201,169,110,0.5)" : "rgba(201,169,110,0.2)"}`, background: uploaded ? "rgba(201,169,110,0.07)" : "#0E0E0E", cursor: uploading ? "wait" : "pointer", transition: "border-color 0.2s" }}>
                            <input type="file" accept={accept} style={{ display: "none" }} onChange={async e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              setDynFormValues(p => ({ ...p, [`__uploading_${field.label}`]: "1" }));
                              const fd = new FormData(); fd.append("file", file);
                              const res = await fetch("/api/form-upload", { method: "POST", body: fd });
                              if (res.ok) {
                                const { url, name } = await res.json();
                                setDynFormValues(p => { const n = { ...p, [field.label]: url, [`__file_name_${field.label}`]: name }; delete n[`__uploading_${field.label}`]; return n; });
                                setDynFormErrors(p => { const n = { ...p }; delete n[field.label]; return n; });
                              } else {
                                setDynFormValues(p => { const n = { ...p }; delete n[`__uploading_${field.label}`]; return n; });
                              }
                            }} />
                            {uploading ? (
                              <span style={{ fontSize: 12, color: "#C9A96E", opacity: 0.7 }}>Uploading…</span>
                            ) : uploaded ? (
                              <>
                                <span style={{ fontSize: 18 }}>📎</span>
                                <span className="text-xs text-center" style={{ color: "#C9A96E", opacity: 0.85, wordBreak: "break-all" }}>{dynFormValues[`__file_name_${field.label}`] || "File uploaded"}</span>
                                <span className="text-xs" style={{ color: "#C9A96E", opacity: 0.45 }}>Tap to change</span>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: 22 }}>📎</span>
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>{field.label}{field.required && <span style={{ color: "#f87171" }}> *</span>}</span>
                                <span className="text-xs" style={{ color: "#C9A96E", opacity: 0.35 }}>Tap to choose file</span>
                              </>
                            )}
                          </label>
                        );
                      })()}
                      {field.type === "checkbox" && (
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 12, border: `1px solid ${err ? "rgba(239,68,68,0.5)" : dynFormValues[field.label] === "true" ? "rgba(201,169,110,0.4)" : "rgba(201,169,110,0.15)"}`, background: dynFormValues[field.label] === "true" ? "rgba(201,169,110,0.07)" : "#0E0E0E", transition: "background 0.2s, border-color 0.2s" }}>
                          <input
                            type="checkbox"
                            checked={dynFormValues[field.label] === "true"}
                            onChange={e => { setDynFormValues(p => ({ ...p, [field.label]: e.target.checked ? "true" : "" })); setDynFormErrors(p => { const n = { ...p }; delete n[field.label]; return n; }); }}
                            style={{ marginTop: 2, accentColor: "#C9A96E", flexShrink: 0, width: 15, height: 15, cursor: "pointer" }}
                          />
                          <span className="text-xs leading-relaxed" style={{ color: dynFormValues[field.label] === "true" ? "#C9A96E" : "#C9A96E", opacity: dynFormValues[field.label] === "true" ? 0.85 : 0.55 }}>{field.label}{field.required && <span style={{ color: "#f87171" }}> *</span>}</span>
                        </label>
                      )}
                      {err && <p className="text-xs" style={{ color: "#f87171" }}>{err}</p>}
                    </div>
                  );
                })}
                <button
                  type="submit" disabled={dynFormState === "loading"}
                  className="w-full py-4 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2"
                  style={{ gridColumn: "span 2", background: dynFormState === "loading" ? "rgba(201,169,110,0.1)" : "linear-gradient(135deg, rgba(201,169,110,0.25), rgba(154,120,64,0.2))", border: "1px solid rgba(201,169,110,0.4)", color: "#C9A96E", cursor: dynFormState === "loading" ? "not-allowed" : "pointer" }}
                >
                  {dynFormState === "loading" && <span style={{ width: 14, height: 14, border: "2px solid rgba(201,169,110,0.3)", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                  {dynFormState === "loading" ? "Submitting…" : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Coming Soon ── */}
      <div className="w-full max-w-lg px-5 pb-12" style={{ background: "#0E0E0E" }}>
        <div
          className="rounded-2xl px-6 py-6 flex flex-col items-center gap-3 border"
          style={{ background: "#141414", borderColor: "rgba(201,169,110,0.18)" }}
        >
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: "#C9A96E" }} />
            <div className="pulse-bar flex-1 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #9A7840, #E8D5B0, #9A7840)" }} />
            <div className="flex-1 h-px" style={{ background: "#C9A96E" }} />
          </div>

          <div className="text-center">
            <p className="font-bold text-sm" style={{ color: "#E8D5B0" }}>More Details Coming Soon</p>
            <p className="text-xs mt-1" style={{ color: "#C9A96E", opacity: 0.5 }}>
              Schedule &amp; programme details will be updated here
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#C9A96E", animation: `pulse-bar 1.4s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating Music Button ── */}
      {mounted ? (
        <button
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          className="fixed bottom-6 right-5 z-50 flex items-center justify-center rounded-full shadow-lg"
          style={{
            width: "48px", height: "48px",
            background: "rgba(20,20,20,0.85)",
            border: "1px solid rgba(201,169,110,0.4)",
            backdropFilter: "blur(10px)",
          }}
        >
          {playing ? (
            <svg className="music-disc" width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#C9A96E" strokeWidth="1.2" />
              <circle cx="12" cy="12" r="3" fill="#C9A96E" />
              <circle cx="12" cy="12" r="1" fill="#0E0E0E" />
            </svg>
          ) : (
            <Music className="w-5 h-5" style={{ color: "#C9A96E", opacity: 0.6 }} />
          )}
        </button>
      ) : null}

    </div>
  );
}
