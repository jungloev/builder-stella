#!/bin/sh
set -e

echo "🚀 Starting Fusion Starter application..."
echo "🔍 Validating environment variables..."

# Check required environment variables for production deployment
MISSING_VARS=""

if [ -z "$SUPABASE_URL" ]; then
  MISSING_VARS="${MISSING_VARS}\n  - SUPABASE_URL"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  MISSING_VARS="${MISSING_VARS}\n  - SUPABASE_ANON_KEY"
fi

# If any required variables are missing, fail the container
if [ -n "$MISSING_VARS" ]; then
  echo "❌ ERROR: Missing required environment variables:${MISSING_VARS}"
  echo ""
  echo "For Coolify deployment, please set the following environment variables:"
  echo "  - SUPABASE_URL: Your Supabase project URL"
  echo "  - SUPABASE_ANON_KEY: Your Supabase anonymous key"
  echo ""
  echo "Optional environment variables:"
  echo "  - PORT: Server port (default: 3000)"
  echo "  - RESEND_API_KEY: Resend API key for email notifications"
  echo "  - PING_MESSAGE: Custom ping message"
  echo ""
  exit 1
fi

echo "✅ All required environment variables are set"
echo "📊 Configuration:"
echo "  - SUPABASE_URL: ${SUPABASE_URL}"
echo "  - SUPABASE_ANON_KEY: [hidden]"
echo "  - PORT: ${PORT:-3000}"
echo "  - NODE_ENV: ${NODE_ENV:-production}"

# Start the application
echo "🎯 Starting server..."
exec node dist/server/node-build.mjs
