import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { logChange, } from "@/lib/changelog";
import { getIp } from "@/lib/auth";

function sendWelcomeEmail(to: string, name: string | null, loginUrl: string) {
  const display = name || to.split("@")[0];
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  transporter.sendMail({
    from: `"Priyabodhi Admin" <${process.env.SMTP_USER}>`,
    to,
    subject: "You've been added as an Admin",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:32px">
        <h2 style="color:#0F172A;margin-bottom:8px">Welcome, ${display}!</h2>
        <p style="color:#64748B;margin-bottom:24px">প্রিয়বোধী মহোৎসব Admin Panel</p>
        <p style="color:#334155;font-size:14px">You have been granted access to the admin panel. Click the button below to log in with this email address.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${loginUrl}" style="display:inline-block;background:#0F172A;color:#C9A96E;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">Go to Admin Login</a>
        </div>
        <p style="font-size:12px;color:#94A3B8">You'll receive a one-time OTP on this email each time you log in.</p>
      </div>
    `,
  }).catch(() => {}); // fire-and-forget
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    include: { permissions: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, name, role } = await req.json();
  const clean = email?.trim().toLowerCase();
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  try {
    const created = await db.adminUser.create({
      data: { email: clean, name: name?.trim() || null, role: role === "super" ? "super" : "member" },
    });
    await logChange(user.email, "create", `user:${clean}`, { name: created.name, role: created.role }, getIp(req));
    const loginUrl = new URL("/admin/login", req.url).toString();
    sendWelcomeEmail(clean, created.name, loginUrl);
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, name, role } = await req.json();
  const clean = email?.trim().toLowerCase();
  if (!clean) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const updated = await db.adminUser.update({
    where: { email: clean },
    data: {
      ...(name !== undefined && { name: name?.trim() || null }),
      ...(role !== undefined && { role: role === "super" ? "super" : "member" }),
    },
  });
  await logChange(user.email, "update", `user:${clean}`, { name: updated.name, role: updated.role }, getIp(req));
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role !== "super") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await req.json();
  const clean = email?.trim().toLowerCase();
  if (!clean) return NextResponse.json({ error: "Email required" }, { status: 400 });
  if (clean === user.email) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  await db.adminUser.delete({ where: { email: clean } });
  await logChange(user.email, "delete", `user:${clean}`, undefined, getIp(req));
  return NextResponse.json({ ok: true });
}
