import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST() {
  try {
    const bot = spawn("node", [path.join(process.cwd(), "whatsapp-bot.js")], {
      detached: true,
      stdio: "ignore",
    });
    bot.unref();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
