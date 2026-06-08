#!/usr/bin/env bash
# Pintio VPS kurulum — Faz 3'ten itibaren ( .env hazır olmalı )
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Hata: $ROOT/.env yok. Önce: cp .env.example .env && şifreleri düzenle"
  exit 1
fi

set -a
source .env
set +a

echo "=== 1/6 Docker (Postgres + Redis) ==="
docker compose up -d
echo "DB hazır olana kadar bekleniyor..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "=== 2/6 Migration (multi-store) ==="
if [[ -f backend/db/migrations/002_multi_store.sql ]]; then
  docker compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
    < backend/db/migrations/002_multi_store.sql || true
fi

echo "=== 3/6 Backend build ==="
cp .env backend/.env
cd backend
npm ci
npm run build
cd "$ROOT"

echo "=== 4/6 PM2 API ==="
if command -v pm2 >/dev/null; then
  pm2 delete pintio-api 2>/dev/null || true
  pm2 start backend/dist/main.js --name pintio-api
  pm2 save
else
  echo "PM2 yok — API: cd backend && node dist/main.js"
fi

echo "=== 5/6 Scraper venv + worker ==="
cd scraper
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt curl_cffi
cd "$ROOT"

if command -v systemctl >/dev/null && [[ -f deploy/pintio-worker.service ]]; then
  echo "Worker systemd kurulumu için: sudo cp deploy/pintio-worker.service /etc/systemd/system/ && sudo systemctl enable --now pintio-worker"
else
  echo "Worker (manuel): cd scraper && source .venv/bin/activate && python worker.py"
fi

echo "=== 6/6 Health check ==="
sleep 2
curl -sf "http://127.0.0.1:${API_PORT:-3000}/" && echo "" || echo "API henüz yanıt vermiyor — pm2 logs pintio-api"

echo ""
echo "Tamam! Sırada: Nginx + certbot (deploy/nginx-api.conf) ve EXPO_PUBLIC_API_URL=${API_URL}"
