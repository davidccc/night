#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT_DIR}"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but not found. Please install Node.js 20+." >&2
  exit 1
fi

npm install
npm run dev --workspace=@night-king/web
