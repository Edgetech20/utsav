import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "forms", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const forms = await db.dynamicForm.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { fields: true, responses: true } } },
  });
  return NextResponse.json(forms.map(({ _count, ...f }) => ({
    ...f, fieldCount: _count.fields, responseCount: _count.responses,
  })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "forms", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, fields = [], waEnabled, waNameField, waPhoneField, emailNotify } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  let slug = slugify(name.trim());
  const existing = await db.dynamicForm.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const form = await db.dynamicForm.create({
    data: {
      name: name.trim(), slug, description: description?.trim() || null,
      waEnabled: !!waEnabled, waNameField: waNameField || null, waPhoneField: waPhoneField || null, emailNotify: !!emailNotify,
      fields: {
        create: fields.map((f: { label: string; type: string; placeholder?: string; options?: string[]; validation?: object; required?: boolean; order: number }) => ({
          label: f.label.trim(), type: f.type,
          placeholder: f.placeholder?.trim() || null,
          options: f.options?.length ? JSON.stringify(f.options) : null,
          validation: f.validation ? JSON.stringify(f.validation) : null,
          required: f.required !== false, order: f.order,
        })),
      },
    },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  await db.waTemplate.upsert({
    where: { key: `form_${slug}` },
    create: {
      key: `form_${slug}`, name: `${name.trim()} Auto-Message`,
      body: `Namaskar {name} 🙏\n\nYour ${name.trim()} registration has been received.\n\nThank you!\n\nJai Guru!`,
      enabled: false,
    },
    update: {},
  });

  await logChange(user.email, "create", `form:${slug}`, { name: form.name }, getIp(req));
  return NextResponse.json(form, { status: 201 });
}
