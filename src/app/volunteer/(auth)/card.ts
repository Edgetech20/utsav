// Printable volunteer ID cards: portrait CR80 (54 × 86 mm), 9 per A4 sheet.
export type CardVol = { code: string; name: string; mobile?: string; department: { name: string; cardBg?: string | null; cardText?: string | null; cardLayout?: string | null } };
export type CardOpts = { title?: string; titleSub?: string; size?: string }; // event title for the default design; size = CARD_SIZES key

// Print sizes (setting vol_card_size). Each grid fits A4 inside 8 mm margins (194 × 281 mm).
// rot = how many of perPage go sideways in a last row, filling space the upright grid leaves empty
export const CARD_SIZES: Record<string, { w: number; h: number; cols: number; perPage: number; rot?: number; label: string }> = {
  "54x86":  { w: 54, h: 86,  cols: 3, perPage: 9, label: "54 × 86 mm — standard card, 9 per A4" },
  "60x90":  { w: 60, h: 90,  cols: 3, perPage: 9, label: "60 × 90 mm — bigger, exact 2:3 design ratio, 9 per A4" },
  "62x93":  { w: 62, h: 93,  cols: 3, perPage: 8, rot: 2, label: "62 × 93 mm — 8 per A4 (6 upright + 2 sideways at the bottom)" },
  "88x132": { w: 88, h: 132, cols: 2, perPage: 4, label: "88 × 132 mm — large, fills the page, 4 per A4" },
};

// Field centres on an uploaded design, in % of card width / height. Dragged in the department preview.
export type FieldKey = "name" | "dept" | "mobile" | "code";
export type Layout = Record<FieldKey, { x: number; y: number }>;
export const DEFAULT_LAYOUT: Layout = {   // fits the 800 × 1200 "Name / Dept. / Ph No." template
  name:   { x: 73, y: 56.6 },
  dept:   { x: 73, y: 64.6 },
  mobile: { x: 73, y: 72.9 },
  code:   { x: 50, y: 78.6 },
};
export function parseLayout(s?: string | null): Layout {
  try { return { ...DEFAULT_LAYOUT, ...(s ? JSON.parse(s) : {}) }; } catch { return DEFAULT_LAYOUT; }
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// Absolute URL: the print window / iframe has no base URL of its own
const abs = (u: string) => new URL(u, window.location.origin).href;

function cardHTML(v: CardVol, o: CardOpts) {
  const bg   = v.department.cardBg;   // department's uploaded design; none → built-in default design
  const text = v.department.cardText || "#0F172A";
  if (bg) {
    const L = parseLayout(v.department.cardLayout);
    const vals: Record<FieldKey, string> = { name: v.name, dept: v.department.name, mobile: v.mobile ?? "", code: v.code };
    const fields = (Object.keys(vals) as FieldKey[]).map(k =>
      `<div class="f f-${k}" data-k="${k}" style="left:${L[k].x}%;top:${L[k].y}%">${esc(vals[k])}</div>`).join("");
    // Real <img>, not a CSS background: prints even with "Background graphics" off, and window.onload waits for it
    return `<div class="card" style="color:${esc(text)}"><img class="bg" src="${esc(abs(bg))}" alt="">${fields}</div>`;
  }
  return `<div class="card" style="color:${esc(text)}">
    <div class="band"><div class="t">${esc([o.title, o.titleSub].filter(Boolean).join(" "))}</div><div class="v">VOLUNTEER</div></div>
    <div class="info">
      <div class="name">${esc(v.name)}</div>
      <div class="dept">${esc(v.department.name)}</div>
      <div class="code">${esc(v.code)}</div>
    </div></div>`;
}

/** Full HTML document. `autoPrint` opens the print dialog once the background image has loaded; false = draggable preview. */
export function buildCardsHTML(vols: CardVol[], o: CardOpts, autoPrint = true) {
  const z = CARD_SIZES[o.size ?? ""] ?? CARD_SIZES["54x86"];
  const pages: string[] = [];
  const upright = z.perPage - (z.rot ?? 0);
  for (let i = 0; i < vols.length; i += z.perPage) {
    const chunk = vols.slice(i, i + z.perPage);
    const side  = chunk.slice(upright).map(v => `<div class="rot">${cardHTML(v, o)}</div>`).join("");
    pages.push(`<div class="sheet">${chunk.slice(0, upright).map(v => cardHTML(v, o)).join("")}${side && `<div class="rotrow">${side}</div>`}</div>`);
  }

  return `<!doctype html><html><head><meta charset="utf-8"><title>Volunteer ID Cards</title><style>
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* --k scales all text with the card size (1 = 54 mm wide) */
  :root { --k: ${(z.w / 54).toFixed(3)}; }
  body { margin: 0; font-family: system-ui, "Noto Sans Bengali", "Nirmala UI", sans-serif; }
  .sheet { display: grid; grid-template-columns: repeat(${z.cols}, ${z.w}mm); gap: 3mm; justify-content: center; break-after: page; } /* 3 × 90 mm + gaps must stay under 281 mm printable */
  .sheet:last-child { break-after: auto; }
  .rotrow { grid-column: 1 / -1; display: flex; gap: 3mm; justify-content: center; }
  /* sideways slot: card rotated -90° about its top-left corner, then shifted down by its width */
  /* contain: without it print pagination sees the unrotated 93 mm height and spills onto an extra page */
  .rot { width: ${z.h}mm; height: ${z.w}mm; position: relative; overflow: hidden; contain: strict; }
  .rot .card { position: absolute; left: 0; top: 0; transform-origin: 0 0; transform: translateY(${z.w}mm) rotate(-90deg); }
  .card { width: ${z.w}mm; height: ${z.h}mm; font-size: calc(1pt * var(--k)); position: relative; overflow: hidden; outline: 0.2mm dashed #bbb; background: #fff; }
  /* fill, not cover: the design differs slightly from the card ratio, and cover would crop its sides */
  .card .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }
  .f { position: absolute; width: 44%; transform: translate(-50%, -50%); font-size: 9em; font-weight: 700; line-height: 1.1;
       text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .f-code { width: 70%; font-size: 7.5em; font-weight: 800; letter-spacing: 1px; }
  .band { height: calc(30mm * var(--k)); background: linear-gradient(135deg, #1a1a2e, #16213e); color: #C9A96E; text-align: center; padding: calc(7mm * var(--k)) calc(3mm * var(--k)) 0; }
  .band .t { font-size: 10em; font-weight: 700; line-height: 1.2; }
  .band .v { font-size: 8em; letter-spacing: 2.5px; margin-top: calc(3mm * var(--k)); color: #fff; }
  .info { position: absolute; left: calc(2mm * var(--k)); right: calc(2mm * var(--k)); bottom: calc(8mm * var(--k)); text-align: center; }
  .name { font-size: 12em; font-weight: 800; line-height: 1.15; }
  .dept { font-size: 8.5em; margin-top: calc(1.2mm * var(--k)); opacity: 0.85; }
  .code { font-size: 14em; font-weight: 800; letter-spacing: 1px; margin-top: calc(2.5mm * var(--k)); }
  ${autoPrint ? "" : `.sheet { display: block; padding: 4px; } /* preview: one card, no 3-column A4 grid */
  .f { cursor: move; outline: 1px dashed rgba(0,0,0,.4); user-select: none; touch-action: none; }`}
  </style></head><body>${pages.join("")}
  <script>for (const el of document.querySelectorAll(".f:not(.f-code)")) { let s = 9; while (el.scrollWidth > el.clientWidth && s > 5) el.style.fontSize = (s -= 0.5) + "em"; }</script>
  ${autoPrint ? "<script>window.onload = () => window.print();</script>" : ""}</body></html>`;
}

/** Opens the window right away (inside the click, so it isn't popup-blocked), then reads the current settings. */
export function printCards(vols: CardVol[]) {
  const w = window.open("", "_blank");
  if (!w) return false; // popup blocked
  w.document.write("Preparing cards…");
  fetch("/api/volunteer/settings").then(r => r.json()).then(s => {
    w.document.open();
    w.document.write(buildCardsHTML(vols, { title: s.event_title, titleSub: s.event_title_sub, size: s.vol_card_size }));
    w.document.close();
  }).catch(() => { w.document.body.textContent = "Could not load settings — close this tab and try again."; });
  return true;
}
