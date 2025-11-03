#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${ROOT_DIR}/apps/server"
VENV_DIR="${ROOT_DIR}/.venv"

# Free port 8000 if occupied
if command -v lsof >/dev/null 2>&1; then
  pids=$(lsof -ti tcp:8000 || true)
  if [ -n "$pids" ]; then
    echo "Stopping processes on port 8000: $pids"
    kill $pids 2>/dev/null || true
  fi
fi

# Load .env for local development (Railway 部署請改在儀表板設定環境變數)
if [ -f "${ROOT_DIR}/.env" ]; then
  eval "$(python3 - <<'PY'
import os
import shlex
from dotenv import dotenv_values

env_path = os.environ['ENV_PATH']
values = dotenv_values(env_path)
for key, value in values.items():
    if value is None or value == "":
        continue
    print(f"export {key}={shlex.quote(value)}")
PY
)" ENV_PATH="${ROOT_DIR}/.env"
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but not found. Please install Python 3.12+" >&2
  exit 1
fi

if [ ! -d "${VENV_DIR}" ]; then
  python3 -m venv "${VENV_DIR}"
fi

# shellcheck source=/dev/null
source "${VENV_DIR}/bin/activate"

python -m pip install --upgrade pip
python -m pip install -r "${APP_DIR}/requirements.txt"

cd "${APP_DIR}"

python manage.py migrate --noinput --fake-initial
python manage.py runserver 0.0.0.0:8000
