#!/usr/bin/env bash
set -euo pipefail

cd /repo

export GENOMA_STATE_DIR="/tmp/genoma-test"
export GENOMA_CONFIG_PATH="${GENOMA_STATE_DIR}/genoma.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${GENOMA_STATE_DIR}/credentials"
mkdir -p "${GENOMA_STATE_DIR}/agents/main/sessions"
echo '{}' >"${GENOMA_CONFIG_PATH}"
echo 'creds' >"${GENOMA_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${GENOMA_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm genoma reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${GENOMA_CONFIG_PATH}"
test ! -d "${GENOMA_STATE_DIR}/credentials"
test ! -d "${GENOMA_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${GENOMA_STATE_DIR}/credentials"
echo '{}' >"${GENOMA_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm genoma uninstall --state --yes --non-interactive

test ! -d "${GENOMA_STATE_DIR}"

echo "OK"
