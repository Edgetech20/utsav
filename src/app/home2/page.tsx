"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, Navigation, CheckCircle } from "lucide-react";

const EVENT = {
  title: "প্ৰিয়বোধী মহোৎসব",
  date: "20 December 2026",
  venue: "Galsi, Purba Bardhaman",
  mapsUrl:
    "https://www.google.com/maps/place/Shri+Shri+Thakur+Anukul+Chandra+Satsang+Ashram/@23.2234023,87.8617604,19z/data=!3m1!4b1!4m6!3m5!1s0x39f8482d1ff34907:0x5c321b027be8b2c8!8m2!3d23.2234011!4d87.8624041!16s%2Fg%2F1hm2s_0_m",
  organizer: "Satsang, Burdwan",
  contact: "+91 XXXXX XXXXX",
};

const TARGET_DATE = new Date("2026-12-20T00:00:00").getTime();

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    function tick() {
      const diff = TARGET_DATE - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
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
  return timeLeft;
}

export default function Home2() {
  const [attended, setAttended] = useState(false);
  const [attendCount, setAttendCount] = useState<number | null>(null);
  const timeLeft = useCountdown();

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
    <div className="min-h-screen" style={{ background: "#FFFBEB" }}>

      {/* Full-bleed hero */}
      <div
        className="w-full px-6 pt-14 pb-16 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #B45309 0%, #D97706 50%, #F59E0B 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10" style={{ background: "#fff" }} />
        <div className="absolute -bottom-12 -right-8 w-52 h-52 rounded-full opacity-10" style={{ background: "#fff" }} />

        <p className="text-white/70 text-xs uppercase tracking-[0.35em] mb-4">
          You are cordially invited to
        </p>
        <h1 className="text-white text-4xl font-black leading-tight drop-shadow-md">
          {EVENT.title}
        </h1>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="h-px flex-1 max-w-[60px] bg-white/40" />
          <span className="text-white/90 text-sm font-medium">Purba Bardhaman Sadar North Subdivision</span>
          <div className="h-px flex-1 max-w-[60px] bg-white/40" />
        </div>
      </div>

      {/* Wave separator */}
      <div className="w-full overflow-hidden -mt-px" style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 400 28" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ fill: "#FFFBEB" }}>
          <path d="M0,28 C80,0 160,20 240,10 C320,0 360,20 400,10 L400,28 Z" />
        </svg>
      </div>

      {/* Countdown */}
      <div className="max-w-lg mx-auto px-4 -mt-2">
        <p className="text-center text-xs uppercase tracking-[0.25em] mb-3" style={{ color: "#B45309" }}>
          Event Countdown
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Mins" },
            { value: timeLeft.seconds, label: "Secs" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <div
                className="w-full aspect-square rounded-2xl flex items-center justify-center shadow-md"
                style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}
              >
                <span className="text-white text-2xl font-black tabular-nums">
                  {String(value).padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs mt-1.5 uppercase tracking-wide font-medium" style={{ color: "#92400E" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="max-w-lg mx-auto px-4 mt-7 space-y-3">
        <DetailPill icon={<Calendar className="w-4 h-4" />} label="Date" value={EVENT.date} />
        <DetailPill icon={<MapPin className="w-4 h-4" />} label="Place" value={EVENT.venue} />
      </div>

      {/* Map */}
      <div className="max-w-lg mx-auto px-4 mt-5">
        <div className="rounded-2xl overflow-hidden shadow-md border-2" style={{ borderColor: "#F59E0B" }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d308!2d87.8617604!3d23.2234023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f8482d1ff34907%3A0x5c321b027be8b2c8!2sShri%20Shri%20Thakur%20Anukul%20Chandra%20Satsang%20Ashram!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            width="100%"
            height="200"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Satsang Ashram Location"
          />
        </div>
      </div>

      {/* CTAs */}
      <div className="max-w-lg mx-auto px-4 mt-5 flex flex-col gap-3">
        <a
          href={EVENT.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleMap}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-bold text-sm text-white hover:opacity-90 transition-all shadow-md"
          style={{ background: "linear-gradient(90deg, #B45309, #D97706)" }}
        >
          <Navigation className="w-4 h-4" />
          Get Directions on Google Maps
        </a>
        <button
          onClick={handleAttend}
          disabled={attended}
          className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-semibold text-sm border-2 transition-all ${attended ? "cursor-default" : "hover:opacity-90"}`}
          style={
            attended
              ? { background: "#f0fdf4", borderColor: "#22c55e", color: "#15803d" }
              : { background: "transparent", borderColor: "#D97706", color: "#B45309" }
          }
        >
          {attended ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Jai Guru! Marked as Attending
              {attendCount !== null && (
                <span className="ml-1 text-xs text-green-600">({attendCount} attending)</span>
              )}
            </>
          ) : (
            "Jai Guru — I will Attend"
          )}
        </button>
      </div>

      {/* More Details Coming Soon */}
      <div className="max-w-lg mx-auto px-4 mt-6 pb-10">
        <div className="rounded-2xl p-6 text-center border-2 border-dashed" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* Animated dots */}
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#D97706", animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#D97706", animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#D97706", animationDelay: "300ms" }} />
          </div>
          <p className="font-bold text-base" style={{ color: "#B45309" }}>More Details Coming Soon</p>
          <p className="text-xs mt-1" style={{ color: "#92400E", opacity: 0.55 }}>Stay tuned for schedule & programme details</p>
        </div>
      </div>
    </div>
  );
}

function DetailPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-2xl shadow-sm border" style={{ background: "#FFFFFF", borderColor: "#FDE68A" }}>
      <div className="p-2 rounded-xl flex-shrink-0" style={{ background: "#FEF3C7", color: "#D97706" }}>
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider" style={{ color: "#D97706", opacity: 0.7 }}>{label}</p>
        <p className="font-semibold text-sm" style={{ color: "#78350F" }}>{value}</p>
      </div>
    </div>
  );
}
