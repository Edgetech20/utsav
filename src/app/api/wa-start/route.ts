import { NextRequest, NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import path from "path";
import { requireAdmin } from "@/lib/auth";

let botProc: ReturnType<typeof spawn> | null = null;

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;

  // Inline mode (utsav-start.js) — bot is already running in this process
  if ((globalThis as Record<string, unknown>).__waInline) {
    return NextResponse.json({ ok: true });
  }

  const cwd     = process.cwd();
  const botPath = path.join(cwd, "whatsapp-bot.js");

  const extraPath = [
    "/usr/local/bin", "/usr/bin", "/bin",
    "/root/.npm-global/bin",
    `${process.env.HOME ?? "/root"}/.npm-global/bin`,
  ].join(":");

  const env = { ...process.env, PATH: `${process.env.PATH ?? ""}:${extraPath}` };

  const pm2Cmd = `pm2 describe wa-bot > /dev/null 2>&1 && pm2 restart wa-bot || pm2 start "${botPath}" --name wa-bot`;

  exec(pm2Cmd, { cwd, env }, (err) => {
    if (!err) return;

    // PM2 not available — spawn node directly (local dev)
    console.log("[wa-start] PM2 not available, spawning with node");
    if (botProc && !botProc.exitCode) return;

    botProc = spawn("node", [botPath], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    botProc.stdout?.on("data", (d: Buffer) => process.stdout.write("[wa-bot] " + d));
    botProc.stderr?.on("data", (d: Buffer) => process.stderr.write("[wa-bot] " + d));
    botProc.on("exit", (code) => {
      console.log("[wa-start] bot exited with code", code);
      botProc = null;
    });
    console.log("[wa-start] bot started (pid:", botProc.pid, ")");
  });

  return NextResponse.json({ ok: true });
}
