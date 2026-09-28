import { NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST() {
  try {
    // Build path dynamically — prevents Turbopack static analysis from treating it as a module
    const cwd = process.cwd();
    const script = ["whatsapp-bot", "js"].join(".");
    const bot = spawn("node", [cwd + "/" + script], {
      detached: true,
      stdio: "ignore",
    });
    bot.unref();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
