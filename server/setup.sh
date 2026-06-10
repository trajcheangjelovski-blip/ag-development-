#!/bin/bash
# Run this on your Hetzner server as root
# ssh root@YOUR_SERVER_IP
# then: bash setup.sh

set -e

echo "=== Updating system ==="
apt update && apt upgrade -y

echo "=== Installing Docker ==="
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== Installing Nginx ==="
apt install -y nginx certbot python3-certbot-nginx

echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== Creating app directory ==="
mkdir -p /var/www/agdev
useradd -m -s /bin/bash deploy || true

echo "=== Enabling services ==="
systemctl enable docker
systemctl enable nginx
systemctl start docker
systemctl start nginx

echo ""
echo "=== Setup complete! ==="
echo "Next: upload your project and run deploy.sh"
