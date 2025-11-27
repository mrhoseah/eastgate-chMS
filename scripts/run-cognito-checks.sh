#!/usr/bin/env bash
set -euo pipefail

# Combined Cognito diagnostics
# Usage: ./scripts/run-cognito-checks.sh EMAIL PASSWORD
# If EMAIL/PASSWORD are not provided, the script will prompt for them.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS="$ROOT_DIR/tmp/cognito-check-results-$(date +%s).log"
mkdir -p "$ROOT_DIR/tmp"

usage() {
  echo "Usage: $0 EMAIL PASSWORD"
  echo "If you omit args the script will prompt interactively."
}

EMAIL="${1:-}" && PASSWORD="${2:-}"
if [ -z "$EMAIL" ]; then
  read -rp "Cognito username (email): " EMAIL
fi
if [ -z "$PASSWORD" ]; then
  read -rsp "Password (input hidden): " PASSWORD
  echo
fi

echo "Running combined Cognito checks" | tee "$RESULTS"
echo "Results written to: $RESULTS" | tee -a "$RESULTS"

echo "\n=== ENV SUMMARY ===" | tee -a "$RESULTS"
echo "PWD: $(pwd)" | tee -a "$RESULTS"
echo "Node: $(node --version 2>/dev/null || echo 'node N/A')" | tee -a "$RESULTS"
echo "NPM: $(npm --version 2>/dev/null || echo 'npm N/A')" | tee -a "$RESULTS"

# Load CLIENT_ID from .env if present
if [ -f "$ROOT_DIR/.env" ]; then
  CLIENT_ID=$(grep -E '^COGNITO_CLIENT_ID=' "$ROOT_DIR/.env" | head -n1 | cut -d'=' -f2- || true)
fi
CLIENT_ID=${CLIENT_ID:-"<not-set>"}
echo "COGNITO_CLIENT_ID: $CLIENT_ID" | tee -a "$RESULTS"

REGION=${COGNITO_REGION:-af-south-1}
ENDPOINT="cognito-idp.${REGION}.amazonaws.com"
URL="https://$ENDPOINT/"

echo "\n=== DNS / connectivity ===" | tee -a "$RESULTS"
if command -v dig >/dev/null 2>&1; then
  echo "dig +short $ENDPOINT" | tee -a "$RESULTS"
  dig +short "$ENDPOINT" 2>&1 | tee -a "$RESULTS" || true
else
  echo "nslookup $ENDPOINT (nslookup may not be installed)" | tee -a "$RESULTS"
  if command -v nslookup >/dev/null 2>&1; then
    nslookup "$ENDPOINT" 2>&1 | tee -a "$RESULTS" || true
  else
    echo "nslookup not available" | tee -a "$RESULTS"
  fi
fi

echo "\n=== Ping (may be blocked) ===" | tee -a "$RESULTS"
ping -c 4 "$ENDPOINT" 2>&1 | tee -a "$RESULTS" || true

echo "\n=== CURL: Direct InitiateAuth POST ===" | tee -a "$RESULTS"
if [ "$CLIENT_ID" = "<not-set>" ]; then
  echo "COGNITO_CLIENT_ID not found in .env; please set or pass it in .env" | tee -a "$RESULTS"
else
  CURL_BODY=$(cat <<EOF
{"AuthFlow":"USER_PASSWORD_AUTH","ClientId":"$CLIENT_ID","AuthParameters":{"USERNAME":"$EMAIL","PASSWORD":"$PASSWORD"}}
EOF
)
  echo "curl -> $URL" | tee -a "$RESULTS"
  # Use --max-time 15 to avoid long hangs
  curl -sS -v -X POST "$URL" \
    -H 'X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth' \
    -H 'Content-Type: application/x-amz-json-1.1' \
    -d "$CURL_BODY" --max-time 15 2>&1 | tee -a "$RESULTS" || echo "curl failed or timed out" | tee -a "$RESULTS"
fi

echo "\n=== Node undici fetch test (scripts/test-cognito-undici.mjs) ===" | tee -a "$RESULTS"
if command -v node >/dev/null 2>&1; then
  node --version 2>&1 | tee -a "$RESULTS"
  node "$ROOT_DIR/scripts/test-cognito-undici.mjs" 2>&1 | tee -a "$RESULTS" || echo "node test script failed" | tee -a "$RESULTS"
else
  echo "node not installed in this environment. Install Node and rerun." | tee -a "$RESULTS"
fi

echo "\n=== Last auth-errors.json entries (tail 40) ===" | tee -a "$RESULTS"
if [ -f "$ROOT_DIR/auth-errors.json" ]; then
  tail -n 40 "$ROOT_DIR/auth-errors.json" 2>&1 | tee -a "$RESULTS" || true
else
  echo "auth-errors.json not found" | tee -a "$RESULTS"
fi

echo "\n=== Done. Results file: $RESULTS ===" | tee -a "$RESULTS"

exit 0
