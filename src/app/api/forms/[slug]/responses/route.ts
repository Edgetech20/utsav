import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { slug } = await params;
  const form = await db.dynamicForm.findUnique({ where: { slug } });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });

  const responses = await db.dynamicFormResponse.findMany({
    where: { formId: form.id },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(responses);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { slug } = await params;
  const form = await db.dynamicForm.findUnique({ where: { slug } });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { id } = await req.json();
  await db.dynamicFormResponse.delete({ where: { id, formId: form.id } });
  return NextResponse.json({ ok: true });
}
