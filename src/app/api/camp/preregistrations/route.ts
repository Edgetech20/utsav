import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

// Fuzzy-match a field label against keyword list
function pick(data: Record<string, string>, ...keys: string[]): string {
  for (const [label, val] of Object.entries(data)) {
    const l = label.toLowerCase();
    if (keys.some(k => l.includes(k))) return val?.trim() ?? "";
  }
  return "";
}

function normalize(raw: string) {
  let data: Record<string, string> = {};
  try { data = JSON.parse(raw); } catch { return null; }

  return {
    name:    pick(data, "name"),
    age:     pick(data, "age"),
    gender:  pick(data, "gender", "sex"),
    mobile:  pick(data, "mobile", "phone", "whatsapp", "contact"),
    address: pick(data, "address", "village", "locality", "area"),
    problem: pick(data, "problem", "issue", "complaint", "symptom", "disease", "ailment", "reason"),
  };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "camp", "register")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const formSlug = searchParams.get("formSlug");
  const q        = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!formSlug) return NextResponse.json({ error: "formSlug required" }, { status: 400 });

  const form = await db.dynamicForm.findUnique({ where: { slug: formSlug } });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const responses = await db.dynamicFormResponse.findMany({
    where: { formId: form.id },
    orderBy: { submittedAt: "desc" },
  });

  // Normalise all responses
  const normalized = responses.flatMap(r => {
    const fields = normalize(r.data);
    if (!fields) return [];
    return [{ responseId: r.id, submittedAt: r.submittedAt, ...fields }];
  });

  // Filter by search
  const filtered = q
    ? normalized.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.mobile.toLowerCase().includes(q) ||
        n.problem.toLowerCase().includes(q)
      )
    : normalized;

  // Cross-check registered mobiles (non-empty ones)
  const mobiles = [...new Set(filtered.map(n => n.mobile).filter(Boolean))];
  const existing = mobiles.length
    ? await db.campPatient.findMany({ where: { mobile: { in: mobiles } }, select: { mobile: true } })
    : [];
  const registeredSet = new Set(existing.map(e => e.mobile));

  const results = filtered.map(n => ({
    ...n,
    alreadyRegistered: n.mobile ? registeredSet.has(n.mobile) : false,
  }));

  return NextResponse.json({ formName: form.name, results });
}
