import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, canForm, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

type Ctx = { params: Promise<{ slug: string }> };

// GET — public: fetch form structure for rendering
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const form = await db.dynamicForm.findUnique({
    where: { slug },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!form.enabled) return NextResponse.json({ error: "form is closed" }, { status: 410 });
  const { waTemplate, waNameField, waPhoneField, waEnabled, ...pub } = form;
  void waTemplate; void waNameField; void waPhoneField; void waEnabled;
  return NextResponse.json(pub);
}

// PUT — admin: update form + fields
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!canForm(user, slug, "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await db.dynamicForm.findUnique({ where: { slug } });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, enabled, fields, waEnabled, waTemplate, waNameField, waPhoneField, emailNotify } = body;

  if (fields !== undefined) {
    await db.dynamicFormField.deleteMany({ where: { formId: form.id } });
    if (fields.length > 0) {
      await db.dynamicFormField.createMany({
        data: fields.map((f: { label: string; type: string; placeholder?: string; options?: string[]; validation?: object; required?: boolean; order: number }) => ({
          formId: form.id, label: f.label.trim(), type: f.type,
          placeholder: f.placeholder?.trim() || null,
          options: f.options?.length ? JSON.stringify(f.options) : null,
          validation: f.validation ? JSON.stringify(f.validation) : null,
          required: f.required !== false, order: f.order,
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
      ...(emailNotify !== undefined && { emailNotify: !!emailNotify }),
    },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  await logChange(user.email, "update", `form:${slug}`, { name: updated.name }, getIp(req));
  return NextResponse.json(updated);
}

// DELETE — admin: delete form + all responses
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!canForm(user, slug, "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await db.dynamicForm.findUnique({ where: { slug } });
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.dynamicForm.delete({ where: { id: form.id } });
  await db.waTemplate.deleteMany({ where: { key: `form_${slug}` } });
  await logChange(user.email, "delete", `form:${slug}`, { name: form.name }, getIp(req));
  return NextResponse.json({ ok: true });
}
