import { NextRequest, NextResponse } from "next/server";

const KEY = process.env.GOOGLE_MAPS_KEY;

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const q  = req.nextUrl.searchParams.get("q");
  const id = req.nextUrl.searchParams.get("id");

  // Autocomplete suggestions
  if (q) {
    const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY },
      body: JSON.stringify({ input: q, includedRegionCodes: ["in"], languageCode: "en" }),
    });
    const data = await r.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestions = (data.suggestions ?? []).map((s: any) => ({
      placeId: s.placePrediction?.placeId ?? "",
      text: s.placePrediction?.text?.text ?? "",
    })).filter((s: { placeId: string }) => s.placeId);
    return NextResponse.json({ suggestions });
  }

  // Place detail (lat/lng + formatted address)
  if (id) {
    const r = await fetch(
      `https://places.googleapis.com/v1/places/${id}`,
      { headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "id,displayName,formattedAddress,location" } }
    );
    const d = await r.json();
    return NextResponse.json({
      address: d.formattedAddress ?? d.displayName?.text ?? "",
      lat: d.location?.latitude ?? null,
      lng: d.location?.longitude ?? null,
    });
  }

  return NextResponse.json({ error: "Missing q or id" }, { status: 400 });
}
