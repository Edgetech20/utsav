import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, canForm } from "@/lib/auth";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!canForm(user, slug, "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await db.dynamicForm.findUnique({ where: { slug } });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });

  const responses = await db.dynamicFormResponse.findMany({
    where: { formId: form.id },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(responses);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!canForm(user, slug, "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await db.dynamicForm.findUnique({ where: { slug } });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { id } = await req.json();
  await db.dynamicFormResponse.delete({ where: { id, formId: form.id } });
  return NextResponse.json({ ok: true });
}
