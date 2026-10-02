import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const [logs, queue] = await Promise.all([
    db.waLog.findMany({ orderBy: { sentAt: "desc" }, take: 500 }),
    db.waQueue.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" } }),
  ]);

  // Pending broadcast queue entries appear at top as "pending" rows
  const pending = queue.map(q => ({
    id:       q.id,
    type:     "broadcast",
    name:     q.recipientName,
    whatsapp: q.whatsapp,
    status:   "pending" as const,
    error:    null,
    sentAt:   q.createdAt.toISOString(),
  }));

  const sent = logs.map(l => ({
    id:       l.id,
    type:     l.type,
    name:     l.name,
    whatsapp: l.whatsapp,
    status:   l.status as "sent" | "failed",
    error:    l.error ?? null,
    sentAt:   l.sentAt.toISOString(),
  }));

  return NextResponse.json([...pending, ...sent]);
}
