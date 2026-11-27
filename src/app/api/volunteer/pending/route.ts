import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";

// First form answer whose label contains one of the keywords
function pick(data: Record<string, unknown>, ...keys: string[]): string {
  for (const [label, val] of Object.entries(data)) {
    if (keys.some(k => label.toLowerCase().includes(k))) return String(val ?? "").trim();
  }
  return "";
}

/** Linked-form responses not yet registered as volunteers, mapped to volunteer fields. */
export async function GET(req: NextRequest) {
  const { err } = await requirePerm(req, "volunteer", "edit");
  if (err) return err;

  const slug = (await db.setting.findUnique({ where: { key: "vol_form_slug" } }))?.value;
  const form = slug ? await db.dynamicForm.findUnique({ where: { slug } }) : null;
  if (!form) return NextResponse.json({ formName: null, results: [] });

  const [responses, taken, depts] = await Promise.all([
    db.dynamicFormResponse.findMany({ where: { formId: form.id }, orderBy: { submittedAt: "desc" } }),
    db.volunteer.findMany({ where: { responseId: { not: null } }, select: { responseId: true } }),
    db.volDepartment.findMany({ where: { isActive: true } }),
  ]);
  const takenIds = new Set(taken.map(t => t.responseId));

  const results = responses.filter(r => !takenIds.has(r.id)).flatMap(r => {
    let data: Record<string, unknown>;
    try { data = JSON.parse(r.data); } catch { return []; }
    const department = pick(data, "department", "team", "seva", "duty", "role");
    const match = depts.find(d => [d.name, d.code].some(x => x.toLowerCase() === department.toLowerCase()));
    return [{
      responseId: r.id, submittedAt: r.submittedAt,
      name:    pick(data, "name"),
      mobile:  pick(data, "mobile", "phone", "whatsapp", "contact"),
      address: pick(data, "address", "village", "locality", "area"),
      department, departmentId: match?.id ?? null,
    }];
  });

  return NextResponse.json({ formName: form.name, results });
}
