#!/bin/bash
set -e

echo "🚀 Starting SyncAds Python Microservice..."

# Railway injeta PORT, usar default se não existir
PORT=${PORT:-8000}

echo "✅ Using PORT: $PORT"
echo "📊 Starting Uvicorn on 0.0.0.0:$PORT"

# Executar uvicorn SEM variável, passando valor direto
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
