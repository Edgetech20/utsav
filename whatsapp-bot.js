const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const RSVP_FILE   = path.join(__dirname, "data", "rsvp.json");
const SENT_FILE   = path.join(__dirname, "data", "rsvp_sent.json");
const STATUS_FILE = path.join(__dirname, "data", "wa_status.json");
const LOG_FILE    = path.join(__dirname, "data", "wa_log.json");

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch { return fallback; }
}

function writeStatus(obj) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify({ ...obj, updatedAt: new Date().toISOString() }, null, 2));
}

function saveSent(sent) {
  fs.writeFileSync(SENT_FILE, JSON.stringify(sent, null, 2));
}

function appendLog(entry) {
  const logs = readJSON(LOG_FILE, []);
  logs.unshift(entry); // newest first
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs.slice(0, 500), null, 2)); // cap at 500
}

function toWaId(raw) {
  const digits = raw.replace(/\D/g, "");
  const num = digits.startsWith("91") ? digits : "91" + digits;
  return num + "@c.us";
}

function buildMessage(name) {
  const firstName = name.trim().split(" ")[0];
  return (
    `Namaskar ${firstName} 🙏\n\n` +
    `We have received your registration for Priyabodhi Mahotsav on 20 December.\n\n` +
    `Thank you for letting us know. We look forward to your presence.\n\n` +
    `Jai Guru!`
  );
}

// Use installed Chrome if available (faster, more reliable on Windows)
const fs2 = require("fs");
const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.CHROME_PATH,
].filter(Boolean);
const executablePath = CHROME_PATHS.find(p => fs2.existsSync(p));
if (executablePath) console.log("Using Chrome:", executablePath);

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: {
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  },
});

client.on("qr", async (qr) => {
  console.log("\nScan this QR code with WhatsApp (Linked Devices):\n");
  qrcode.generate(qr, { small: true });
  const dataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
  writeStatus({ status: "qr", qr: dataUrl });
});

client.on("authenticated", () => { console.log("✓ Authenticated"); writeStatus({ status: "authenticated" }); });
client.on("auth_failure", (msg) => { console.error("✗ Auth failed:", msg); writeStatus({ status: "error", message: msg }); });
client.on("ready", () => { console.log("✓ WhatsApp connected.\n"); writeStatus({ status: "connected" }); watch(); });
client.on("disconnected", (reason) => { writeStatus({ status: "disconnected", reason }); });

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function sendWithRetry(waId, text, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try { await client.sendMessage(waId, text); return true; }
    catch (err) { if (i === retries) throw err; await delay(3000); }
  }
}

function watch() {
  setInterval(async () => {
    const entries = readJSON(RSVP_FILE, []);
    const sent = readJSON(SENT_FILE, []);
    let changed = false;

    for (const entry of entries) {
      const key = `${entry.whatsapp}|${entry.submittedAt}`;
      if (sent.includes(key)) continue;

      try {
        await sendWithRetry(toWaId(entry.whatsapp), buildMessage(entry.name));
        sent.push(key);
        changed = true;
        appendLog({ name: entry.name, whatsapp: entry.whatsapp, status: "sent", sentAt: new Date().toISOString() });
        console.log(`✓ Sent to ${entry.name} (${entry.whatsapp})`);
        await delay(2000);
      } catch (err) {
        appendLog({ name: entry.name, whatsapp: entry.whatsapp, status: "failed", error: err.message, sentAt: new Date().toISOString() });
        console.error(`✗ Failed for ${entry.name}:`, err.message);
      }
    }

    if (changed) saveSent(sent);
  }, 5000);
}

writeStatus({ status: "starting" });
client.initialize();
