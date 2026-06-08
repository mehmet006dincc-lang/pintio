#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/scraper"
[[ -d .venv ]] || python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt curl_cffi
set -a && source "$ROOT/.env" && set +a
python worker.py
