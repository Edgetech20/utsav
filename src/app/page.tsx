"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Calendar, Navigation, CheckCircle, ChevronDown, Stethoscope, UtensilsCrossed, Footprints, BookOpen, Camera, BedDouble, ShoppingBag, Music, Mic, Palette, Theater, Sparkles, ParkingSquare, Car, Bus } from "lucide-react";

const EVENT = {
  title: "প্ৰিয়বোধী মহোৎসব",
  date: "Sunday, 20 December 2026",
  venue: "Alinagar Playground, Bhatar, Purba Burdwan, West Bengal 713125",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Alinagar+Playground,+Bhatar,+Purba+Burdwan,+West+Bengal+713125",
  embedUrl:
    "https://maps.google.com/maps?q=Alinagar+Playground,+Bhatar,+Purba+Burdwan,+West+Bengal+713125&output=embed",
};


const TARGET_DATE = new Date("2026-12-20T00:00:00").getTime();

function useCountdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    function tick() {
      const diff = TARGET_DATE - Date.now();
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
  }, []);
  return t;
}

export default function Home() {
  const [attended, setAttended] = useState(false);
  const [attendCount, setAttendCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ name: "", whatsapp: "", address: "" });
  const [rsvpState, setRsvpState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleAgreed, setVehicleAgreed] = useState(false);
  const [vehicleState, setVehicleState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [vehicleForm, setVehicleForm] = useState({
    contactName: "", mobile: "", vehicleType: "car", vehicleNo: "",
    totalPassengers: "", comingFrom: "", arrivalAt: "", departureAt: "", remark: "",
  });

  const [showAccomModal, setShowAccomModal] = useState(false);
  const [accomAgreed, setAccomAgreed] = useState(false);
  const [accomState, setAccomState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [accomForm, setAccomForm] = useState({
    primaryName: "", mobile: "", comingFrom: "",
    totalPersons: "", maleMem: "", femaleMem: "", children: "", seniorCitizens: "",
    arrivalDate: "", arrivalTime: "", departureDate: "", departureTime: "",
    needsAssistance: "" as "" | "yes" | "no",
    assistanceDetails: "",
    hasVehicle: "" as "" | "yes" | "no",
    vehicleType: "car", vehicleNo: "",
    additionalInfo: "",
  });

  const [entered, setEntered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const installPromptRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const android = /Android/i.test(navigator.userAgent);
    setIsIOS(ios);
    setIsMobile(ios || android);
    if (!android) return;
    const handler = (e: Event) => { e.preventDefault(); installPromptRef.current = e; setInstallable(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleInstall(e: React.MouseEvent) {
    e.stopPropagation();
    if (installPromptRef.current) {
      installPromptRef.current.prompt();
      installPromptRef.current.userChoice.then(() => { installPromptRef.current = null; setInstallable(false); });
    } else if (isIOS) {
      setShowIOSHint(true);
    }
  }

  useEffect(() => {
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
  const t = useCountdown();

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
  }, []);

  function handleMap() {
    fetch("/api/track?type=map", { method: "POST" }).catch(() => {});
  }

  async function handleAttend() {
    if (attended) return;
    const res = await fetch("/api/track?type=attend", { method: "POST" });
    const data = await res.json();
    setAttended(true);
    setAttendCount(data.unique);
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

          {isMobile ? (
            <button
              onClick={handleInstall}
              className="mt-5 flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{
                background: "rgba(201,169,110,0.15)",
                border: "1px solid rgba(201,169,110,0.5)",
                color: "#C9A96E",
              }}
            >
              ⬇ Install App
            </button>
          ) : null}

          {/* iOS install instructions sheet */}
          {showIOSHint ? (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed", inset: 0, zIndex: 200,
                background: "rgba(0,0,0,0.7)",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%", maxWidth: 480,
                  background: "#1A1A1A",
                  borderRadius: "20px 20px 0 0",
                  border: "1px solid rgba(201,169,110,0.2)",
                  padding: "28px 24px 40px",
                }}
              >
                <p className="text-center font-bold mb-4" style={{ color: "#E8D5B0", fontSize: "1rem" }}>
                  Install on iPhone
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    "1. Tap the Share button (□↑) at the bottom of Safari",
                    "2. Scroll down and tap \"Add to Home Screen\"",
                    "3. Tap \"Add\" in the top right",
                  ].map((step) => (
                    <p key={step} className="text-sm" style={{ color: "#C9A96E", opacity: 0.85 }}>{step}</p>
                  ))}
                </div>
                <button
                  onClick={() => setShowIOSHint(false)}
                  className="mt-6 w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.3)" }}
                >
                  Got it
                </button>
              </div>
            </div>
          ) : null}
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
          <p className="text-sm font-semibold leading-snug" style={{ color: "#E8D5B0" }}>{EVENT.date}</p>
        </div>

        <div className="flex flex-col gap-1 border-l-2 pl-4" style={{ borderColor: "#C9A96E" }}>
          <div className="flex items-center gap-1.5 mb-1" style={{ color: "#C9A96E" }}>
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-widest" style={{ opacity: 0.55 }}>Place</span>
          </div>
          <p className="text-sm font-semibold leading-snug" style={{ color: "#E8D5B0" }}>{EVENT.venue}</p>
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
            src={EVENT.embedUrl}
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
          href={EVENT.mapsUrl}
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
              {attendCount !== null && (
                <span className="ml-1 text-xs text-green-400">({attendCount} attending)</span>
              )}
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
          {[
            { label: "Accommodation",    img: [], Icon: BedDouble },
            { label: "Bus & Car Parking", img: [], Icon: ParkingSquare },
            { label: "Medical Camp",     img: [], Icon: Stethoscope },
            { label: "Cheap Canteen",    img: [], Icon: UtensilsCrossed },
            { label: "Jajan Parikrama",  img: [], Icon: Footprints },
            { label: "Diksha Grahan",    img: [], Icon: BookOpen },
            { label: "Photo Gallery",    img: [], Icon: Camera },
            { label: "Ananda Bazar",     img: [], Icon: ShoppingBag },
            { label: "Music Event",      img: [], Icon: Music },
            { label: "Istaprasanga",     img: [], Icon: Mic },
            { label: "Cultural Events",  img: [], Icon: Palette },
            { label: "Drama",            img: [], Icon: Theater },
            { label: "And Many More…",   img: [], Icon: Sparkles },
          ].map(({ label, img, Icon }, i) => {
            const open = expanded === i;
            return (
              <div
                key={label}
                data-reveal
                style={{ borderBottom: i < 12 ? "1px solid rgba(201,169,110,0.06)" : "none" }}
              >
                {/* Row header — clickable */}
                <button
                  onClick={() => setExpanded(open ? null : i)}
                  className="w-full flex items-center gap-5 px-6 py-4 relative text-left"
                  style={{ background: open ? "rgba(201,169,110,0.04)" : "transparent" }}
                >
                  <div
                    className="reveal-bar absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
                    style={{ background: "linear-gradient(180deg, #C9A96E, #9A7840)" }}
                  />
                  <span
                    className="font-black tabular-nums select-none"
                    style={{ color: "#C9A96E", opacity: open ? 0.5 : 0.18, fontSize: "clamp(2rem, 7vw, 2.8rem)", lineHeight: 1, minWidth: "2.2ch", transition: "opacity 0.3s" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex-1 font-semibold tracking-wide"
                    style={{ color: open ? "#C9A96E" : "#E8D5B0", fontSize: "clamp(1rem, 3.8vw, 1.15rem)", transition: "color 0.3s" }}
                  >
                    {label}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "#C9A96E", opacity: 0.6, transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                {/* Expandable panel */}
                <div
                  style={{
                    maxHeight: open ? "400px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.45s cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  <div className="mx-6 mb-4">
                    {label === "Accommodation" ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs leading-relaxed" style={{ color: "#C9A96E", opacity: 0.55 }}>
                          Pre-register for accommodation at the venue. Allotment is subject to availability.
                        </p>
                        <button
                          onClick={() => setShowAccomModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                          style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(154,120,64,0.12))", border: "1px solid rgba(201,169,110,0.35)", color: "#C9A96E", letterSpacing: "0.04em" }}
                        >
                          <BedDouble className="w-4 h-4" />
                          Register for Accommodation
                        </button>
                      </div>
                    ) : label === "Bus & Car Parking" ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs leading-relaxed" style={{ color: "#C9A96E", opacity: 0.55 }}>
                          Book your parking slot.
                        </p>
                        <button
                          onClick={() => setShowVehicleModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                          style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(154,120,64,0.12))", border: "1px solid rgba(201,169,110,0.35)", color: "#C9A96E", letterSpacing: "0.04em" }}
                        >
                          <ParkingSquare className="w-4 h-4" />
                          Register Your Vehicle
                        </button>
                      </div>
                    ) : (Array.isArray(img) ? img : [img]).filter(Boolean).length > 0 ? (
                      <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        {(Array.isArray(img) ? img : [img]).map((src, idx) => (
                          <div key={idx} className="rounded-xl overflow-hidden aspect-video" style={{ border: "1px solid rgba(201,169,110,0.2)" }}>
                            <img src={src} alt={`${label} ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="rounded-xl flex flex-col items-center justify-center gap-2 py-8"
                        style={{ background: "#1A1A1A", border: "1px solid rgba(201,169,110,0.15)" }}
                      >
                        <Icon className="w-8 h-8" style={{ color: "#C9A96E", opacity: 0.35 }} />
                        <p className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.35 }}>
                          Photo coming soon
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
          {[
            { label: "Organiser",  value: "Purba Bardhaman North-Subdivision Satsang" },
            { label: "Phone",      value: "+91 XXXXX XXXXX" },
            { label: "WhatsApp",   value: "+91 91535 71828" },
            { label: "Email",      value: "priyabodhimahotsav@gmail.com" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 px-4 py-3 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(201,169,110,0.12)" }}>
              <span className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.55 }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: "#E8D5B0" }}>{value}</span>
            </div>
          ))}
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
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="w-10 h-10" style={{ color: "#C9A96E" }} />
                <p className="font-bold text-base" style={{ color: "#E8D5B0" }}>Thank you! We'll be in touch.</p>
                <p className="text-xs" style={{ color: "#C9A96E", opacity: 0.55 }}>Your details have been recorded.</p>
                <button
                  onClick={() => setShowRsvpModal(false)}
                  className="mt-3 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E" }}
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
                {(["name", "whatsapp", "address"] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.55 }}>
                      {field === "name" ? "Full Name" : field === "whatsapp" ? "WhatsApp No." : "Address"}
                    </label>
                    {field === "address" ? (
                      <textarea
                        rows={3}
                        required
                        value={rsvpForm[field]}
                        onChange={(e) => setRsvpForm(p => ({ ...p, [field]: e.target.value }))}
                        className="rounded-xl px-4 py-3 text-sm resize-none outline-none"
                        style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E" }}
                      />
                    ) : (
                      <input
                        type={field === "whatsapp" ? "tel" : "text"}
                        required
                        value={rsvpForm[field]}
                        onChange={(e) => setRsvpForm(p => ({ ...p, [field]: e.target.value }))}
                        className="rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E" }}
                      />
                    )}
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

      {/* ── Vehicle & Parking Modal ── */}
      {showVehicleModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowVehicleModal(false); }}
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
                  <ParkingSquare className="w-4 h-4" style={{ color: "#C9A96E" }} />
                </div>
                <div>
                  <p className="font-bold text-base leading-tight" style={{ color: "#E8D5B0" }}>Vehicle &amp; Parking</p>
                  <p className="text-xs" style={{ color: "#C9A96E", opacity: 0.5 }}>Pre-registration for 20 December</p>
                </div>
              </div>
            </div>

            {vehicleState === "done" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="w-10 h-10" style={{ color: "#C9A96E" }} />
                <p className="font-bold text-base" style={{ color: "#E8D5B0" }}>Registration Confirmed!</p>
                <p className="text-xs" style={{ color: "#C9A96E", opacity: 0.55 }}>Your vehicle details have been recorded.</p>
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="mt-3 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E" }}
                >Close</button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!vehicleAgreed) return;
                  setVehicleState("loading");
                  try {
                    const res = await fetch("/api/vehicle", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...vehicleForm, totalPassengers: Number(vehicleForm.totalPassengers) }),
                    });
                    if (res.ok) setVehicleState("done");
                    else setVehicleState("error");
                  } catch { setVehicleState("error"); }
                }}
                className="flex flex-col gap-3"
              >
                {/* Name + Mobile */}
                <div className="grid grid-cols-2 gap-3">
                  {(["contactName", "mobile"] as const).map(field => (
                    <div key={field} className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>
                        {field === "contactName" ? "Contact Person" : "Mobile No."}
                      </label>
                      <input
                        type={field === "mobile" ? "tel" : "text"}
                        required
                        value={vehicleForm[field]}
                        onChange={e => setVehicleForm(p => ({ ...p, [field]: e.target.value }))}
                        className="vf-input rounded-xl px-4 py-3 text-sm"
                        style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Vehicle Type pill toggle + Vehicle No */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Vehicle Type</label>
                    <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,169,110,0.2)", background: "#0E0E0E", height: "46px" }}>
                      {(["car", "bus"] as const).map((type, ti) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setVehicleForm(p => ({ ...p, vehicleType: type }))}
                          className="flex flex-1 items-center justify-center gap-1.5 text-sm font-semibold"
                          style={{
                            background: vehicleForm.vehicleType === type ? "rgba(201,169,110,0.15)" : "transparent",
                            color: vehicleForm.vehicleType === type ? "#C9A96E" : "#555",
                            borderTop: "none", borderBottom: "none", borderLeft: "none",
                            borderRight: ti === 0 ? "1px solid rgba(201,169,110,0.2)" : "none",
                            transition: "background 0.2s, color 0.2s",
                            cursor: "pointer",
                          }}
                        >
                          {type === "car" ? <Car className="w-3.5 h-3.5" /> : <Bus className="w-3.5 h-3.5" />}
                          {type === "car" ? "Car" : "Bus"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Vehicle No.</label>
                    <input
                      type="text"
                      required
                      placeholder="WB 40 AB 1234"
                      value={vehicleForm.vehicleNo}
                      onChange={e => setVehicleForm(p => ({ ...p, vehicleNo: e.target.value.toUpperCase() }))}
                      className="vf-input rounded-xl px-4 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                </div>

                {/* Passengers + Coming From */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Passengers</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 4"
                      value={vehicleForm.totalPassengers}
                      onChange={e => setVehicleForm(p => ({ ...p, totalPassengers: e.target.value }))}
                      className="vf-input rounded-xl px-4 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Coming From</label>
                    <input
                      type="text"
                      required
                      placeholder="City / District"
                      value={vehicleForm.comingFrom}
                      onChange={e => setVehicleForm(p => ({ ...p, comingFrom: e.target.value }))}
                      className="vf-input rounded-xl px-4 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                </div>

                {/* Arrival + Departure */}
                <div className="grid grid-cols-2 gap-3">
                  {(["arrivalAt", "departureAt"] as const).map(field => (
                    <div key={field} className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>
                        {field === "arrivalAt" ? "Arrival" : "Departure"}
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={vehicleForm[field]}
                        onChange={e => setVehicleForm(p => ({ ...p, [field]: e.target.value }))}
                        className="vf-input rounded-xl px-3 py-3 text-sm"
                        style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", colorScheme: "dark", transition: "border-color 0.2s, box-shadow 0.2s" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Remark */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Remark</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Special parking needs, large vehicles, etc."
                    value={vehicleForm.remark}
                    onChange={e => setVehicleForm(p => ({ ...p, remark: e.target.value }))}
                    className="vf-input rounded-xl px-4 py-3 text-sm resize-none"
                    style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  />
                </div>

                {/* Confirmation */}
                <label
                  className="flex items-start gap-3 rounded-xl p-4 cursor-pointer"
                  style={{
                    background: vehicleAgreed ? "rgba(201,169,110,0.07)" : "#0E0E0E",
                    border: `1px solid ${vehicleAgreed ? "rgba(201,169,110,0.4)" : "rgba(201,169,110,0.15)"}`,
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={vehicleAgreed}
                    onChange={e => setVehicleAgreed(e.target.checked)}
                    style={{ marginTop: 2, accentColor: "#C9A96E", flexShrink: 0, width: 15, height: 15 }}
                  />
                  <span className="text-xs leading-relaxed" style={{ color: "#C9A96E", opacity: vehicleAgreed ? 0.85 : 0.55 }}>
                    I confirm that the information provided above is correct and that I will follow the parking and traffic management instructions provided by the Utsab authorities / volunteers.
                  </span>
                </label>

                {vehicleState === "error" && (
                  <p className="text-xs text-center" style={{ color: "#ff6b6b" }}>Something went wrong. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={vehicleState === "loading" || !vehicleAgreed}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm tracking-widest uppercase"
                  style={{
                    background: "linear-gradient(135deg, #C9A96E, #9A7840)",
                    color: "#0E0E0E",
                    opacity: (vehicleState === "loading" || !vehicleAgreed) ? 0.4 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {vehicleState === "loading" ? "Submitting…" : <><ParkingSquare className="w-4 h-4" /> Register Vehicle</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Accommodation Modal ── */}
      {showAccomModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAccomModal(false); }}
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
                  <BedDouble className="w-4 h-4" style={{ color: "#C9A96E" }} />
                </div>
                <div>
                  <p className="font-bold text-base leading-tight" style={{ color: "#E8D5B0" }}>Accommodation Registration</p>
                  <p className="text-xs" style={{ color: "#C9A96E", opacity: 0.5 }}>Subject to availability · 20 December</p>
                </div>
              </div>
            </div>

            {accomState === "done" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="w-10 h-10" style={{ color: "#C9A96E" }} />
                <p className="font-bold text-base" style={{ color: "#E8D5B0" }}>Registration Received!</p>
                <p className="text-xs" style={{ color: "#C9A96E", opacity: 0.55 }}>Accommodation will be allotted subject to availability.</p>
                <button onClick={() => setShowAccomModal(false)} className="mt-3 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E" }}>Close</button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!accomAgreed || !accomForm.needsAssistance || !accomForm.hasVehicle) return;
                  setAccomState("loading");
                  try {
                    const res = await fetch("/api/accommodation", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...accomForm,
                        needsAssistance: accomForm.needsAssistance === "yes",
                        hasVehicle: accomForm.hasVehicle === "yes",
                      }),
                    });
                    if (res.ok) setAccomState("done");
                    else setAccomState("error");
                  } catch { setAccomState("error"); }
                }}
                className="flex flex-col gap-3"
              >
                {/* ── Section: Contact ── */}
                <p className="text-xs uppercase tracking-widest pt-1" style={{ color: "#C9A96E", opacity: 0.4 }}>Contact Details</p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Primary Requester Name</label>
                  <input required type="text" value={accomForm.primaryName}
                    onChange={e => setAccomForm(p => ({ ...p, primaryName: e.target.value }))}
                    className="vf-input rounded-xl px-4 py-3 text-sm"
                    style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Mobile Number</label>
                    <input required type="tel" value={accomForm.mobile}
                      onChange={e => setAccomForm(p => ({ ...p, mobile: e.target.value }))}
                      className="vf-input rounded-xl px-4 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Coming From</label>
                    <input required type="text" placeholder="City / District" value={accomForm.comingFrom}
                      onChange={e => setAccomForm(p => ({ ...p, comingFrom: e.target.value }))}
                      className="vf-input rounded-xl px-4 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                </div>

                {/* ── Section: Group ── */}
                <p className="text-xs uppercase tracking-widest pt-2" style={{ color: "#C9A96E", opacity: 0.4 }}>Group Details</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Total Persons <span style={{ color: "#C9A96E" }}>*</span></label>
                    <input required type="number" min={1} placeholder="e.g. 5" value={accomForm.totalPersons}
                      onChange={e => setAccomForm(p => ({ ...p, totalPersons: e.target.value }))}
                      className="vf-input rounded-xl px-4 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Male</label>
                    <input type="number" min={0} placeholder="0" value={accomForm.maleMem}
                      onChange={e => setAccomForm(p => ({ ...p, maleMem: e.target.value }))}
                      className="vf-input rounded-xl px-4 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {([
                    { field: "femaleMem",     label: "Female" },
                    { field: "children",      label: "Children" },
                    { field: "seniorCitizens", label: "Senior" },
                  ] as const).map(({ field, label }) => (
                    <div key={field} className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>{label}</label>
                      <input type="number" min={0} placeholder="0" value={accomForm[field]}
                        onChange={e => setAccomForm(p => ({ ...p, [field]: e.target.value }))}
                        className="vf-input rounded-xl px-4 py-3 text-sm"
                        style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                      />
                    </div>
                  ))}
                </div>

                {/* ── Section: Stay dates ── */}
                <p className="text-xs uppercase tracking-widest pt-2" style={{ color: "#C9A96E", opacity: 0.4 }}>Stay Details</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Arrival Date</label>
                    <input required type="date" value={accomForm.arrivalDate}
                      onChange={e => setAccomForm(p => ({ ...p, arrivalDate: e.target.value }))}
                      className="vf-input rounded-xl px-3 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", colorScheme: "dark", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Arrival Time</label>
                    <input required type="time" value={accomForm.arrivalTime}
                      onChange={e => setAccomForm(p => ({ ...p, arrivalTime: e.target.value }))}
                      className="vf-input rounded-xl px-3 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", colorScheme: "dark", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Departure Date</label>
                    <input required type="date" value={accomForm.departureDate}
                      onChange={e => setAccomForm(p => ({ ...p, departureDate: e.target.value }))}
                      className="vf-input rounded-xl px-3 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", colorScheme: "dark", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Departure Time</label>
                    <input required type="time" value={accomForm.departureTime}
                      onChange={e => setAccomForm(p => ({ ...p, departureTime: e.target.value }))}
                      className="vf-input rounded-xl px-3 py-3 text-sm"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", colorScheme: "dark", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                </div>

                {/* ── Special Assistance ── */}
                <p className="text-xs uppercase tracking-widest pt-2" style={{ color: "#C9A96E", opacity: 0.4 }}>Special Assistance</p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Elderly / Special Needs?</label>
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,169,110,0.2)", background: "#0E0E0E", height: "46px" }}>
                    {(["yes", "no"] as const).map((val, ti) => (
                      <button key={val} type="button"
                        onClick={() => setAccomForm(p => ({ ...p, needsAssistance: val }))}
                        className="flex flex-1 items-center justify-center text-sm font-semibold"
                        style={{
                          background: accomForm.needsAssistance === val ? "rgba(201,169,110,0.15)" : "transparent",
                          color: accomForm.needsAssistance === val ? "#C9A96E" : "#555",
                          borderTop: "none", borderBottom: "none", borderLeft: "none",
                          borderRight: ti === 0 ? "1px solid rgba(201,169,110,0.2)" : "none",
                          cursor: "pointer", transition: "background 0.2s, color 0.2s",
                        }}
                      >{val === "yes" ? "Yes" : "No"}</button>
                    ))}
                  </div>
                </div>

                {accomForm.needsAssistance === "yes" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Please provide details</label>
                    <textarea rows={2} required value={accomForm.assistanceDetails}
                      onChange={e => setAccomForm(p => ({ ...p, assistanceDetails: e.target.value }))}
                      placeholder="Describe the assistance needed…"
                      className="vf-input rounded-xl px-4 py-3 text-sm resize-none"
                      style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    />
                  </div>
                )}

                {/* ── Own Vehicle ── */}
                <p className="text-xs uppercase tracking-widest pt-2" style={{ color: "#C9A96E", opacity: 0.4 }}>Own Vehicle</p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Arriving by own vehicle?</label>
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,169,110,0.2)", background: "#0E0E0E", height: "46px" }}>
                    {(["yes", "no"] as const).map((val, ti) => (
                      <button key={val} type="button"
                        onClick={() => setAccomForm(p => ({ ...p, hasVehicle: val }))}
                        className="flex flex-1 items-center justify-center text-sm font-semibold"
                        style={{
                          background: accomForm.hasVehicle === val ? "rgba(201,169,110,0.15)" : "transparent",
                          color: accomForm.hasVehicle === val ? "#C9A96E" : "#555",
                          borderTop: "none", borderBottom: "none", borderLeft: "none",
                          borderRight: ti === 0 ? "1px solid rgba(201,169,110,0.2)" : "none",
                          cursor: "pointer", transition: "background 0.2s, color 0.2s",
                        }}
                      >{val === "yes" ? "Yes" : "No"}</button>
                    ))}
                  </div>
                </div>

                {accomForm.hasVehicle === "yes" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Vehicle Type</label>
                      <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,169,110,0.2)", background: "#0E0E0E", height: "46px" }}>
                        {(["car", "bus", "other"] as const).map((type, ti) => (
                          <button key={type} type="button"
                            onClick={() => setAccomForm(p => ({ ...p, vehicleType: type }))}
                            className="flex flex-1 items-center justify-center gap-1 text-xs font-semibold"
                            style={{
                              background: accomForm.vehicleType === type ? "rgba(201,169,110,0.15)" : "transparent",
                              color: accomForm.vehicleType === type ? "#C9A96E" : "#555",
                              borderTop: "none", borderBottom: "none", borderLeft: "none",
                              borderRight: ti < 2 ? "1px solid rgba(201,169,110,0.2)" : "none",
                              cursor: "pointer", transition: "background 0.2s, color 0.2s",
                            }}
                          >
                            {type === "car" ? <Car className="w-3 h-3" /> : type === "bus" ? <Bus className="w-3 h-3" /> : null}
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Vehicle No.</label>
                      <input required type="text" placeholder="WB 40 AB 1234" value={accomForm.vehicleNo}
                        onChange={e => setAccomForm(p => ({ ...p, vehicleNo: e.target.value.toUpperCase() }))}
                        className="vf-input rounded-xl px-4 py-3 text-sm"
                        style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                      />
                    </div>
                  </div>
                )}

                {/* ── Additional Info ── */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.5 }}>Additional Information <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <textarea rows={2} value={accomForm.additionalInfo}
                    onChange={e => setAccomForm(p => ({ ...p, additionalInfo: e.target.value }))}
                    placeholder="Any special requests or information…"
                    className="vf-input rounded-xl px-4 py-3 text-sm resize-none"
                    style={{ background: "#0E0E0E", border: "1px solid rgba(201,169,110,0.2)", color: "#E8D5B0", caretColor: "#C9A96E", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  />
                </div>

                {/* ── Confirmation ── */}
                <label
                  className="flex items-start gap-3 rounded-xl p-4 cursor-pointer"
                  style={{ background: accomAgreed ? "rgba(201,169,110,0.07)" : "#0E0E0E", border: `1px solid ${accomAgreed ? "rgba(201,169,110,0.4)" : "rgba(201,169,110,0.15)"}`, transition: "background 0.2s, border-color 0.2s" }}
                >
                  <input type="checkbox" checked={accomAgreed} onChange={e => setAccomAgreed(e.target.checked)}
                    style={{ marginTop: 2, accentColor: "#C9A96E", flexShrink: 0, width: 15, height: 15 }}
                  />
                  <span className="text-xs leading-relaxed" style={{ color: "#C9A96E", opacity: accomAgreed ? 0.85 : 0.55 }}>
                    I confirm that the above information is correct and understand that accommodation will be allotted subject to availability and the arrangements made by the Utsab authorities.
                  </span>
                </label>

                {accomState === "error" && (
                  <p className="text-xs text-center" style={{ color: "#ff6b6b" }}>Something went wrong. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={accomState === "loading" || !accomAgreed || !accomForm.needsAssistance || !accomForm.hasVehicle}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm tracking-widest uppercase"
                  style={{
                    background: "linear-gradient(135deg, #C9A96E, #9A7840)",
                    color: "#0E0E0E",
                    opacity: (accomState === "loading" || !accomAgreed || !accomForm.needsAssistance || !accomForm.hasVehicle) ? 0.4 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {accomState === "loading" ? "Submitting…" : <><BedDouble className="w-4 h-4" /> Submit Registration</>}
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
