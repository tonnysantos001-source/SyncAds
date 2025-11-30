#!/bin/bash
echo "=== AUDITORIA DE INVENTÁRIO ==="
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Railway Services
echo "1. Railway Python Services:"
curl -s https://syncads-python-microservice-production.up.railway.app/health | python -m json.tool 2>/dev/null || echo "Service unreachable"
echo ""

# Supabase Edge Functions
echo "2. Supabase Edge Functions:"
echo "Listando funções deployadas..."
ls -la ../supabase/functions/ 2>/dev/null | grep "^d" | awk '{print $NF}' | grep -v "^\." | head -20
echo ""

# Frontend Routes
echo "3. Frontend Vercel:"
curl -s https://syncads.vercel.app -I | head -5
echo ""

echo "=== INVENTÁRIO CONCLUÍDO ==="
