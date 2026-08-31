#!/usr/bin/env bash
# Build and (re)start Shelf. Run as the ubuntu user, from the repo:
#
#   bash ~/shelf/deploy/deploy.sh          # build + restart
#   bash ~/shelf/deploy/deploy.sh --pull   # also git pull first
#
# Re-run this after every code change or .env edit.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$HERE")"
APP_DIR="${REPO_DIR}/pdf-platform"
PULL=0
[[ "${1:-}" == "--pull" ]] && PULL=1

if [[ $EUID -eq 0 ]]; then
  echo "Run this as the ubuntu user, not root — building as root leaves" >&2
  echo "root-owned files in node_modules/ and .next/ that the service" >&2
  echo "(which runs as ubuntu) then can't read." >&2
  exit 1
fi

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "Missing ${APP_DIR}/.env — copy .env.example and fill it in first." >&2
  exit 1
fi

# A build that inherits placeholder URLs bakes them into the client bundle and
# silently breaks sign-in, so fail loudly here instead of at runtime.
if grep -q 'localhost:3000' .env; then
  echo "WARNING: .env still points at localhost:3000." >&2
  echo "NEXT_PUBLIC_SITE_URL, BETTER_AUTH_URL and NEXT_PUBLIC_BETTER_AUTH_URL" >&2
  echo "are compiled into the bundle — set them to your public URL, or sign-in" >&2
  echo "will redirect users to localhost." >&2
  read -rp "Continue anyway? [y/N] " reply
  [[ "$reply" == "y" || "$reply" == "Y" ]] || exit 1
fi

if [[ "$PULL" -eq 1 ]]; then
  say "Pulling latest code"
  git -C "$REPO_DIR" pull --ff-only
fi

say "Installing dependencies"
# npm ci is the reproducible install; fall back to npm install if the lockfile
# has drifted out of sync with package.json.
npm ci --no-audit --no-fund || npm install --no-audit --no-fund

say "Applying database migrations"
# migrate deploy (not migrate dev) — it only applies existing migrations and
# never prompts, resets, or generates new ones.
npx prisma migrate deploy

say "Building"
# Cap the heap so a small instance swaps instead of getting OOM-killed.
NODE_OPTIONS="--max-old-space-size=1536" npm run build

say "Restarting the service"
sudo systemctl restart shelf
sleep 3
sudo systemctl --no-pager --lines=15 status shelf || true

say "Done"
echo "Logs:   sudo journalctl -u shelf -f"
echo "Local:  curl -I http://127.0.0.1:3000"
