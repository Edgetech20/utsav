import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getIp } from "@/lib/auth";
import { logChange } from "@/lib/changelog";

async function sendOtpEmail(to: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: `"Priyabodhi Admin" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Admin Login OTP",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:400px;margin:0 auto;padding:32px">
        <h2 style="color:#0F172A;margin-bottom:8px">Admin Login</h2>
        <p style="color:#64748B;margin-bottom:24px">প্রিয়বোধী মহোৎসব Admin Panel</p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;text-align:center">
          <p style="font-size:13px;color:#94A3B8;margin:0 0 8px">Your one-time password</p>
          <p style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0F172A;margin:0">${otp}</p>
          <p style="font-size:12px;color:#CBD5E1;margin:12px 0 0">Expires in 5 minutes · Do not share</p>
        </div>
        <p style="font-size:12px;color:#CBD5E1;margin-top:24px">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  const ip = getIp(req);

  // ── Step 1: request OTP ──
  if (email && !body.otp) {
    const user = await db.adminUser.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Email not authorised" }, { status: 403 });

    const existing = await db.otpStore.findUnique({ where: { email } });
    if (existing && existing.expiresAt.getTime() - 240_000 > Date.now())
      return NextResponse.json({ error: "Please wait before requesting another OTP" }, { status: 429 });

    const otp = crypto.randomInt(100000, 999999).toString();
    await db.otpStore.upsert({
      where: { email },
      create: { email, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      update: { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (err: any) {
      return NextResponse.json({ error: "Failed to send email: " + err.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── Step 2: verify OTP ──
  if (email && body.otp) {
    const record = await db.otpStore.findUnique({ where: { email } });

    if (!record || Date.now() > record.expiresAt.getTime())
      return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 401 });

    if (body.otp.trim() !== record.otp)
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 401 });

    await db.otpStore.delete({ where: { email } });

    // Get session timeout from settings (default 24h)
    const timeoutRow = await db.setting.findUnique({ where: { key: "session_timeout_hours" } });
    const hours = Math.max(1, parseInt(timeoutRow?.value ?? "24", 10) || 24);
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

    const token = crypto.randomBytes(32).toString("hex");
    await db.adminSession.create({ data: { token, email, expiresAt } });

    await logChange(email, "login", "auth", undefined, ip);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_session", token, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: hours * 3600,
    });
    // Clear legacy cookie if present
    res.cookies.delete("admin_auth");
    return res;
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (token) {
    const session = await db.adminSession.findUnique({ where: { token } });
    if (session) {
      await logChange(session.email, "logout", "auth", undefined, getIp(req));
      await db.adminSession.delete({ where: { token } }).catch(() => {});
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_session");
  res.cookies.delete("admin_auth");
  return res;
}
