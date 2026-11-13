import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

const SECRET = process.env.FEEDBACK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${SECRET}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, mobile, responses } = body;

  if (!name?.trim() || !mobile?.trim() || !responses)
    return NextResponse.json({ error: "name, mobile, responses required" }, { status: 400 });

  await db.feedbackResponse.create({
    data: {
      name: name.trim(),
      mobile: mobile.trim(),
      responses: typeof responses === "string" ? responses : JSON.stringify(responses),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "feedback", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entries = await db.feedbackResponse.findMany({ orderBy: { submittedAt: "desc" } });
  return NextResponse.json({ entries });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "feedback", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await db.feedbackResponse.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
