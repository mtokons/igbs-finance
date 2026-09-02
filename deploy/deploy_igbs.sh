#!/usr/bin/env bash
#
# Deploy IGBS Finance to the VPS (Docker + the host's existing Caddy).
#
# Prerequisites (one-time):
#   1. DNS: A record for igbs.mysccg.de -> VPS public IP.
#   2. On the server: create $REMOTE_DIR/deploy/.env.igbs from deploy/.env.igbs.example
#      and set a strong NEXTAUTH_SECRET.
#   3. Append deploy/Caddyfile.igbs to the server Caddyfile and reload Caddy.
#   4. SSH key access to the VPS from this machine.
#
# Usage (Git Bash):
#   VPS_USER=ubuntu ./deploy/deploy_igbs.sh
#
set -euo pipefail

VPS_HOST="${VPS_HOST:-158.180.45.36}"
VPS_USER="${VPS_USER:-ubuntu}"
REMOTE_DIR="${REMOTE_DIR:-/opt/igbs-finance}"
SSH_KEY="${SSH_KEY:-}"                 # optional path to a private key
SSH_OPTS=""
[ -n "$SSH_KEY" ] && SSH_OPTS="-i $SSH_KEY"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/igbs-deploy-XXXX")"
TARBALL="${STAGE}.tar.gz"

cleanup() { rm -rf "$STAGE" "$TARBALL"; }
trap cleanup EXIT

echo "📦 Staging source (excluding node_modules/.next/.env/*.db) ..."
# Stream-copy source out of the OneDrive folder to avoid the sync-race on reads.
tar --exclude='./node_modules' --exclude='./.next' --exclude='./build_output' \
    --exclude='./.git' --exclude='./*.db' --exclude='./*.db-journal' --exclude='./.env' \
    -C "$APP_DIR" -cf - . | tar -C "$STAGE" -xf -

echo "📦 Packing tarball ..."
tar -C "$STAGE" -czf "$TARBALL" .

echo "📂 Uploading to ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR} ..."
ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "mkdir -p '${REMOTE_DIR}'"
scp $SSH_OPTS "$TARBALL" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/src.tar.gz"

echo "🚀 Building & starting the container on the server ..."
ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" bash -s <<EOF
set -euo pipefail
cd "${REMOTE_DIR}"
tar -xzf src.tar.gz && rm -f src.tar.gz
if [ ! -f deploy/.env.igbs ]; then
  echo "❌ Missing ${REMOTE_DIR}/deploy/.env.igbs — copy deploy/.env.igbs.example and set NEXTAUTH_SECRET."
  exit 1
fi
docker compose --env-file deploy/.env.igbs up -d --build
EOF

echo "🩺 Health check (expect 200) ..."
sleep 6
CODE="\$(ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:3010/login" || echo 000)"
echo "   /login -> ${CODE}"

echo "✅ Deployed. Once Caddy + DNS are set, the site is live at:"
echo "   https://igbs.mysccg.de"
