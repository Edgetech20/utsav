#!/bin/bash
set -e

echo "==> Pulling latest changes..."
git pull origin master

echo "==> Installing dependencies..."
npm install --production=false

echo "==> Installing WhatsApp bot dependencies..."
npm install whatsapp-web.js qrcode-terminal qrcode nodemailer mysql2

echo "==> Generating Prisma client..."
node node_modules/prisma/build/index.js generate

echo "==> Syncing DB schema..."
node node_modules/prisma/build/index.js db push --accept-data-loss

echo "==> Building..."
npm run build

# ── PM2 ────────────────────────────────────────────────────
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
