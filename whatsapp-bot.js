"use strict";

// Load .env (standalone script — not run by Next.js)
try { require("dotenv").config(); } catch {}

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode               = require("qrcode");
const { PrismaClient }     = require("@prisma/client");

const prisma = new PrismaClient();

// ── Phone → WhatsApp chat ID ──────────────────────────────────────────────────
function chatId(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}@c.us`;
  if (digits.length === 12 && digits.startsWith("91")) return `${digits}@c.us`;
  return `${digits}@c.us`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const CFG_DEFAULTS = { wa_interval_min: 90, wa_interval_max: 120, wa_daily_cap: 50, wa_hours_from: 9, wa_hours_to: 20 };

async function loadConfig() {
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: Object.keys(CFG_DEFAULTS) } } });
    const map  = Object.fromEntries(rows.map(r => [r.key, parseFloat(r.value)]));
    return Object.fromEntries(Object.entries(CFG_DEFAULTS).map(([k, def]) => [k, map[k] ?? def]));
  } catch { return { ...CFG_DEFAULTS }; }
}

function msgDelay(min, max) { return sleep(min * 1000 + Math.random() * (max - min) * 1000); }

function isBusinessHours(from, to) {
  const h = (new Date().getUTCHours() + 5.5) % 24; // IST hour
  return h >= from && h < to;
}

// Daily send cap — resets at midnight
let daySends = 0;
let dayKey = new Date().toDateString();
function checkCap(cap) {
  const today = new Date().toDateString();
  if (today !== dayKey) { daySends = 0; dayKey = today; }
  if (daySends >= cap) return false;
  daySends++;
  return true;
}

// Simulate typing for a human-looking pause before sending
async function sendWithTyping(client, id, msg) {
  const chat = await client.getChatById(id);
  await chat.sendStateTyping();
  await sleep(1500 + Math.random() * 2000); // "typing" 1.5–3.5 s
  await chat.clearState();
  await client.sendMessage(id, msg);
}

// ── WaStatus ─────────────────────────────────────────────────────────────────
let statusRowId = null;
let lastQr = null;

async function setStatus(status, qr = null) {
  if (statusRowId) {
    await prisma.waStatus.update({ where: { id: statusRowId }, data: { status, qr } });
  } else {
    const existing = await prisma.waStatus.findFirst({ orderBy: { id: "desc" } });
    if (existing) {
      statusRowId = existing.id;
      await prisma.waStatus.update({ where: { id: statusRowId }, data: { status, qr } });
    } else {
      const row = await prisma.waStatus.create({ data: { status, qr } });
      statusRowId = row.id;
    }
  }
  console.log("[wa-bot] status:", status);
}

// ── RSVP auto-messages ────────────────────────────────────────────────────────
let rsvpSending = false;

async function sendRsvpAuto(client) {
  if (rsvpSending) return; // prevent overlap while waiting between msgs
  rsvpSending = true;
  try {
    const cfg = await loadConfig();
    if (!isBusinessHours(cfg.wa_hours_from, cfg.wa_hours_to)) return;

    const tpl = await prisma.waTemplate.findUnique({ where: { key: "rsvp_auto" } });
    if (!tpl?.enabled) return;

    const rows = await prisma.rsvp.findMany({ where: { waSent: false }, orderBy: { submittedAt: "desc" }, take: 1 });
    for (const row of rows) {
      if (!checkCap(cfg.wa_daily_cap)) { console.log("[wa-bot] daily cap reached"); break; }
      const msg = tpl.body.replace(/\{name\}/gi, row.name.trim().split(" ")[0]);
      const id = chatId(row.whatsapp);
      try {
        await sendWithTyping(client, id, msg);
        await prisma.rsvp.update({ where: { id: row.id }, data: { waSent: true } });
        await prisma.waLog.create({ data: { type: "rsvp_auto", name: row.name, whatsapp: row.whatsapp, status: "sent" } });
        console.log("[wa-bot] rsvp_auto sent →", row.whatsapp);
      } catch (e) {
        if (e.message?.includes("detached Frame")) {
          console.warn("[wa-bot] rsvp_auto detached frame, will retry →", row.whatsapp);
          continue;
        }
        await prisma.waLog.create({ data: { type: "rsvp_auto", name: row.name, whatsapp: row.whatsapp, status: "failed", error: e.message } });
        console.error("[wa-bot] rsvp_auto failed →", row.whatsapp, e.message);
        // Mark done so we don't retry forever; log table has the failure reason
        await prisma.rsvp.update({ where: { id: row.id }, data: { waSent: true } }).catch(() => {});
      }
      await msgDelay(cfg.wa_interval_min, cfg.wa_interval_max);
    }
  } finally {
    rsvpSending = false;
  }
}

// ── Broadcast queue ───────────────────────────────────────────────────────────
let queueSending = false; // mirrors rsvpSending — prevents interval overlap

async function sendQueue(client) {
  if (queueSending) return;
  queueSending = true;
  try {
    const cfg = await loadConfig();
    if (!isBusinessHours(cfg.wa_hours_from, cfg.wa_hours_to)) return;

    const rows = await prisma.waQueue.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: 1,
    });
    for (const row of rows) {
      if (!checkCap(cfg.wa_daily_cap)) { console.log("[wa-bot] daily cap reached"); break; }
      const id = chatId(row.whatsapp);
      try {
        await sendWithTyping(client, id, row.message);
        await prisma.waQueue.update({ where: { id: row.id }, data: { status: "sent", sentAt: new Date() } });
        await prisma.waLog.create({ data: { type: "broadcast", name: row.recipientName, whatsapp: row.whatsapp, status: "sent" } });
        console.log("[wa-bot] broadcast sent →", row.whatsapp);
      } catch (e) {
        if (e.message?.includes("detached Frame")) {
          console.warn("[wa-bot] broadcast detached frame, will retry →", row.whatsapp);
          continue;
        }
        await prisma.waQueue.update({ where: { id: row.id }, data: { status: "failed", error: e.message } });
        await prisma.waLog.create({ data: { type: "broadcast", name: row.recipientName, whatsapp: row.whatsapp, status: "failed", error: e.message } });
        console.error("[wa-bot] broadcast failed →", row.whatsapp, e.message);
      }
      await msgDelay(cfg.wa_interval_min, cfg.wa_interval_max);
    }
  } finally {
    queueSending = false;
  }
}

// ── WhatsApp client ───────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "/var/wwebjs_auth_utsav" }),
  puppeteer: {
    headless: true,
args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-sync",
      "--no-first-run",
      "--no-zygote",
      "--mute-audio",
    ],
  },
});

client.on("qr", async qr => {
  if (qr === lastQr) return;
  lastQr = qr;
  const dataUrl = await qrcode.toDataURL(qr);
  await setStatus("qr", dataUrl).catch(console.error);
});

client.on("authenticated", () => setStatus("authenticated").catch(console.error));

client.on("ready", () => {
  setStatus("connected").catch(console.error);
  console.log("[wa-bot] ready — polling every 10s");
  sendRsvpAuto(client).catch(e => console.error("[wa-bot]", e.message));
  sendQueue(client).catch(e => console.error("[wa-bot]", e.message));
  setInterval(() => {
    sendRsvpAuto(client).catch(e => console.error("[wa-bot]", e.message));
    sendQueue(client).catch(e => console.error("[wa-bot]", e.message));
  }, 10_000);
});

client.on("disconnected", async reason => {
  console.log("[wa-bot] disconnected:", reason);
  await setStatus("disconnected").catch(() => {});
  if (reason === "LOGOUT") {
    require("fs").rmSync("/var/wwebjs_auth_utsav", { recursive: true, force: true });
    console.log("[wa-bot] auth cleared after LOGOUT");
  }
  process.exit(1);
});

client.on("auth_failure", async msg => {
  console.error("[wa-bot] auth failure:", msg);
  await setStatus("auth_failed").catch(() => {});
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
let botStarted = false;

async function start() {
  if (botStarted) return;
  botStarted = true;
  await setStatus("starting");
  console.log("[wa-bot] initializing…");
  client.initialize();
}

// Export for use as a module (combined server mode)
module.exports = { start, client };

// Auto-start only when run directly: node whatsapp-bot.js
if (require.main === module) {
  start().catch(e => {
    console.error("[wa-bot] DB error:", e.message);
    process.exit(1);
  });
}
