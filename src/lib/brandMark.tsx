import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Site mark: gold "প" (Galada, same face as the invitation titles) on the navy admin gradient.
// Font is bundled so the glyph renders identically everywhere, not with whatever Bengali font a device has.
let font: Promise<Buffer> | null = null;
const galada = () => (font ??= readFile(join(process.cwd(), "src/assets/fonts/Galada-Regular.ttf")));

export async function brandMark(px: number, rounded = true) {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        borderRadius: rounded ? Math.round(px * 0.22) : 0,
        color: "#C9A96E", fontFamily: "Galada", fontSize: Math.round(px * 0.7),
        lineHeight: 1,
      }}>
        {/* Galada draws the glyph high in its box; shift it to the optical centre */}
        <div style={{ display: "flex", marginTop: Math.round(px * 0.2) }}>প</div>
      </div>
    ),
    { width: px, height: px, fonts: [{ name: "Galada", data: await galada(), style: "normal", weight: 400 }] },
  );
}
