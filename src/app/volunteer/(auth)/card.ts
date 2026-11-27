// Printable volunteer ID cards: portrait CR80 (54 × 86 mm), 9 per A4 sheet.
export type CardVol = { code: string; name: string; department: { name: string; cardBg?: string | null; cardText?: string | null } };
export type CardOpts = { title?: string; titleSub?: string }; // event title for the default design

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const PER_PAGE = 9;

// Absolute URL: the print window / iframe has no base URL of its own
const abs = (u: string) => new URL(u, window.location.origin).href;

function cardHTML(v: CardVol, o: CardOpts) {
  const bg   = v.department.cardBg;   // department's uploaded design; none → built-in default design
  const text = v.department.cardText || "#0F172A";
  // Real <img>, not a CSS background: prints even with "Background graphics" off, and window.onload waits for it
  const img  = bg ? `<img class="bg" src="${esc(abs(bg))}" alt="">` : "";
  const band = bg ? "" : `<div class="band"><div class="t">${esc([o.title, o.titleSub].filter(Boolean).join(" "))}</div><div class="v">VOLUNTEER</div></div>`;
  return `<div class="card" style="color:${esc(text)}">${img}${band}<div class="info">
    <div class="name">${esc(v.name)}</div>
    <div class="dept">${esc(v.department.name)}</div>
    <div class="code">${esc(v.code)}</div>
  </div></div>`;
}

/** Full HTML document. `autoPrint` opens the print dialog once the background image has loaded. */
export function buildCardsHTML(vols: CardVol[], o: CardOpts, autoPrint = true) {
  const pages: string[] = [];
  for (let i = 0; i < vols.length; i += PER_PAGE)
    pages.push(`<div class="sheet">${vols.slice(i, i + PER_PAGE).map(v => cardHTML(v, o)).join("")}</div>`);

  return `<!doctype html><html><head><meta charset="utf-8"><title>Volunteer ID Cards</title><style>
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: system-ui, "Noto Sans Bengali", "Nirmala UI", sans-serif; }
  .sheet { display: grid; grid-template-columns: repeat(3, 54mm); gap: 4mm; justify-content: center; break-after: page; padding-top: 2mm; }
  .sheet:last-child { break-after: auto; }
  .card { width: 54mm; height: 86mm; position: relative; overflow: hidden; outline: 0.2mm dashed #bbb;
          background: #fff; }
  .card .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .band { height: 30mm; background: linear-gradient(135deg, #1a1a2e, #16213e); color: #C9A96E; text-align: center; padding: 7mm 3mm 0; }
  .band .t { font-size: 10pt; font-weight: 700; line-height: 1.2; }
  .band .v { font-size: 8pt; letter-spacing: 2.5px; margin-top: 3mm; color: #fff; }
  .info { position: absolute; left: 2mm; right: 2mm; bottom: 8mm; text-align: center; }
  .name { font-size: 12pt; font-weight: 800; line-height: 1.15; }
  .dept { font-size: 8.5pt; margin-top: 1.2mm; opacity: 0.85; }
  .code { font-size: 14pt; font-weight: 800; letter-spacing: 1px; margin-top: 2.5mm; }
  ${autoPrint ? "" : ".sheet { display: block; padding: 4px; } /* preview: one card, no 3-column A4 grid */"}
  </style></head><body>${pages.join("")}${autoPrint ? "<script>window.onload = () => window.print();</script>" : ""}</body></html>`;
}

export function printCards(vols: CardVol[], o: CardOpts) {
  const w = window.open("", "_blank");
  if (!w) return false; // popup blocked
  w.document.write(buildCardsHTML(vols, o));
  w.document.close();
  return true;
}
