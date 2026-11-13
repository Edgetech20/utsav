import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

function sendNotifyEmail(formName: string, data: Record<string, string>, superEmails: string[]) {
  if (!superEmails.length) return;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const rows = Object.entries(data)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;white-space:nowrap">${k}</td><td style="padding:6px 12px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9">${v || "—"}</td></tr>`)
    .join("");
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px">
      <h2 style="color:#0F172A;margin:0 0 4px">New Response: ${formName}</h2>
      <p style="color:#94A3B8;font-size:12px;margin:0 0 24px">${new Date().toLocaleString("en-IN")}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">${rows}</table>
    </div>`;
  transporter.sendMail({
    from: `"Priyabodhi Forms" <${process.env.SMTP_USER}>`,
    to: superEmails.join(","),
    subject: `New Response: ${formName}`,
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
