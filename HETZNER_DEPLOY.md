# Hetzner Deployment Guide — AG Development Platform

## Architecture Overview

```
Internet → Hetzner VPS (Nginx + SSL) → Docker (Next.js app) → Supabase (DB + Auth + Storage)
```

- **Hetzner CX22** — hosts your Next.js app (~€4/month)
- **Supabase** — handles database, auth, file storage (free)
- **Resend** — handles emails (free)
- **Nginx** — reverse proxy + SSL termination (free, on same VPS)
- **Let's Encrypt** — free SSL certificate

---

## Step 1 — Create Hetzner VPS

1. Sign up at https://hetzner.com/cloud
2. Click **New Server** and configure:
   - **Location:** Ashburn (US) or Helsinki (EU)
   - **Image:** Ubuntu 24.04
   - **Type:** CX22 (2 vCPU, 4GB RAM) — €4.35/month
   - **SSH Key:** paste your public key (`~/.ssh/id_rsa.pub`)
   - **Name:** `agdev-prod`
3. Click **Create & Buy Now**
4. Note your server's **public IP address**

---

## Step 2 — Point Your Domain to Hetzner

In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

Add these DNS records:
```
Type    Name    Value
A       @       YOUR_SERVER_IP
A       www     YOUR_SERVER_IP
```

DNS propagation takes 5–30 minutes.

---

## Step 3 — Set Up the Server

SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

Run the setup script:
```bash
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/ag-development-platform/main/server/setup.sh
# OR copy/paste the contents of server/setup.sh
bash setup.sh
```

This installs: Docker, Nginx, Node.js 20.

---

## Step 4 — Clone Your Project

```bash
# On the server
cd /var/www
git clone https://github.com/YOUR_USERNAME/ag-development-platform.git agdev
cd agdev
```

---

## Step 5 — Set Up Environment Variables

```bash
# On the server, inside /var/www/agdev
cp .env.production.example .env.production
nano .env.production
```

Fill in all your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
ADMIN_EMAIL=admin@agdevelopment.com
```

Save with: `Ctrl+X → Y → Enter`

---

## Step 6 — Configure Nginx

```bash
# Copy the Nginx config
cp /var/www/agdev/server/nginx.conf /etc/nginx/sites-available/agdevelopment

# Edit it — replace yourdomain.com with your actual domain
nano /etc/nginx/sites-available/agdevelopment

# Enable it
ln -s /etc/nginx/sites-available/agdevelopment /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # remove default site

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## Step 7 — Get SSL Certificate (Free)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP → HTTPS (option 2)

Your site will now have HTTPS! Certbot auto-renews every 90 days.

---

## Step 8 — Build and Start the App

```bash
cd /var/www/agdev

# Build Docker image and start
docker compose build
docker compose up -d

# Check it's running
docker compose ps
docker compose logs -f app
```

Visit **https://yourdomain.com** — your platform is live! 🎉

---

## Step 9 — Update Supabase Settings

In your Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://yourdomain.com`
- **Redirect URLs:** add `https://yourdomain.com/**`

---

## Deploying Updates (After Code Changes)

Whenever you push new code to GitHub, SSH into the server and run:

```bash
cd /var/www/agdev
bash server/deploy.sh
```

This pulls the latest code, rebuilds the Docker image, and restarts the container with zero config changes needed.

---

## Useful Commands

```bash
# View app logs
docker compose logs -f app

# Restart app
docker compose restart app

# Stop app
docker compose down

# Check Nginx status
systemctl status nginx

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Check SSL certificate expiry
certbot certificates

# Check server resources
htop
df -h
```

---

## Monthly Cost Summary

| Service | Cost |
|---------|------|
| Hetzner CX22 VPS | ~€4/month |
| Supabase (free tier) | $0 |
| Resend (free tier) | $0 |
| Let's Encrypt SSL | $0 |
| **Total** | **~€4/month** |

Compared to Vercel Pro ($20/month) + other services, this saves you significant money as you scale.

---

## Firewall Setup (Recommended)

```bash
# Allow only necessary ports
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
ufw status
```

---

## Backup Recommendation

Your data lives in Supabase (not on the VPS), so the VPS itself is stateless — you can rebuild it any time from your GitHub repo. Supabase has automatic daily backups on paid plans. On the free plan, export your data periodically via: **Supabase → Settings → Database → Backups**.
