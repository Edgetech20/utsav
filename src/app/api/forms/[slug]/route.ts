import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET — public: fetch form structure for rendering
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await db.dynamicForm.findUnique({
    where: { slug },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!form.enabled) return NextResponse.json({ error: "form is closed" }, { status: 410 });
  // strip internal WA config from public response
  const { waTemplate, waNameField, waPhoneField, waEnabled, ...pub } = form;
  void waTemplate; void waNameField; void waPhoneField; void waEnabled;
  return NextResponse.json(pub);
}

// PUT — admin: update form + fields
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { slug } = await params;
  const form = await db.dynamicForm.findUnique({ where: { slug } });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, enabled, fields, waEnabled, waTemplate, waNameField, waPhoneField } = body;

  // replace all fields
  if (fields !== undefined) {
    await db.dynamicFormField.deleteMany({ where: { formId: form.id } });
    if (fields.length > 0) {
      await db.dynamicFormField.createMany({
        data: fields.map((f: { label: string; type: string; placeholder?: string; options?: string[]; validation?: object; required?: boolean; order: number }) => ({
          formId: form.id,
          label: f.label.trim(),
          type: f.type,
          placeholder: f.placeholder?.trim() || null,
          options: f.options?.length ? JSON.stringify(f.options) : null,
          validation: f.validation ? JSON.stringify(f.validation) : null,
          required: f.required !== false,
          order: f.order,
        })),
      });
    }
  }

  const updated = await db.dynamicForm.update({
    where: { id: form.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(enabled !== undefined && { enabled }),
      ...(waEnabled !== undefined && { waEnabled }),
      ...(waTemplate !== undefined && { waTemplate: waTemplate?.trim() || null }),
      ...(waNameField !== undefined && { waNameField: waNameField || null }),
      ...(waPhoneField !== undefined && { waPhoneField: waPhoneField || null }),
    },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(updated);
}

// DELETE — admin: delete form + all responses
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const deny = requireAdmin(req); if (deny) return deny;
  const { slug } = await params;
  const form = await db.dynamicForm.findUnique({ where: { slug } });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.dynamicForm.delete({ where: { id: form.id } });
  // clean up the associated WaTemplate (ignore if already gone)
  await db.waTemplate.deleteMany({ where: { key: `form_${slug}` } });
  return NextResponse.json({ ok: true });
}
