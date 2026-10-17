#!/bin/bash
set -e

# ── MySQL ───────────────────────────────────────────────────
if ! command -v mysql &> /dev/null; then
  echo "==> Installing MySQL..."
  apt-get update -qq
  apt-get install -y mysql-server
  systemctl enable mysql
  systemctl start mysql
else
  echo "==> MySQL already installed."
  systemctl start mysql 2>/dev/null || true
fi

echo "==> Ensuring database 'priobodhi' exists..."
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS priobodhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON priobodhi.* TO 'databind'@'localhost';
FLUSH PRIVILEGES;
SQL

# ── Git ─────────────────────────────────────────────────────
echo "==> Pulling latest changes..."
git stash 2>/dev/null || true
git pull origin master

# ── Node deps ───────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "==> Installing dependencies..."
  npm install --production=false

  echo "==> Installing WhatsApp bot dependencies..."
  npm install whatsapp-web.js qrcode-terminal qrcode nodemailer mysql2
else
  echo "==> node_modules already present, skipping install."
fi

# ── Prisma ──────────────────────────────────────────────────
echo "==> Generating Prisma client..."
node node_modules/prisma/build/index.js generate

echo "==> Syncing DB schema..."
node node_modules/prisma/build/index.js db push --accept-data-loss

# ── Build ───────────────────────────────────────────────────
echo "==> Building..."
npm run build

# ── PM2 ─────────────────────────────────────────────────────
if ! command -v pm2 &> /dev/null; then
  echo "==> Installing PM2 globally..."
  npm install -g pm2
fi

# Clean up old separate wa-bot processes if they exist
pm2 delete wa-bot 2>/dev/null || true
pm2 delete wa-bot-utsav 2>/dev/null || true

echo "==> Starting / restarting combined server (Next.js + WA bot)..."
if pm2 describe utsav &> /dev/null; then
  pm2 restart utsav
else
  NODE_OPTIONS="--max-old-space-size=256" \
  pm2 start utsav-start.js --name utsav \
    --max-memory-restart 700M
fi

echo "==> Saving PM2 process list..."
pm2 save

echo ""
echo "==> Done."
echo "    Logs → pm2 logs utsav"
echo ""
echo "    To auto-start on server reboot: pm2 startup"
