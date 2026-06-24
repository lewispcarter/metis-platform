#!/usr/bin/env bash
# LOCAL START SCRIPT
# Purpose: Starts local infrastructure and prepares the Metis platform for development.
# Role: Gives a repeatable bootstrap path for non-manual local validation.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install Node.js 22+ and run: corepack enable"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for local PostgreSQL and Redis."
  exit 1
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Review secrets before production use."
fi

pnpm sanity:check

docker compose -f infrastructure/docker/docker-compose.yml up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm --filter @metis/api seed:demo

echo "Local foundation is ready. Run pnpm dev to start API and web apps."
