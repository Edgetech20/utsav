import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";
import { Prisma } from "@prisma/client";
import { isScopedCaller } from "@/lib/permissions";
import { assignNew } from "@/lib/rsvpAssign";
import type { SessionUser } from "@/lib/auth";

/** Scoped callers may only touch RSVPs assigned to them. Returns a 403/404 response or null. */
async function denyIfNotOwner(user: SessionUser, id: number) {
  if (!isScopedCaller(user)) return null;
  const row = await db.rsvp.findUnique({ where: { id }, select: { assignedTo: true } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.assignedTo !== user.email) return NextResponse.json({ error: "This RSVP is not assigned to you" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "rsvp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entries = await db.rsvp.findMany({
    where: isScopedCaller(user) ? { assignedTo: user.email } : undefined,
    include: { assignee: { select: { email: true, name: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ entries, scoped: isScopedCaller(user) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, whatsapp, village, postOffice, district, pinCode, totalAttending, location } = body;

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
  let created: { id: number };
  try {
    created = await db.rsvp.create({
      data: {
        name: name.trim(), whatsapp: whatsapp.trim(), address: "",
        village: village?.trim() || null, postOffice: postOffice?.trim() || null,
        district: district?.trim() || null, pinCode: pinCode?.trim() || null,
        totalAttending: attending,
        extraData: Object.keys(extra).length ? JSON.stringify(extra) : null,
        location: location ?? null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return NextResponse.json({ error: "This WhatsApp number is already registered." }, { status: 409 });
    throw e;
  }
  // Hand the new RSVP to the least-loaded caller; never fail the guest's submission over it
  await assignNew(created.id).catch(err => console.error("[rsvp] auto-assign failed:", err));
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "rsvp", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, noteAppend, noteEdit } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const denied = await denyIfNotOwner(user, id);
  if (denied) return denied;

  type Note = { text: string; type: string; author: string; authorName: string | null; createdAt: string; editedAt?: string };
  const readNotes = async (): Promise<Note[]> => {
    const existing = await db.rsvp.findUnique({ where: { id }, select: { notes: true } });
    try { return JSON.parse(existing?.notes ?? "[]"); } catch { return []; }
  };

  // Note append — server injects author + timestamp
  if (noteAppend) {
    const [arr, adminUser] = await Promise.all([
      readNotes(),
      db.adminUser.findUnique({ where: { email: user.email }, select: { name: true } }),
    ]);
    arr.push({ text: noteAppend.text || "", type: noteAppend.type || "note", author: user.email, authorName: adminUser?.name ?? null, createdAt: new Date().toISOString() });
    await db.rsvp.update({ where: { id }, data: { notes: JSON.stringify(arr) } });
    await logChange(user.email, "create", `rsvp-note:${id}`, { type: noteAppend.type || "note" }, getIp(req));
    return NextResponse.json({ ok: true });
  }

  // Note edit — text only, own notes (super: any). Notes are never removed.
  if (noteEdit) {
    const text = typeof noteEdit.text === "string" ? noteEdit.text.trim() : "";
    if (!text) return NextResponse.json({ error: "Note can't be empty" }, { status: 400 });
    const arr = await readNotes();
    const note = arr[noteEdit.index];
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    if (note.author !== user.email && user.role !== "super")
      return NextResponse.json({ error: "You can only edit your own notes" }, { status: 403 });
    const before = note.text;
    note.text = text;
    note.editedAt = new Date().toISOString();
    await db.rsvp.update({ where: { id }, data: { notes: JSON.stringify(arr) } });
    await logChange(user.email, "update", `rsvp-note:${id}`, { index: noteEdit.index, before, after: text }, getIp(req));
    return NextResponse.json({ ok: true });
  }

  // Regular field update — only touch fields that were actually sent.
  // Notes are deliberately not accepted here: they change only via noteAppend / noteEdit.
  const { name, whatsapp, village, postOffice, district, pinCode, totalAttending, extraData } = body;
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
  if (!can(user, "rsvp", "delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  const denied = await denyIfNotOwner(user, id);
  if (denied) return denied;
  await db.rsvp.delete({ where: { id } });
  await logChange(user.email, "delete", `rsvp:${id}`, undefined, getIp(req));
  return NextResponse.json({ ok: true });
}
