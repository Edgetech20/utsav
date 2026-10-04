"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, Navigation, CheckCircle } from "lucide-react";

const EVENT = {
  title: "প্ৰিয়বোধী মহোৎসব",
  subtitle: "Shri Shri Thakur Anukul Chandra",
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
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
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

export default function Home1() {
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
    <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4" style={{ background: "#F5F7F8" }}>

      {/* Top navy bar */}
      <div className="w-full max-w-lg h-1 rounded-t-xl" style={{ background: "#091540" }} />

      {/* Card */}
      <div
        className="w-full max-w-lg shadow-xl rounded-b-xl overflow-hidden border border-[#091540]/10"
        style={{ background: "#FFFFFF" }}
      >

        {/* Hero */}
        <div className="px-6 pt-10 pb-8 text-center" style={{ background: "#F5F7F8" }}>

          <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "#091540", opacity: 0.45 }}>
            You are cordially invited to
          </p>

          <h1 className="text-3xl font-bold leading-snug" style={{ color: "#091540" }}>
            {EVENT.title}
          </h1>

          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <p className="mt-4 text-base font-semibold" style={{ color: "#091540" }}>
            Purba Bardhaman Sadar North Subdivision
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="px-6 py-5" style={{ background: "#091540" }}>
          <p className="text-xs uppercase tracking-[0.25em] text-center mb-3" style={{ color: "#F5F7F8", opacity: 0.5 }}>
            Event Countdown
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Mins" },
              { value: timeLeft.seconds, label: "Secs" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-3 rounded-xl border"
                style={{ background: "#F5F7F8", borderColor: "#D4AF37" }}
              >
                <span className="text-2xl font-black tabular-nums leading-none" style={{ color: "#091540" }}>
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-xs mt-1 uppercase tracking-wide" style={{ color: "#091540", opacity: 0.45 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pt-5 pb-4 space-y-4" style={{ background: "#FFFFFF" }}>
          <Detail icon={<Calendar className="w-4 h-4" />} label="Date" value={EVENT.date} />
          <Detail icon={<MapPin className="w-4 h-4" />} label="Place" value={EVENT.venue} />
        </div>

        {/* Map */}
        <div className="mx-6 mb-4 rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: "#091540", opacity: 1 }}>
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

        <div className="mx-6 h-px" style={{ background: "#091540", opacity: 0.08 }} />

        {/* CTAs */}
        <div className="px-6 py-6 flex flex-col gap-3" style={{ background: "#FFFFFF" }}>
          <a
            href={EVENT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleMap}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-all"
            style={{ background: "#091540", color: "#F5F7F8" }}
          >
            <Navigation className="w-4 h-4" />
            Get Directions on Google Maps
          </a>
          <button
            onClick={handleAttend}
            disabled={attended}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm border-2 transition-all ${
              attended ? "cursor-default" : "hover:opacity-90"
            }`}
            style={
              attended
                ? { background: "#f0fdf4", borderColor: "#22c55e", color: "#15803d" }
                : { background: "#F5F7F8", borderColor: "#091540", color: "#091540" }
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

        {/* Quote */}
        <div
          className="mx-6 mb-6 p-4 rounded-lg border-l-4 text-center"
          style={{ background: "#F5F7F8", borderLeftColor: "#D4AF37" }}
        >
          <p className="text-sm italic leading-relaxed" style={{ color: "#091540", opacity: 0.6 }}>
            &ldquo;সৎসঙ্গ সত্যের পথ — Satsang is the path of truth&rdquo;
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center border-t" style={{ background: "#F5F7F8", borderTopColor: "#091540", borderTopWidth: 1, borderTopStyle: "solid", opacity: 1 }}>
          <p className="font-semibold text-sm" style={{ color: "#091540" }}>{EVENT.organizer}</p>
          <p className="text-xs mt-1" style={{ color: "#091540", opacity: 0.4 }}>{EVENT.contact}</p>
        </div>
      </div>

      <div className="w-full max-w-lg h-1 rounded-b" style={{ background: "#091540" }} />
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1.5 rounded-full" style={{ background: "rgba(9,21,64,0.08)", color: "#091540" }}>
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider" style={{ color: "#091540", opacity: 0.4 }}>{label}</p>
        <p className="font-medium text-sm leading-snug" style={{ color: "#091540" }}>{value}</p>
      </div>
    </div>
  );
}
