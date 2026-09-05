import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: "linear-gradient(135deg, #1A0F00 0%, #0E0E0E 50%, #1A1200 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Corner decorations */}
        {[
          { top: 32, left: 40 },
          { top: 32, right: 40 },
          { bottom: 32, left: 40 },
          { bottom: 32, right: 40 },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, color: "#C9A96E", fontSize: 28, opacity: 0.4 }}>✦</div>
        ))}

        {/* Top horizontal rule */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div style={{ width: 120, height: 1, background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
          <div style={{ color: "#C9A96E", fontSize: 22 }}>✦</div>
          <div style={{ width: 120, height: 1, background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
        </div>

        {/* Subtitle */}
        <div style={{ color: "#C9A96E", fontSize: 18, letterSpacing: "0.35em", opacity: 0.6, marginBottom: 20, textTransform: "uppercase" }}>
          You are cordially invited to
        </div>

        {/* Main Bengali title */}
        <div style={{ color: "#E8D5B0", fontSize: 110, letterSpacing: "0.04em", lineHeight: 1.2, marginBottom: 8 }}>
          প্ৰিয়বোধী
        </div>
        <div style={{ color: "#C9A96E", fontSize: 52, letterSpacing: "0.1em", opacity: 0.9, marginBottom: 48 }}>
          মহোৎসব
        </div>

        {/* Bottom rule */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div style={{ width: 200, height: 1, background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
          <div style={{ color: "#C9A96E", fontSize: 18, opacity: 0.5 }}>✦</div>
          <div style={{ width: 200, height: 1, background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
        </div>

        {/* Date & Venue */}
        <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ color: "#C9A96E", fontSize: 13, letterSpacing: "0.3em", opacity: 0.5, textTransform: "uppercase" }}>Date</div>
            <div style={{ color: "#E8D5B0", fontSize: 22, fontWeight: "bold" }}>Sunday, 20 December 2026</div>
          </div>
          <div style={{ width: 1, height: 40, background: "rgba(201,169,110,0.3)" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ color: "#C9A96E", fontSize: 13, letterSpacing: "0.3em", opacity: 0.5, textTransform: "uppercase" }}>Venue</div>
            <div style={{ color: "#E8D5B0", fontSize: 22, fontWeight: "bold" }}>Galsi, Purba Bardhaman</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
