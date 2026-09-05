import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const size = Number(req.nextUrl.searchParams.get("size") ?? 192);
  const r = size * 0.38;   // ring radius
  const cx = size / 2;
  const s = size;

  return new ImageResponse(
    (
      <div
        style={{
          width: s, height: s,
          background: "linear-gradient(145deg, #1A1200 0%, #0E0E0E 60%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderRadius: s * 0.22,
        }}
      >
        {/* Outer gold ring */}
        <div
          style={{
            position: "absolute",
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            border: `${s * 0.025}px solid #C9A96E`,
            opacity: 0.6,
          }}
        />

        {/* Inner thin ring */}
        <div
          style={{
            position: "absolute",
            width: r * 1.6,
            height: r * 1.6,
            borderRadius: "50%",
            border: `${s * 0.012}px solid #9A7840`,
            opacity: 0.4,
          }}
        />

        {/* Center letter প */}
        <div
          style={{
            color: "#E8D5B0",
            fontSize: s * 0.44,
            fontFamily: "serif",
            lineHeight: 1,
            marginTop: s * 0.04,
            textShadow: `0 0 ${s * 0.08}px rgba(201,169,110,0.8)`,
          }}
        >
          প
        </div>

        {/* Corner stars */}
        {[
          { top: s * 0.12, left: s * 0.12 },
          { top: s * 0.12, right: s * 0.12 },
          { bottom: s * 0.12, left: s * 0.12 },
          { bottom: s * 0.12, right: s * 0.12 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              color: "#C9A96E",
              fontSize: s * 0.08,
              opacity: 0.45,
              lineHeight: 1,
            }}
          >
            ✦
          </div>
        ))}
      </div>
    ),
    { width: s, height: s }
  );
}
