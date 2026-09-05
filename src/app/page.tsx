"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, Navigation, CheckCircle, ChevronDown, Stethoscope, UtensilsCrossed, Footprints, BookOpen, Camera, BedDouble, ShoppingBag, Music, Mic, Palette, Theater, Sparkles } from "lucide-react";

const EVENT = {
  title: "প্ৰিয়বোধী মহোৎসব",
  date: "Sunday, 20 December 2026",
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

export default function Home() {
  const [attended, setAttended] = useState(false);
  const [attendCount, setAttendCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
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
          <span style={{ fontSize: "clamp(1.1rem, 4.5vw, 1.5rem)", whiteSpace: "nowrap" }}>শ্রীশ্রীঠাকুর অনুকূলচন্দ্রের</span>
          {" "}
          <span style={{ fontSize: "clamp(0.85rem, 3.5vw, 1.1rem)", whiteSpace: "nowrap" }}>শুভ ১৩৯তম জন্ম মহোৎসব তৎসহ</span>
        </p>

        <div className="flex flex-col items-center gap-0 mb-2 mt-1 py-1">
          <h1 className="shimmer-text font-black" style={{ fontSize: "clamp(3rem, 13vw, 5rem)", letterSpacing: "0.03em", lineHeight: 1.6 }}>
            প্ৰিয়বোধী
          </h1>
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
          <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 px-1.5 py-0.5 rounded self-start" style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E" }}>TBD</span>
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
          onClick={handleAttend}
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
            "Jai Guru — I will Attend"
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
            { label: "Medical Camp",     img: [], Icon: Stethoscope },
            { label: "Cheap Canteen",    img: [], Icon: UtensilsCrossed },
            { label: "Jajan Parikrama",  img: [], Icon: Footprints },
            { label: "Diksha Grahan",    img: [], Icon: BookOpen },
            { label: "Photo Gallery",    img: [], Icon: Camera },
            { label: "Accommodation",    img: [], Icon: BedDouble },
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
                style={{ borderBottom: i < 11 ? "1px solid rgba(201,169,110,0.06)" : "none" }}
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

                {/* Expandable image panel */}
                <div
                  style={{
                    maxHeight: open ? "280px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.45s cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  <div className="mx-6 mb-4">
                    {(Array.isArray(img) ? img : [img]).filter(Boolean).length > 0 ? (
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
            { label: "Organiser",  value: "Xxxx Xxxxxx" },
            { label: "Phone",      value: "+91 XXXXX XXXXX" },
            { label: "WhatsApp",   value: "+91 XXXXX XXXXX" },
            { label: "Email",      value: "xxxx@xxxx.com" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(201,169,110,0.12)" }}>
              <span className="text-xs uppercase tracking-widest" style={{ color: "#C9A96E", opacity: 0.55 }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: "#E8D5B0" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

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

    </div>
  );
}
