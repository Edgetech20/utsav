import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const size = Number(req.nextUrl.searchParams.get("size") ?? 192);
  return new ImageResponse(
    (
      <div
        style={{
          width: size, height: size,
          background: "#0E0E0E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size * 0.18,
        }}
      >
        <div
          style={{
            color: "#C9A96E",
            fontSize: size * 0.5,
            fontFamily: "serif",
            lineHeight: 1,
          }}
        >
          ✦
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
