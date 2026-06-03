#!/bin/sh
set -e

# Make sure runtime-writable dirs exist (these are backed by volumes in prod)
mkdir -p logs uploads reports/generated

echo "⏳ Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

echo "🚀 Starting AquaMind backend..."
exec node dist/index.js
