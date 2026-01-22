#!/bin/bash

# Test script for the cron endpoint
# Usage: ./test-cron.sh [local|production]

MODE=${1:-local}

if [ "$MODE" = "local" ]; then
  URL="http://localhost:4239/api/cron/generate-recurring-invoices"
  echo "Testing LOCAL endpoint: $URL"
else
  # Replace with your actual production URL
  URL="https://e2w-finance.vercel.app/api/cron/generate-recurring-invoices"
  echo "Testing PRODUCTION endpoint: $URL"
fi

# Read CRON_SECRET from .env.local or prompt
if [ -f .env.local ]; then
  CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
fi

if [ -z "$CRON_SECRET" ]; then
  echo "Enter CRON_SECRET:"
  read -r CRON_SECRET
fi

echo "Making request with Authorization header..."
echo ""

curl -X GET "$URL" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "Test complete!"
