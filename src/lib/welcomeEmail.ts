import nodemailer from "nodemailer";
import { db } from "@/lib/db";

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/**
 * Invite email for a new admin user. Fire-and-forget: never throws.
 * Branding comes from the site's settings so every client deployment sends its own name.
 */
export async function sendWelcomeEmail(opts: {
  to: string; name: string; roles: string[]; isSuper: boolean; invitedBy: string; origin: string;
}) {
  try {
    const rows = await db.setting.findMany({ where: { key: { in: ["event_title", "event_title_sub", "event_subtitle"] } } });
    const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
    const event = [s.event_title, s.event_title_sub].filter(Boolean).join(" ") || "Event Admin";
    // BASE_URL is the public address; the request origin may be the internal proxy target
    const loginUrl = new URL("/login", process.env.BASE_URL || opts.origin).toString();

    const access = opts.isSuper
      ? `<tr><td style="padding:10px 14px;background:#FBF7EF;border:1px solid #EAD9B8;border-radius:8px;font-size:14px;color:#7A5A1E"><b>Super Admin</b> — full access to everything</td></tr>`
      : opts.roles.map(r => `<tr><td style="padding:4px 0"><span style="display:inline-block;padding:6px 12px;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:20px;font-size:13px;color:#0F172A">${esc(r)}</span></td></tr>`).join("");

    const step = (n: number, text: string) => `
      <tr><td style="padding:6px 0;font-size:14px;color:#334155">
        <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:11px;background:#0F172A;color:#C9A96E;font-size:12px;font-weight:700;margin-right:10px">${n}</span>${text}
      </td></tr>`;

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(event)}</title></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:32px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #E8ECF0">
    <tr><td style="background:#0F172A;padding:28px 32px">
      <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#94A3B8">Admin access</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#C9A96E">${esc(event)}</p>
      ${s.event_subtitle ? `<p style="margin:4px 0 0;font-size:13px;color:#CBD5E1">${esc(s.event_subtitle)}</p>` : ""}
    </td></tr>
    <tr><td style="padding:32px">
      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0F172A">Welcome, ${esc(opts.name)}!</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155">You've been added to the ${esc(event)} admin panel. Here's the access you've been given:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px">${access}</table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 28px">
        <a href="${loginUrl}" style="display:inline-block;background:#0F172A;color:#C9A96E;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px">Sign in to the admin panel</a>
      </td></tr></table>
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0F172A">How to sign in</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
        ${step(1, "Open the sign-in link above")}
        ${step(2, `Enter this email: <b>${esc(opts.to)}</b>`)}
        ${step(3, "Type the one-time code we email you — no password needed")}
      </table>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B">Button not working? Copy this link into your browser:<br>
        <a href="${loginUrl}" style="color:#B08D4F;word-break:break-all">${loginUrl}</a></p>
    </td></tr>
    <tr><td style="padding:18px 32px;background:#FAFBFC;border-top:1px solid #E8ECF0;font-size:12px;line-height:1.6;color:#94A3B8">
      Added by ${esc(opts.invitedBy)}. If you weren't expecting this, you can ignore this email — nobody can sign in as you without the code sent to this inbox.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

    const text = [
      `Welcome, ${opts.name}!`, "",
      `You've been added to the ${event} admin panel.`,
      `Access: ${opts.isSuper ? "Super Admin (full access)" : opts.roles.join(", ")}`, "",
      `Sign in: ${loginUrl}`,
      `1. Open the link  2. Enter ${opts.to}  3. Type the one-time code we email you`, "",
      `Added by ${opts.invitedBy}.`,
    ].join("\n");

    await nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    }).sendMail({
      from: `"${event.replace(/"/g, "")} Admin" <${process.env.SMTP_USER}>`,
      to: opts.to,
      subject: `You've been given admin access — ${event}`,
      html, text,
    });
  } catch (e) {
    console.error("[welcome-email] failed:", e);
  }
}
