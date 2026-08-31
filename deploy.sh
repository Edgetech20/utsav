#!/bin/bash
set -e

echo "==> Pulling latest changes..."
git pull origin master

echo "==> Installing dependencies..."
npm install --production=false

echo "==> Building..."
npm run build

echo "==> Restarting app..."
if command -v pm2 &> /dev/null; then
  pm2 describe utsav &> /dev/null && pm2 restart utsav || pm2 start npm --name utsav -- start
else
  echo "PM2 not found. Install it: npm i -g pm2"
  echo "Then run: pm2 start npm --name utsav -- start"
  exit 1
fi

echo "==> Done. App is running via PM2 (name: utsav)"
