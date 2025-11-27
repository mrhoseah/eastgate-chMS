#!/usr/bin/env bash
set -euo pipefail

# Simple network checks for Cognito endpoint
REGION=${COGNITO_REGION:-af-south-1}
ENDPOINT="cognito-idp.${REGION}.amazonaws.com"
URL="https://${ENDPOINT}/"

echo "Cognito region: ${REGION}"
echo "Endpoint URL: ${URL}"

echo "\n1) DNS lookup"
if command -v dig >/dev/null 2>&1; then
  dig +short ${ENDPOINT} || true
else
  nslookup ${ENDPOINT} || true
fi

echo "\n2) Ping (may be blocked but worth trying)"
ping -c 4 ${ENDPOINT} || true

echo "\n3) Curl verbose POST request (will attempt a simple InitiateAuth call)"
curl -v -X POST "$URL" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -H "Content-Type: application/x-amz-json-1.1" \
  -d '{}' \
  --max-time 10 || true

echo "\nDone. Review the output for timeouts, DNS failures, or HTTP error responses."
