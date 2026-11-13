import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "whatsapp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const group = new URL(req.url).searchParams.get("group") ?? "rsvp";
  const recipients = await getRecipients(group);
  return NextResponse.json({ count: recipients.length, recipients });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "whatsapp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { group, message, recipients: explicit } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });

  const recipients: { name: string; mobile: string }[] =
    Array.isArray(explicit) && explicit.length > 0
      ? explicit
      : await getRecipients(group ?? "rsvp");

  if (!recipients.length) return NextResponse.json({ queued: 0 });

  await db.waQueue.createMany({
    data: recipients.map(r => ({
      whatsapp: r.mobile,
      recipientName: r.name,
      message: message.trim().replace(/\{name\}/g, r.name.trim().split(" ")[0]),
    })),
    skipDuplicates: false,
  });

  await logChange(user.email, "broadcast", "whatsapp", { queued: recipients.length, group: group ?? "rsvp" }, getIp(req));
  return NextResponse.json({ queued: recipients.length });
}

async function getRecipients(group: string): Promise<{ name: string; mobile: string }[]> {
  switch (group) {
    case "rsvp":
    default:
      return (await db.rsvp.findMany({ select: { name: true, whatsapp: true } }))
        .map(r => ({ name: r.name, mobile: r.whatsapp }));
  }
}
