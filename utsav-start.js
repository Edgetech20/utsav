"use strict";

// Load .env
try { require("dotenv").config(); } catch {}

// ── Start WhatsApp bot inline (same process as Next.js) ───────────────────────
const { start: startBot, client: waClient } = require("./whatsapp-bot");

// Expose on globalThis so wa-start API route knows bot is inline
globalThis.__waInline = true;
globalThis.__waClient = waClient;

startBot().catch(e => console.error("[wa-bot] start error:", e.message));

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
