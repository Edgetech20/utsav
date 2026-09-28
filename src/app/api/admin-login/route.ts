import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import nodemailer from "nodemailer";
import path from "path";
import crypto from "crypto";

const OTP_FILE = path.join(process.cwd(), "data", "otp_store.json");
const ALLOWED  = (process.env.ALLOWED_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());
const SECRET   = process.env.ADMIN_SECRET ?? "admin123";

type OtpStore = Record<string, { otp: string; expiresAt: number }>;

function readStore(): OtpStore {
  if (!existsSync(OTP_FILE)) return {};
  try { return JSON.parse(readFileSync(OTP_FILE, "utf-8")); } catch { return {}; }
}

function saveStore(store: OtpStore) {
  mkdirSync(path.dirname(OTP_FILE), { recursive: true });
  writeFileSync(OTP_FILE, JSON.stringify(store, null, 2));
}

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

  // ── Step 1: request OTP ──
  if (email && !body.otp) {
    if (!ALLOWED.includes(email))
      return NextResponse.json({ error: "Email not authorised" }, { status: 403 });

    const store = readStore();
    const existing = store[email];
    // Rate limit: block if OTP was issued < 60s ago
    if (existing && existing.expiresAt - 240000 > Date.now())
      return NextResponse.json({ error: "Please wait before requesting another OTP" }, { status: 429 });

    const otp = crypto.randomInt(100000, 999999).toString();
    store[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    saveStore(store);

    try {
      await sendOtpEmail(email, otp);
    } catch (err: any) {
      return NextResponse.json({ error: "Failed to send email: " + err.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // ── Step 2: verify OTP ──
  if (email && body.otp) {
    const store = readStore();
    const record = store[email];

    if (!record || Date.now() > record.expiresAt)
      return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 401 });

    if (body.otp.trim() !== record.otp)
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 401 });

    delete store[email];
    saveStore(store);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_auth", SECRET, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_auth");
  return res;
}
