#!/usr/bin/env bash
# One-time provisioning for a fresh Ubuntu EC2 instance.
#
#   sudo bash deploy/setup-ec2.sh
#
# Installs Node.js, nginx, and the Shelf systemd service. Safe to re-run —
# every step checks before it acts. This does NOT build or start the app;
# run deploy/deploy.sh (as ubuntu, not root) for that.
set -euo pipefail

NODE_MAJOR=22
APP_USER=ubuntu
APP_DIR="/home/${APP_USER}/shelf"
REPO_URL="https://github.com/bartingei/shelf.git"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "This script needs root. Re-run: sudo bash deploy/setup-ec2.sh" >&2
  exit 1
fi

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

say "Updating apt"
apt-get update -qq

say "Installing base packages"
apt-get install -y -qq curl ca-certificates git nginx

# --- swap ------------------------------------------------------------------
# `next build` regularly peaks above 1GB. On a t2/t3.micro (1GB RAM, no swap
# by default) the build is killed by the OOM reaper partway through, which
# surfaces as a bare "Killed" with no other explanation. A swapfile makes the
# build slow rather than impossible.
TOTAL_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [[ "$TOTAL_MB" -lt 2048 ]] && ! swapon --show | grep -q .; then
  say "Only ${TOTAL_MB}MB RAM and no swap — creating a 2GB swapfile"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  say "Swap check: ${TOTAL_MB}MB RAM, swap already present or not needed"
fi

# --- node ------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -c2- | cut -d. -f1)" -lt 18 ]]; then
  say "Installing Node.js ${NODE_MAJOR}.x from NodeSource"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
else
  say "Node.js $(node -v) already installed"
fi

# --- source ----------------------------------------------------------------
if [[ ! -d "$APP_DIR/.git" ]]; then
  say "Cloning the repo to ${APP_DIR}"
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
else
  say "Repo already present at ${APP_DIR}"
fi

# --- env file --------------------------------------------------------------
ENV_FILE="${APP_DIR}/pdf-platform/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  say "Seeding ${ENV_FILE} from .env.example"
  sudo -u "$APP_USER" cp "${APP_DIR}/pdf-platform/.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  NEEDS_ENV=1
else
  chmod 600 "$ENV_FILE"
  NEEDS_ENV=0
fi

# --- systemd ---------------------------------------------------------------
say "Installing the shelf systemd service"
install -m 644 "${HERE}/shelf.service" /etc/systemd/system/shelf.service
systemctl daemon-reload
systemctl enable shelf >/dev/null

# --- nginx -----------------------------------------------------------------
say "Configuring nginx"
install -m 644 "${HERE}/nginx-shelf.conf" /etc/nginx/sites-available/shelf
ln -sf /etc/nginx/sites-available/shelf /etc/nginx/sites-enabled/shelf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

say "Provisioning done"
cat <<NEXT

Next steps (as the ${APP_USER} user, NOT root):

  1. Fill in your secrets:
       nano ${ENV_FILE}

     These must be set before you build — NEXT_PUBLIC_* values are baked
     into the JavaScript bundle at build time, not read at runtime:

       NEXT_PUBLIC_SITE_URL="http://<your-ip-or-domain>"
       BETTER_AUTH_URL="http://<your-ip-or-domain>"
       NEXT_PUBLIC_BETTER_AUTH_URL="http://<your-ip-or-domain>"
       BETTER_AUTH_SECRET="\$(openssl rand -base64 32)"
       DATABASE_URL / DIRECT_URL   (your Postgres)
       NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY

  2. Build and start:
       bash ${APP_DIR}/deploy/deploy.sh

  3. Make sure the instance's security group allows inbound TCP 80.

NEXT
if [[ "$NEEDS_ENV" -eq 1 ]]; then
  echo "NOTE: .env was just created from the example and is all placeholders."
fi
