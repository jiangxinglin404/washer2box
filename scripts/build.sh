#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Set CI env for pnpm in non-interactive environments
export CI=true

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

# Pre-install serve for deployment runtime (avoid npx timeout)
echo "Installing serve for production..."
pnpm add -D serve

echo "Building frontend with Vite..."
pnpm vite build
