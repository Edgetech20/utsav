import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req); if (deny) return deny;
  const cwd = process.cwd();
  const botPath = path.join(cwd, "whatsapp-bot.js");

  // Node's child_process inherits a stripped PATH — add common npm global bin dirs
  const extraPath = [
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
    "/root/.npm-global/bin",
    "/root/.nvm/versions/node/*/bin",
    `${process.env.HOME ?? "/root"}/.npm-global/bin`,
  ].join(":");

  const env = {
    ...process.env,
    PATH: `${process.env.PATH ?? ""}:${extraPath}`,
  };

  const cmd = `pm2 describe wa-bot > /dev/null 2>&1 && pm2 restart wa-bot || pm2 start "${botPath}" --name wa-bot`;

  exec(cmd, { cwd, env }, (err, stdout, stderr) => {
    if (err) console.error("[wa-start] exec error:", err.message);
    if (stdout) console.log("[wa-start] stdout:", stdout);
    if (stderr) console.error("[wa-start] stderr:", stderr);
  });

  return NextResponse.json({ ok: true });
}
