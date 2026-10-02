import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const forms = await db.dynamicForm.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { fields: true, responses: true } },
    },
  });
  return NextResponse.json(forms.map(({ _count, ...f }) => ({
    ...f,
    fieldCount: _count.fields,
    responseCount: _count.responses,
  })));
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const body = await req.json();
  const { name, description, fields = [], waEnabled, waNameField, waPhoneField } = body;

  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  let slug = slugify(name.trim());
  // ensure uniqueness
  const existing = await db.dynamicForm.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const form = await db.dynamicForm.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      waEnabled: !!waEnabled,
      waNameField: waNameField || null,
      waPhoneField: waPhoneField || null,
      fields: {
        create: fields.map((f: { label: string; type: string; placeholder?: string; options?: string[]; validation?: object; required?: boolean; order: number }) => ({
          label: f.label.trim(),
          type: f.type,
          placeholder: f.placeholder?.trim() || null,
          options: f.options?.length ? JSON.stringify(f.options) : null,
          validation: f.validation ? JSON.stringify(f.validation) : null,
          required: f.required !== false,
          order: f.order,
        })),
      },
    },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  // auto-create a WaTemplate so it appears in the Templates page
  await db.waTemplate.upsert({
    where: { key: `form_${slug}` },
    create: {
      key: `form_${slug}`,
      name: `${name.trim()} Auto-Message`,
      body: `Namaskar {name} 🙏\n\nYour ${name.trim()} registration has been received.\n\nThank you!\n\nJai Guru!`,
      enabled: false,
    },
    update: {}, // don't overwrite if it already exists
  });

  return NextResponse.json(form, { status: 201 });
}
