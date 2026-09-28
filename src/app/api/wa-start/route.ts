import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST() {
  // Use PM2 via shell string — Turbopack does not analyze exec string args as module paths
  exec("pm2 describe wa-bot > /dev/null 2>&1 && pm2 restart wa-bot || pm2 start whatsapp-bot.js --name wa-bot");
  return NextResponse.json({ ok: true });
}
