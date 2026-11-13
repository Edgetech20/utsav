import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "rsvp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entries = await db.rsvp.findMany({ orderBy: { submittedAt: "desc" } });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, whatsapp, village, postOffice, district, pinCode, totalAttending } = body;

  // Collect custom field values (keys starting with "custom_")
  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k.startsWith("custom_") && typeof v === "string") extra[k] = v;
  }

  // Validate required fixed fields (config-driven required check handled client-side;
  // server enforces only the structural minimum)
  if (!name?.trim() || !whatsapp?.trim())
    return NextResponse.json({ error: "Name and WhatsApp are required" }, { status: 400 });

  const attending = totalAttending ? parseInt(totalAttending, 10) : null;
  try {
    await db.rsvp.create({
      data: {
        name: name.trim(), whatsapp: whatsapp.trim(), address: "",
        village: village?.trim() || null, postOffice: postOffice?.trim() || null,
        district: district?.trim() || null, pinCode: pinCode?.trim() || null,
        totalAttending: attending,
        extraData: Object.keys(extra).length ? JSON.stringify(extra) : null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return NextResponse.json({ error: "This WhatsApp number is already registered." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "rsvp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, noteAppend } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Note append — server injects author + timestamp
  if (noteAppend) {
    const [existing, adminUser] = await Promise.all([
      db.rsvp.findUnique({ where: { id }, select: { notes: true } }),
      db.adminUser.findUnique({ where: { email: user.email }, select: { name: true } }),
    ]);
    let arr: { text: string; type: string; author: string; authorName: string | null; createdAt: string }[] = [];
    try { arr = JSON.parse(existing?.notes ?? "[]"); } catch {}
    arr.push({ text: noteAppend.text || "", type: noteAppend.type || "note", author: user.email, authorName: adminUser?.name ?? null, createdAt: new Date().toISOString() });
    await db.rsvp.update({ where: { id }, data: { notes: JSON.stringify(arr) } });
    return NextResponse.json({ ok: true });
  }

  // Regular field update — only touch fields that were actually sent
  const { name, whatsapp, village, postOffice, district, pinCode, totalAttending, extraData, notes } = body;
  try {
    await db.rsvp.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp.trim() }),
        ...(village !== undefined && { village: village?.trim() || null }),
        ...(postOffice !== undefined && { postOffice: postOffice?.trim() || null }),
        ...(district !== undefined && { district: district?.trim() || null }),
        ...(pinCode !== undefined && { pinCode: pinCode?.trim() || null }),
        ...(totalAttending !== undefined && { totalAttending: totalAttending ? parseInt(totalAttending, 10) : null }),
        ...(extraData !== undefined && { extraData: extraData ?? null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return NextResponse.json({ error: "WhatsApp number already registered to another entry." }, { status: 409 });
    throw e;
  }
  await logChange(user.email, "update", `rsvp:${id}`, undefined, getIp(req));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "rsvp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await db.rsvp.delete({ where: { id } });
  await logChange(user.email, "delete", `rsvp:${id}`, undefined, getIp(req));
  return NextResponse.json({ ok: true });
}
