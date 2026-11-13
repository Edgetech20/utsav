import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const url = new URL(req.url);
  const take = Math.min(500, parseInt(url.searchParams.get("take") ?? "200", 10));

  // Super sees all; members see only their own actions
  const where = user.role === "super" ? {} : { email: user.email };

  const logs = await db.changeLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json(logs);
}
