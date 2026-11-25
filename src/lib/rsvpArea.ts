export type AreaRow = { village: string; district: string; rsvps: number; attending: number };

// "House, Road, Locality, City, Assam 781001, India" → { area: "Locality", city: "City" }
// ponytail: comma-split heuristic on Google formatted_address; store address_components at RSVP time if it misgroups
function parseArea(name: string): { area: string; city: string } | null {
  const parts = name.split(",").map(x => x.trim())
    .filter(x => x && x !== "India" && !/\d{6}/.test(x) && /[a-z]/i.test(x));
  if (!parts.length) return null;
  return parts.length === 1 ? { area: parts[0], city: "" } : { area: parts[parts.length - 2], city: parts[parts.length - 1] };
}

type Entry = { location: string | null; address: string | null; extraData: string | null; totalAttending: number | null };

// GPS displayName first, then address column, then an address-like custom field (Places picker stores into extraData)
export function rsvpArea(e: Omit<Entry, "totalAttending">) {
  let gps = "";
  try { gps = JSON.parse(e.location ?? "null")?.displayName ?? ""; } catch {}
  let extra: string[] = [];
  try { extra = Object.values(JSON.parse(e.extraData ?? "{}")).filter((v): v is string => typeof v === "string" && v.split(",").length >= 3); } catch {}
  for (const s of [gps, e.address ?? "", ...extra]) { const a = parseArea(s); if (a) return a; }
  return null;
}

export function groupByArea(entries: Entry[]) {
  const map = new Map<string, AreaRow>();
  let none = 0;
  for (const e of entries) {
    const g = rsvpArea(e);
    if (!g) { none++; continue; }
    const key = `${g.area}|${g.city}`.toLowerCase();
    const row = map.get(key);
    if (row) { row.rsvps++; row.attending += e.totalAttending ?? 0; }
    else map.set(key, { village: g.area, district: g.city, rsvps: 1, attending: e.totalAttending ?? 0 });
  }
  return { areas: Array.from(map.values()).sort((a, b) => b.rsvps - a.rsvps), none };
}
