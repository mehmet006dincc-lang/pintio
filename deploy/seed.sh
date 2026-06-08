#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/scraper"
source .venv/bin/activate
set -a && source "$ROOT/.env" && set +a
python seed_all.py
