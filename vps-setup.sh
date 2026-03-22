#!/bin/bash
# ============================================================
# HALLOFRESH — VPS First-Time Setup
# Run this ONCE directly on the VPS via SSH:
#   ssh root@187.124.40.104
#   bash vps-setup.sh
# ============================================================

set -e

echo "=============================="
echo " HALLOFRESH — VPS Setup"
echo " Ubuntu 24.04 LTS"
echo "=============================="

# Update system
echo "[1/5] Updating system packages..."
apt update && apt upgrade -y
echo "✅ System updated"

# Install nginx
echo ""
echo "[2/5] Installing nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
echo "✅ Nginx installed and running"

# Install Node.js 20 (LTS)
echo ""
echo "[3/5] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version
echo "✅ Node.js installed"

# Create app directory
echo ""
echo "[4/5] Creating app directory..."
mkdir -p /var/www/hallofresh/dist
chown -R www-data:www-data /var/www/hallofresh
chmod -R 755 /var/www/hallofresh
echo "✅ Directory created"

# Open firewall ports
echo ""
echo "[5/5] Configuring firewall..."
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS (for future domain + SSL)
ufw --force enable
echo "✅ Firewall configured"

echo ""
echo "============================================"
echo " ✅ VPS SETUP COMPLETE!"
echo " Next: Run deploy.sh from your local machine"
echo "============================================"
