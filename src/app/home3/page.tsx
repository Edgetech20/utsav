"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, Navigation, CheckCircle } from "lucide-react";

const EVENT = {
  title: "প্ৰিয়বোধী মহোৎসব",
  date: "20 December 2026",
  venue: "Galsi, Purba Bardhaman",
  mapsUrl:
    "https://www.google.com/maps/place/Galsi+Mahavidyalaya/@23.3508251,87.6844077,17z/data=!3m1!4b1!4m6!3m5!1s0x39f82d45b3555345:0x3c34436188e7aae6!8m2!3d23.3508251!4d87.6844077",
  embedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3667!2d87.6844077!3d23.3508251!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f82d45b3555345%3A0x3c34436188e7aae6!2sGalsi%20Mahavidyalaya!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
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

export default function Home3() {
  const [attended, setAttended] = useState(false);
  const [attendCount, setAttendCount] = useState<number | null>(null);
  const t = useCountdown();

  useEffect(() => {
    fetch("/api/track?type=view", { method: "POST" }).catch(() => {});
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
        @keyframes tick-flip {
          0%  { transform: translateY(0);    opacity: 1; }
          45% { transform: translateY(-4px); opacity: 0; }
          55% { transform: translateY(4px);  opacity: 0; }
          100%{ transform: translateY(0);    opacity: 1; }
        }
        .tick { animation: tick-flip 1s ease-in-out; }
      `}</style>

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

        <p className="text-xs uppercase tracking-[0.4em] mb-5" style={{ color: "#C9A96E", opacity: 0.5 }}>
          You are cordially invited to
        </p>

        <div className="flex flex-col items-center gap-1 mb-2 mt-4 py-4">
          <h1 className="shimmer-text font-black" style={{ fontSize: "clamp(2rem, 9vw, 3rem)", letterSpacing: "0.03em", lineHeight: 1.6 }}>
            প্ৰিয়বোধী
          </h1>
          <h2 className="shimmer-text font-black" style={{ fontSize: "clamp(1.4rem, 6vw, 2rem)", letterSpacing: "0.06em", lineHeight: 1.6, opacity: 0.85 }}>
            মহোৎসব
          </h2>
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
          <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 px-1.5 py-0.5 rounded self-start" style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E" }}>TBD</span>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="w-full" style={{ background: "#0E0E0E" }}>
        <div className="mx-5 mb-6 rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(201,169,110,0.25)" }}>
          {/* Map label bar */}
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
            title="Satsang Ashram Location"
          />
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="w-full max-w-lg px-5 flex flex-col gap-3 pb-6" style={{ background: "#0E0E0E" }}>
        <a
          href={EVENT.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleMap}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: "linear-gradient(90deg, #9A7840, #C9A96E, #E8D5B0, #C9A96E, #9A7840)", backgroundSize: "200% auto", color: "#0E0E0E" }}
        >
          <Navigation className="w-4 h-4" />
          Get Directions on Google Maps
        </a>

        <button
          onClick={handleAttend}
          disabled={attended}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold text-sm border transition-all active:scale-[0.98]"
          style={
            attended
              ? { background: "rgba(34,197,94,0.08)", borderColor: "#22c55e", color: "#4ade80" }
              : { background: "transparent", borderColor: "rgba(201,169,110,0.35)", color: "#C9A96E" }
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
            "Jai Guru — I will Attend"
          )}
        </button>
      </div>

      {/* ── Coming Soon ── */}
      <div className="w-full max-w-lg px-5 pb-12" style={{ background: "#0E0E0E" }}>
        <div
          className="rounded-2xl px-6 py-6 flex flex-col items-center gap-3 border"
          style={{ background: "#141414", borderColor: "rgba(201,169,110,0.18)" }}
        >
          {/* Pulsing bar */}
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: "#C9A96E", transformOrigin: "left" }} />
            <div className="pulse-bar flex-1 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #9A7840, #E8D5B0, #9A7840)" }} />
            <div className="flex-1 h-px" style={{ background: "#C9A96E", transformOrigin: "right" }} />
          </div>

          <div className="text-center">
            <p className="font-bold text-sm" style={{ color: "#E8D5B0" }}>More Details Coming Soon</p>
            <p className="text-xs mt-1" style={{ color: "#C9A96E", opacity: 0.5 }}>
              Schedule &amp; programme details will be updated here
            </p>
          </div>

          {/* Three pulsing dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#C9A96E",
                  animation: `pulse-bar 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
