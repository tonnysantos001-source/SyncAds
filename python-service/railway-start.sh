#!/bin/bash
# ============================================
# SYNCADS PYTHON MICROSERVICE - RAILWAY START
# ============================================

set -e  # Exit on error

echo "🚀 Starting SyncAds Python Microservice on Railway..."

# Verificar se PORT está definido
if [ -z "$PORT" ]; then
    echo "⚠️  PORT não definido, usando padrão 8000"
    PORT=8000
fi

echo "📡 Port: $PORT"
echo "🌐 Host: 0.0.0.0"
echo "🔧 Workers: ${WORKERS:-2}"

# Iniciar uvicorn
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "$PORT" \
    --workers "${WORKERS:-2}" \
    --log-level info \
    --no-access-log
