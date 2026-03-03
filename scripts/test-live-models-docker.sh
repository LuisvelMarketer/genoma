#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${GENOMA_IMAGE:-${CLAWDBOT_IMAGE:-genoma:local}}"
CONFIG_DIR="${GENOMA_CONFIG_DIR:-${CLAWDBOT_CONFIG_DIR:-$HOME/.genoma}}"
WORKSPACE_DIR="${GENOMA_WORKSPACE_DIR:-${CLAWDBOT_WORKSPACE_DIR:-$HOME/.genoma/workspace}}"
PROFILE_FILE="${GENOMA_PROFILE_FILE:-${CLAWDBOT_PROFILE_FILE:-$HOME/.profile}}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e GENOMA_LIVE_TEST=1 \
  -e GENOMA_LIVE_MODELS="${GENOMA_LIVE_MODELS:-${CLAWDBOT_LIVE_MODELS:-modern}}" \
  -e GENOMA_LIVE_PROVIDERS="${GENOMA_LIVE_PROVIDERS:-${CLAWDBOT_LIVE_PROVIDERS:-}}" \
  -e GENOMA_LIVE_MAX_MODELS="${GENOMA_LIVE_MAX_MODELS:-${CLAWDBOT_LIVE_MAX_MODELS:-48}}" \
  -e GENOMA_LIVE_MODEL_TIMEOUT_MS="${GENOMA_LIVE_MODEL_TIMEOUT_MS:-${CLAWDBOT_LIVE_MODEL_TIMEOUT_MS:-}}" \
  -e GENOMA_LIVE_REQUIRE_PROFILE_KEYS="${GENOMA_LIVE_REQUIRE_PROFILE_KEYS:-${CLAWDBOT_LIVE_REQUIRE_PROFILE_KEYS:-}}" \
  -v "$CONFIG_DIR":/home/node/.genoma \
  -v "$WORKSPACE_DIR":/home/node/.genoma/workspace \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"
