#!/bin/bash
# backend/start.sh — one-shot launcher for the VEXA avatar service.
#
# Usage:
#   cd backend
#   ./start.sh
#
# Requires Python 3.11+ and pip. See backend/.env.example for required
# environment variables; the stub avatar route works with zero env configured.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .env ]; then
  echo "[start.sh] Loading backend/.env"
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs -I {} echo {} | tr '\n' ' ')
else
  echo "[start.sh] WARNING: backend/.env not found — running with process env only"
  echo "[start.sh]          Copy backend/.env.example to backend/.env to silence this."
fi

if [ -z "${NEXT_PUBLIC_APP_URL:-}" ]; then
  export NEXT_PUBLIC_APP_URL="http://localhost:3000"
  echo "[start.sh] NEXT_PUBLIC_APP_URL defaulted to $NEXT_PUBLIC_APP_URL"
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "[start.sh] ERROR: python3 is not on PATH"
  exit 1
fi

echo "[start.sh] Installing dependencies from requirements.txt..."
python3 -m pip install --upgrade pip >/dev/null
python3 -m pip install -r requirements.txt

echo "[start.sh] Starting VEXA backend on 0.0.0.0:8000 (reload)"
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
