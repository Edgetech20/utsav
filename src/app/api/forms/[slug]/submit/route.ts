import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

function sendNotifyEmail(formName: string, data: Record<string, string>, superEmails: string[]) {
  if (!superEmails.length) return;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const timestamp = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
  const origin = process.env.NEXT_PUBLIC_BASE_URL || "";

  const rows = Object.entries(data).map(([k, v], i) => {
    const bg = i % 2 === 0 ? "#FAFAF8" : "#FFFFFF";
    return `
      <tr>
        <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#8B6914;background:${bg};width:38%;border-bottom:1px solid #F0EAD6;vertical-align:top">${k}</td>
        <td style="padding:12px 20px;font-size:13px;color:#1C1C1E;background:${bg};border-bottom:1px solid #F0EAD6;vertical-align:top">${v || '<span style="color:#9CA3AF">—</span>'}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2C1A00,#1C1200);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.15em;color:#C9A96E;text-transform:uppercase;font-family:system-ui,sans-serif">Form Notification</p>
            <h1 style="margin:0;font-size:26px;color:#E8D5B0;font-family:Georgia,serif;font-weight:normal;line-height:1.3">${formName}</h1>
            <p style="margin:10px 0 0;font-size:12px;color:rgba(201,169,110,0.65);font-family:system-ui,sans-serif">${timestamp}</p>
          </td>
        </tr>

        <!-- Badge -->
        <tr>
          <td style="background:#C9A96E;padding:10px 32px;text-align:center">
            <p style="margin:0;font-size:12px;font-weight:700;color:#1C1200;letter-spacing:0.08em;font-family:system-ui,sans-serif;text-transform:uppercase">✦ New Response Received ✦</p>
          </td>
        </tr>

        <!-- Response table -->
        <tr>
          <td style="background:#FFFFFF;padding:0;border-left:1px solid #E8DEC8;border-right:1px solid #E8DEC8">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${rows}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        ${origin ? `
        <tr>
          <td style="background:#FFFFFF;padding:24px 32px 32px;text-align:center;border-left:1px solid #E8DEC8;border-right:1px solid #E8DEC8">
            <a href="${origin}/admin" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C9A96E,#9A7840);color:#1C1200;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.06em;font-family:system-ui,sans-serif;text-transform:uppercase">View in Admin Panel →</a>
          </td>
        </tr>` : ""}

        <!-- Footer -->
        <tr>
          <td style="background:#2C1A00;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
            <p style="margin:0;font-size:11px;color:rgba(201,169,110,0.5);font-family:system-ui,sans-serif">This is an automated notification from your event management system.<br>Do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  transporter.sendMail({
    from: `"Priyabodhi Forms" <${process.env.SMTP_USER}>`,
    to: superEmails.join(","),
    subject: `📋 New Response: ${formName}`,
    html,
  }).catch(() => {});
}

type FieldValidation = {
  format?: "email" | "phone" | "numeric";
  minLength?: number;
  maxLength?: number;
  minDate?: string;
  maxDate?: string;
  disallowPast?: boolean;
  disallowFuture?: boolean;
};

function validateField(
  value: string,
  type: string,
  required: boolean,
  rawValidation: string | null,
  label: string
): string | null {
  if (type === "section") return null;
  if (type === "checkbox") {
    if (required && value !== "true") return `${label} must be confirmed`;
    return null;
  }
  if (type === "file") {
    if (required && !value?.trim()) return `${label}: file is required`;
    return null;
  }
  const trimmed = value?.trim() ?? "";
  if (required && !trimmed) return `${label} is required`;
  if (!trimmed) return null;

  const v: FieldValidation = rawValidation ? JSON.parse(rawValidation) : {};

  if (type === "text" || type === "textarea") {
    if (v.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return `${label}: invalid email address`;
    if (v.format === "phone" && !/^[6-9]\d{9}$/.test(trimmed.replace(/\D/g, "")))
      return `${label}: enter a valid 10-digit Indian mobile number`;
    if (v.format === "numeric" && !/^\d+$/.test(trimmed))
      return `${label}: only numbers allowed`;
    if (v.minLength && trimmed.length < v.minLength)
      return `${label}: minimum ${v.minLength} characters`;
    if (v.maxLength && trimmed.length > v.maxLength)
      return `${label}: maximum ${v.maxLength} characters`;
  }

  if (type === "date") {
    const d = new Date(value);
    if (isNaN(d.getTime())) return `${label}: invalid date`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (v.disallowPast && d < today) return `${label}: date cannot be in the past`;
    if (v.disallowFuture && d > today) return `${label}: date cannot be in the future`;
    if (v.minDate && value < v.minDate) return `${label}: date must be on or after ${v.minDate}`;
    if (v.maxDate && value > v.maxDate) return `${label}: date must be on or before ${v.maxDate}`;
  }

  return null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const form = await db.dynamicForm.findUnique({
    where: { slug },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (!form.enabled) return NextResponse.json({ error: "This form is closed" }, { status: 410 });

  const body: Record<string, string> = await req.json();

  // validate all fields (skip section headers)
  const errors: string[] = [];
  for (const field of form.fields) {
    if (field.type === "section") continue;
    const err = validateField(body[field.label] ?? "", field.type, field.required, field.validation, field.label);
    if (err) errors.push(err);
  }
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 });

  // build clean data object (skip section headers)
  const data: Record<string, string> = {};
  for (const field of form.fields) {
    if (field.type === "section") continue;
    data[field.label] = (body[field.label] ?? "").trim();
  }

  await db.dynamicFormResponse.create({
    data: { formId: form.id, data: JSON.stringify(data) },
  });

  // queue WA message if form has WA enabled and a valid template exists
  if (form.waEnabled && form.waPhoneField) {
    const tpl = await db.waTemplate.findUnique({ where: { key: `form_${slug}` } });
    if (tpl?.enabled && tpl.body) {
      const phone = data[form.waPhoneField]?.replace(/\D/g, "");
      const name  = form.waNameField ? (data[form.waNameField] ?? "") : "";
      if (phone) {
        let msg = tpl.body.replace(/\{name\}/gi, name.split(" ")[0] || name);
        for (const [k, v] of Object.entries(data)) {
          msg = msg.replace(new RegExp(`\\{${k}\\}`, "gi"), v);
        }
        await db.waQueue.create({
          data: { whatsapp: phone, recipientName: name, message: msg },
        });
      }
    }
  }

  // Email all super admins if enabled
  if (form.emailNotify) {
    const supers = await db.adminUser.findMany({ where: { role: "super" }, select: { email: true } });
    sendNotifyEmail(form.name, data, supers.map(s => s.email));
  }

  return NextResponse.json({ ok: true });
}
