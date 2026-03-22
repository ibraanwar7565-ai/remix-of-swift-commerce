#!/bin/bash
# ============================================================
# HALLOFRESH — VPS Deploy Script
# Server: 187.124.40.104 (Hostinger KVM4, Ubuntu 24.04)
# Run this from your LOCAL machine inside the project folder
# Usage: bash deploy.sh
# ============================================================

set -e

VPS_IP="187.124.40.104"
VPS_USER="root"
APP_DIR="/var/www/hallofresh"
DIST_DIR="./dist"

echo "=============================="
echo " HALLOFRESH — Deploying to VPS"
echo " Server: $VPS_IP"
echo "=============================="

# Step 1: Build the app locally
echo ""
echo "[1/4] Building app..."
npm run build
echo "✅ Build complete"

# Step 2: Create app directory on VPS
echo ""
echo "[2/4] Preparing VPS directory..."
ssh $VPS_USER@$VPS_IP "mkdir -p $APP_DIR"
echo "✅ Directory ready"

# Step 3: Upload dist folder to VPS
echo ""
echo "[3/4] Uploading files to VPS..."
rsync -avz --delete $DIST_DIR/ $VPS_USER@$VPS_IP:$APP_DIR/dist/
echo "✅ Files uploaded"

# Step 4: Configure nginx (first deploy only)
echo ""
echo "[4/4] Configuring nginx..."
rsync -avz ./nginx.conf $VPS_USER@$VPS_IP:/etc/nginx/sites-available/hallofresh

ssh $VPS_USER@$VPS_IP "
  # Enable site
  ln -sf /etc/nginx/sites-available/hallofresh /etc/nginx/sites-enabled/hallofresh

  # Remove default nginx site if exists
  rm -f /etc/nginx/sites-enabled/default

  # Test nginx config
  nginx -t

  # Reload nginx
  systemctl reload nginx

  echo '✅ Nginx configured and reloaded'
"

echo ""
echo "============================================"
echo " ✅ DEPLOYMENT COMPLETE!"
echo " 🌐 App is live at: http://$VPS_IP"
echo "============================================"
