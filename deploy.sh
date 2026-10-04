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
echo "==> Installing dependencies..."
npm install --production=false

echo "==> Installing WhatsApp bot dependencies..."
npm install whatsapp-web.js qrcode-terminal qrcode nodemailer mysql2

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

echo "==> Starting / restarting Next.js app..."
pm2 describe utsav &> /dev/null \
  && pm2 restart utsav \
  || pm2 start npm --name utsav -- start

echo "==> Starting / restarting WhatsApp bot..."
pm2 describe wa-bot &> /dev/null \
  && pm2 restart wa-bot \
  || pm2 start whatsapp-bot.js --name wa-bot

echo "==> Saving PM2 process list..."
pm2 save

echo ""
echo "==> Done."
echo "    Next.js → pm2 logs utsav"
echo "    WA Bot  → pm2 logs wa-bot"
echo ""
echo "    To auto-start on server reboot: pm2 startup"
