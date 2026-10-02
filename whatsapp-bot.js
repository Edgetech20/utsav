const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Parse DATABASE_URL robustly — split on last @ so passwords containing @ work
const DB_URL = process.env.DATABASE_URL ?? "mysql://root:@localhost:3306/priobodhi";
const afterScheme = DB_URL.slice("mysql://".length);
const atPos      = afterScheme.lastIndexOf("@");
const userInfo   = afterScheme.slice(0, atPos);          // "user:pass" (pass may contain @)
const hostInfo   = afterScheme.slice(atPos + 1);         // "host:port/db"
const colonPos   = userInfo.indexOf(":");
const dbUser     = colonPos >= 0 ? userInfo.slice(0, colonPos) : userInfo;
const dbPass     = colonPos >= 0 ? userInfo.slice(colonPos + 1) : "";
const hm         = hostInfo.match(/^([^:]+):(\d+)\/(.+)/);
if (!hm) { console.error("[wa-bot] Invalid DATABASE_URL:", DB_URL); process.exit(1); }
const [, dbHost, dbPort, dbName] = hm;
const pool = mysql.createPool({
  host: dbHost, port: Number(dbPort), database: dbName,
  user: dbUser, password: dbPass,
  waitForConnections: true, connectionLimit: 5,
});

async function writeStatus(obj) {
  await pool.execute(
    "INSERT INTO WaStatus (status, qr, message, reason, updatedAt) VALUES (?,?,?,?,NOW())",
    [obj.status, obj.qr ?? null, obj.message ?? null, obj.reason ?? null]
  );
}

async function appendLog(entry) {
  await pool.execute(
    "INSERT INTO WaLog (name, whatsapp, status, error, sentAt) VALUES (?,?,?,?,NOW())",
    [entry.name, entry.whatsapp, entry.status, entry.error ?? null]
  );
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
  authStrategy: new LocalAuth({ dataPath: "/var/wwebjs_auth" }),
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
  writeStatus({ status: "qr", qr: dataUrl }).catch(console.error);
});

client.on("authenticated", () => { console.log("✓ Authenticated"); writeStatus({ status: "authenticated" }).catch(console.error); });
client.on("auth_failure", (msg) => { console.error("✗ Auth failed:", msg); writeStatus({ status: "error", message: msg }).catch(console.error); });
client.on("ready", () => { console.log("✓ WhatsApp connected.\n"); writeStatus({ status: "connected" }).then(() => watch()).catch(console.error); });
client.on("disconnected", (reason) => { writeStatus({ status: "disconnected", reason }).catch(console.error); });

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function sendWithRetry(waId, text, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try { await client.sendMessage(waId, text); return true; }
    catch (err) { if (i === retries) throw err; await delay(3000); }
  }
}

function watch() {
  setInterval(async () => {
    const [rows] = await pool.execute("SELECT * FROM Rsvp WHERE waSent = 0");

    for (const entry of rows) {
      try {
        await sendWithRetry(toWaId(entry.whatsapp), buildMessage(entry.name));
        await pool.execute("UPDATE Rsvp SET waSent = 1 WHERE id = ?", [entry.id]);
        await appendLog({ name: entry.name, whatsapp: entry.whatsapp, status: "sent" });
        console.log(`✓ Sent to ${entry.name} (${entry.whatsapp})`);
        await delay(2000);
      } catch (err) {
        await appendLog({ name: entry.name, whatsapp: entry.whatsapp, status: "failed", error: err.message });
        console.error(`✗ Failed for ${entry.name}:`, err.message);
      }
    }
  }, 5000);
}

writeStatus({ status: "starting" }).catch(console.error);
client.initialize();
