import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

type Params = { params: Promise<{ email: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await params;
  const perms = await db.adminPermission.findMany({ where: { email } });
  return NextResponse.json(perms);
}

// PUT — replace the full permission set for a user
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await params;
  // permissions: Array<{ resource: string; action: "view" | "edit" }>
  const { permissions }: { permissions: Array<{ resource: string; action: string }> } = await req.json();

  if (!Array.isArray(permissions))
    return NextResponse.json({ error: "permissions must be an array" }, { status: 400 });

  // Replace all permissions atomically
  await db.$transaction([
    db.adminPermission.deleteMany({ where: { email } }),
    ...(permissions.length > 0
      ? [db.adminPermission.createMany({
          data: permissions.map(p => ({ email, resource: p.resource, action: p.action })),
          skipDuplicates: true,
        })]
      : []),
  ]);

  await logChange(user.email, "grant", `permission:${email}`, { permissions }, getIp(req));
  const updated = await db.adminPermission.findMany({ where: { email } });
  return NextResponse.json(updated);
}
