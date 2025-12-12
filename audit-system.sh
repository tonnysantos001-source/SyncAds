#!/bin/bash

# ============================================
# SCRIPT DE AUDITORIA COMPLETA - SYNCADS
# Executa todos os testes de verificação
# ============================================

set -e

echo "=========================================="
echo "🔍 AUDITORIA COMPLETA - SYNCADS"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# ==========================================
# 1. VERIFICAR RAILWAY STATUS
# ==========================================
echo ""
echo "🚂 [1/6] Verificando Railway..."
echo "------------------------------------------"

if command -v railway &> /dev/null; then
    echo "✅ Railway CLI instalado"
    railway status || echo "⚠️  Railway status falhou"
else
    echo "❌ Railway CLI não encontrado"
    echo "   Instale: npm i -g @railway/cli"
fi

# ==========================================
# 2. TESTAR PYTHON SERVICE HEALTH
# ==========================================
echo ""
echo "🏥 [2/6] Testando Python Service Health..."
echo "------------------------------------------"

RAILWAY_URL=$(railway variables --json | grep -o '"RAILWAY_STATIC_URL":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$RAILWAY_URL" ]; then
    echo "⚠️  URL da Railway não encontrada"
    echo "   Execute: railway variables"
else
    echo "🔗 URL: $RAILWAY_URL"
    
    # Testar health endpoint
    if curl -f -s "${RAILWAY_URL}/health" > /dev/null; then
        echo "✅ Health endpoint OK"
        curl -s "${RAILWAY_URL}/health" | python -m json.tool
    else
        echo "❌ Health endpoint falhou"
    fi
fi

# ==========================================
# 3. TESTAR BIBLIOTECAS PYTHON
# ==========================================
echo ""
echo "📦 [3/6] Testando Bibliotecas Python..."
echo "------------------------------------------"

if [ -f "python-service/test_libraries.py" ]; then
    echo "🧪 Executando teste de bibliotecas via Railway..."
    railway run python python-service/test_libraries.py || echo "⚠️  Alguns testes falharam"
else
    echo "⚠️  Script test_libraries.py não encontrado"
fi

# ==========================================
# 4. VERIFICAR EXTENSÃO CHROME
# ==========================================
echo ""
echo "🔌 [4/6] Verificando Extensão Chrome..."
echo "------------------------------------------"

if [ -f "chrome-extension/manifest.json" ]; then
    VERSION=$(grep '"version"' chrome-extension/manifest.json | head -1 | cut -d'"' -f4)
    echo "✅ Extensão encontrada"
    echo "   Versão: $VERSION"
    echo "   Manifest: chrome-extension/manifest.json"
    
    # Verificar tamanho dos arquivos principais
    echo ""
    echo "📊 Tamanho dos arquivos:"
    echo "   background.js:     $(wc -c < chrome-extension/background.js | numfmt --to=iec)B"
    echo "   content-script.js: $(wc -c < chrome-extension/content-script.js | numfmt --to=iec)B"
    echo "   sidepanel.js:      $(wc -c < chrome-extension/sidepanel.js | numfmt --to=iec)B"
else
    echo "❌ Extensão não encontrada"
fi

# ==========================================
# 5. VERIFICAR SUPABASE FUNCTIONS
# ==========================================
echo ""
echo "⚡ [5/6] Verificando Supabase Edge Functions..."
echo "------------------------------------------"

if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI instalado"
    
    if [ -d "supabase/functions" ]; then
        echo ""
        echo "📁 Edge Functions encontradas:"
        ls -1 supabase/functions/ | grep -v "^_" | while read func; do
            echo "   • $func"
        done
    else
        echo "⚠️  Diretório supabase/functions não encontrado"
    fi
else
    echo "❌ Supabase CLI não encontrado"
    echo "   Instale: npm i -g supabase"
fi

# ==========================================
# 6. VERIFICAR VARIÁVEIS DE AMBIENTE
# ==========================================
echo ""
echo "🔐 [6/6] Verificando Variáveis de Ambiente..."
echo "------------------------------------------"

# Verificar arquivo .env
if [ -f ".env" ]; then
    echo "✅ Arquivo .env encontrado"
    
    # Verificar variáveis críticas (sem mostrar valores)
    vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "OPENAI_API_KEY" "ANTHROPIC_API_KEY" "GROQ_API_KEY" "PYTHON_SERVICE_URL")
    
    for var in "${vars[@]}"; do
        if grep -q "^${var}=" .env; then
            echo "   ✅ $var"
        else
            echo "   ❌ $var (não encontrado)"
        fi
    done
else
    echo "❌ Arquivo .env não encontrado"
fi

# ==========================================
# RESUMO FINAL
# ==========================================
echo ""
echo "=========================================="
echo "📋 AUDITORIA CONCLUÍDA"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Revisar logs acima para erros"
echo "2. Testar comandos DOM manualmente"
echo "3. Verificar problema DOM no painel do usuário"
echo "4. Consultar implementation_plan.md para mais detalhes"
echo ""
echo "=========================================="
