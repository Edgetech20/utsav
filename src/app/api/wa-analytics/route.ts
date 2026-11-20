import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user, "whatsapp", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [logs, pendingQueue] = await Promise.all([
    db.waLog.findMany({ orderBy: { sentAt: "desc" } }),
    db.waQueue.count({ where: { status: "pending" } }),
  ]);

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sent   = logs.filter(l => l.status === "sent");
  const failed = logs.filter(l => l.status === "failed");

  // ── Daily counts — last 14 days ───────────────────────────────────────────
  const daily: { date: string; sent: number; failed: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d     = new Date(today); d.setDate(d.getDate() - i);
    const dStr  = d.toISOString().slice(0, 10);
    const dNext = new Date(d); dNext.setDate(dNext.getDate() + 1);
    daily.push({
      date:   dStr,
      sent:   sent.filter(l => l.sentAt >= d && l.sentAt < dNext).length,
      failed: failed.filter(l => l.sentAt >= d && l.sentAt < dNext).length,
    });
  }

  // ── Hourly distribution ───────────────────────────────────────────────────
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour:  h,
    count: sent.filter(l => new Date(l.sentAt).getHours() === h).length,
  }));

  // ── By type ───────────────────────────────────────────────────────────────
  const types = [...new Set(logs.map(l => l.type))];
  const byType = Object.fromEntries(types.map(t => ([t, {
    sent:   logs.filter(l => l.type === t && l.status === "sent").length,
    failed: logs.filter(l => l.type === t && l.status === "failed").length,
  }])));

  // ── Top errors ────────────────────────────────────────────────────────────
  const errorMap: Record<string, number> = {};
  for (const l of failed) {
    const key = (l.error ?? "Unknown error").slice(0, 80);
    errorMap[key] = (errorMap[key] ?? 0) + 1;
  }
  const topErrors = Object.entries(errorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }));

  // ── Queue burn-down ───────────────────────────────────────────────────────
  const last7days = daily.slice(-7);
  const avgPerDay = last7days.length
    ? Math.round(last7days.reduce((s, d) => s + d.sent, 0) / last7days.length)
    : 0;
  const etaDays = avgPerDay > 0 ? Math.ceil(pendingQueue / avgPerDay) : null;

  const todaySent = daily[daily.length - 1]?.sent ?? 0;

  return NextResponse.json({
    totals:    { sent: sent.length, failed: failed.length, pending: pendingQueue, todaySent },
    daily,
    hourly,
    byType,
    topErrors,
    queueStats: { pending: pendingQueue, avgPerDay, etaDays },
    successRate: sent.length + failed.length > 0
      ? Math.round((sent.length / (sent.length + failed.length)) * 100) : 100,
  });
}
