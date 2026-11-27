import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";

const VOL_KEYS = ["vol_form_slug"];
const READ_KEYS = [...VOL_KEYS, "event_title", "event_title_sub"];

export async function GET(req: NextRequest) {
  const { err } = await requirePerm(req, "volunteer", "view");
  if (err) return err;
  const [rows, forms] = await Promise.all([
    db.setting.findMany({ where: { key: { in: READ_KEYS } } }),
    db.dynamicForm.findMany({ select: { slug: true, name: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return NextResponse.json({ ...Object.fromEntries(rows.map(r => [r.key, r.value])), forms });
}

export async function PUT(req: NextRequest) {
  const { err } = await requirePerm(req, "volunteer", "edit");
  if (err) return err;
  const body: Record<string, string> = await req.json();
  await Promise.all(VOL_KEYS.filter(k => k in body).map(k =>
    db.setting.upsert({ where: { key: k }, update: { value: body[k] ?? "" }, create: { key: k, value: body[k] ?? "" } })
  ));
  return NextResponse.json({ ok: true });
}
