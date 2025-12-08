#!/bin/bash
set -e

# ============================================
# SYNCADS PYTHON SERVICE - START SCRIPT
# Garante que PORT seja lida corretamente
# ============================================

echo "🚀 Starting SyncAds Python Microservice..."

# Ler PORT do ambiente ou usar default
if [ -z "$PORT" ]; then
    export PORT=8000
    echo "⚠️  PORT not set, using default: 8000"
else
    echo "✅ PORT set to: $PORT"
fi

# Log environment
echo "📊 Environment:"
echo "   - Python: $(python --version)"
echo "   - Workers: 1"
echo "   - Host: 0.0.0.0"
echo "   - Port: $PORT"

# Start uvicorn with expanded PORT
echo "🔥 Starting Uvicorn..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "$PORT" \
    --workers 1 \
    --log-level info
