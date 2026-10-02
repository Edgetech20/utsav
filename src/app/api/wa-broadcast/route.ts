import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Returns recipient list for a given group so the UI can preview counts
export async function GET(req: NextRequest) {
  const group = new URL(req.url).searchParams.get("group") ?? "rsvp";
  const recipients = await getRecipients(group);
  return NextResponse.json({ count: recipients.length, recipients });
}

// Adds entries to WaQueue
export async function POST(req: NextRequest) {
  const { group, message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });

  const recipients = await getRecipients(group ?? "rsvp");
  if (!recipients.length) return NextResponse.json({ queued: 0 });

  await db.waQueue.createMany({
    data: recipients.map(r => ({
      whatsapp: r.mobile,
      recipientName: r.name,
      message: message.trim().replace(/\{name\}/g, r.name.trim().split(" ")[0]),
    })),
    skipDuplicates: false,
  });

  return NextResponse.json({ queued: recipients.length });
}

async function getRecipients(group: string): Promise<{ name: string; mobile: string }[]> {
  switch (group) {
    case "accommodation":
      return (await db.accommodationRegistration.findMany({ select: { primaryName: true, mobile: true } }))
        .map(r => ({ name: r.primaryName, mobile: r.mobile }));
    case "vehicle":
      return (await db.vehicleRegistration.findMany({ select: { contactName: true, mobile: true } }))
        .map(r => ({ name: r.contactName, mobile: r.mobile }));
    case "rsvp":
    default:
      return (await db.rsvp.findMany({ select: { name: true, whatsapp: true } }))
        .map(r => ({ name: r.name, mobile: r.whatsapp }));
  }
}
