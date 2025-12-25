#!/bin/bash
# Upload Environment Variables to Vercel
# Usage: bash upload-env-to-vercel.sh

echo "🚀 Uploading Environment Variables to Vercel..."
echo ""

# Check if .env.vercel exists
if [ ! -f .env.vercel ]; then
    echo "❌ Error: .env.vercel file not found!"
    exit 1
fi

# Read variables from .env.vercel and upload to Vercel
echo "📤 Setting DATABASE_URL..."
vercel env add DATABASE_URL production < <(grep "^DATABASE_URL=" .env.vercel | cut -d'"' -f2)

echo "📤 Setting NEXTAUTH_URL..."
vercel env add NEXTAUTH_URL production < <(grep "^NEXTAUTH_URL=" .env.vercel | cut -d'"' -f2)

echo "📤 Setting NEXTAUTH_SECRET..."
vercel env add NEXTAUTH_SECRET production < <(grep "^NEXTAUTH_SECRET=" .env.vercel | cut -d'"' -f2)

echo "📤 Setting ADMIN_PASSWORD_HASH..."
vercel env add ADMIN_PASSWORD_HASH production < <(grep "^ADMIN_PASSWORD_HASH=" .env.vercel | cut -d'"' -f2)

echo ""
echo "✅ All environment variables uploaded!"
echo ""
echo "🔄 Redeploy your application:"
echo "   vercel --prod"
