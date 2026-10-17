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

// ── WaStatus ─────────────────────────────────────────────────────────────────
let statusRowId = null;

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
async function sendRsvpAuto(client) {
  const tpl = await prisma.waTemplate.findUnique({ where: { key: "rsvp_auto" } });
  if (!tpl?.enabled) return;

  const rows = await prisma.rsvp.findMany({ where: { waSent: false }, take: 10 });
  for (const row of rows) {
    const msg = tpl.body.replace(/\{name\}/gi, row.name.trim().split(" ")[0]);
    try {
      await client.sendMessage(chatId(row.whatsapp), msg);
      await prisma.rsvp.update({ where: { id: row.id }, data: { waSent: true } });
      await prisma.waLog.create({ data: { type: "rsvp_auto", name: row.name, whatsapp: row.whatsapp, status: "sent" } });
      console.log("[wa-bot] rsvp_auto sent →", row.whatsapp);
    } catch (e) {
      await prisma.waLog.create({ data: { type: "rsvp_auto", name: row.name, whatsapp: row.whatsapp, status: "failed", error: e.message } });
      console.error("[wa-bot] rsvp_auto failed →", row.whatsapp, e.message);
    }
    await sleep(2000);
  }
}

// ── Broadcast queue ───────────────────────────────────────────────────────────
const processing = new Set();

async function sendQueue(client) {
  const rows = await prisma.waQueue.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 5,
  });
  for (const row of rows) {
    if (processing.has(row.id)) continue;
    processing.add(row.id);
    try {
      await client.sendMessage(chatId(row.whatsapp), row.message);
      await prisma.waQueue.update({ where: { id: row.id }, data: { status: "sent", sentAt: new Date() } });
      await prisma.waLog.create({ data: { type: "broadcast", name: row.recipientName, whatsapp: row.whatsapp, status: "sent" } });
      console.log("[wa-bot] broadcast sent →", row.whatsapp);
    } catch (e) {
      await prisma.waQueue.update({ where: { id: row.id }, data: { status: "failed", error: e.message } });
      await prisma.waLog.create({ data: { type: "broadcast", name: row.recipientName, whatsapp: row.whatsapp, status: "failed", error: e.message } });
      console.error("[wa-bot] broadcast failed →", row.whatsapp, e.message);
    } finally {
      processing.delete(row.id);
    }
    await sleep(2000);
  }
}

// ── WhatsApp client ───────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
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
  process.exit(1);
});

client.on("auth_failure", async msg => {
  console.error("[wa-bot] auth failure:", msg);
  await setStatus("auth_failed").catch(() => {});
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
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
