"use strict";

// Load .env
try { require("dotenv").config(); } catch {}

// ── Start WhatsApp bot inline (same process as Next.js) ───────────────────────
const { start: startBot, client: waClient } = require("./whatsapp-bot");
const { PrismaClient } = require("@prisma/client");

globalThis.__waInline = true;
globalThis.__waClient = waClient;
globalThis.__waStart  = startBot; // admin can trigger via /api/wa-start

// Auto-reconnect if session files exist on disk (survives deploys)
(async () => {
  const prisma = new PrismaClient();
  try {
    const hasSession = require("fs").existsSync("/var/wwebjs_auth_utsav");
    if (hasSession) {
      console.log("[wa-bot] session found, auto-reconnecting…");
      startBot().catch(e => console.error("[wa-bot] start error:", e.message));
    } else {
      console.log("[wa-bot] idle — trigger via admin panel to connect");
    }
  } catch (e) {
    console.error("[wa-bot] DB check failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
})();

// ── Start Next.js custom server ───────────────────────────────────────────────
const { createServer } = require("http");
const { parse }        = require("url");
const next             = require("next");

const app    = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    await handle(req, res, parse(req.url, true));
  }).listen(2000, () => console.log("[utsav] ready on :2000"));
}).catch(e => {
  console.error("[utsav] failed to start:", e.message);
  process.exit(1);
});
