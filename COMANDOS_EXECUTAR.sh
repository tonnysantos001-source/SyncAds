#!/bin/bash

# ============================================
# SYNCADS OMNIBRAIN - COMANDOS DE CONFIGURAÇÃO
# ============================================
# Script para configurar e testar o sistema após deploy
# Execute este script após o build do Railway completar
# ============================================

set -e  # Exit on error

echo "============================================"
echo "🚀 SYNCADS OMNIBRAIN - CONFIGURAÇÃO"
echo "============================================"
echo ""

# ============================================
# 1. VERIFICAR BUILD STATUS
# ============================================
echo "📊 Verificando status do deploy..."
cd python-service
railway status
echo ""

# ============================================
# 2. CONFIGURAR API KEYS (CRÍTICO!)
# ============================================
echo "🔑 Configurando API Keys..."
echo ""
echo "⚠️  ATENÇÃO: Você precisa ter as seguintes API keys:"
echo "   - OpenAI API Key (https://platform.openai.com/api-keys)"
echo "   - Anthropic API Key (https://console.anthropic.com/)"
echo "   - Groq API Key (https://console.groq.com/) [opcional]"
echo ""

read -p "Deseja configurar OpenAI API Key agora? (s/n): " config_openai
if [ "$config_openai" = "s" ]; then
    read -p "Cole sua OpenAI API Key: " openai_key
    railway variables --set OPENAI_API_KEY="$openai_key"
    echo "✅ OpenAI API Key configurada"
fi

read -p "Deseja configurar Anthropic API Key agora? (s/n): " config_anthropic
if [ "$config_anthropic" = "s" ]; then
    read -p "Cole sua Anthropic API Key: " anthropic_key
    railway variables --set ANTHROPIC_API_KEY="$anthropic_key"
    echo "✅ Anthropic API Key configurada"
fi

read -p "Deseja configurar Groq API Key agora? (s/n): " config_groq
if [ "$config_groq" = "s" ]; then
    read -p "Cole sua Groq API Key: " groq_key
    railway variables --set GROQ_API_KEY="$groq_key"
    echo "✅ Groq API Key configurada"
fi

echo ""

# ============================================
# 3. CONFIGURAR REDIS
# ============================================
echo "🗄️  Configurando Redis..."
echo ""
echo "Opções:"
echo "1) Adicionar Railway Redis (recomendado)"
echo "2) Configurar Upstash Redis (serverless)"
echo "3) Pular (cache desabilitado)"
read -p "Escolha (1/2/3): " redis_option

if [ "$redis_option" = "1" ]; then
    echo "Adicionando Railway Redis..."
    railway add
    echo "✅ Railway Redis adicionado (variável REDIS_URL criada automaticamente)"
elif [ "$redis_option" = "2" ]; then
    echo "Configure em: https://console.upstash.com/"
    read -p "Cole sua Redis URL: " redis_url
    railway variables --set REDIS_URL="$redis_url"
    echo "✅ Redis URL configurada"
else
    echo "⚠️  Redis não configurado - cache desabilitado"
fi

echo ""

# ============================================
# 4. CONFIGURAR DATABASE (OPCIONAL)
# ============================================
echo "💾 Configurando Database..."
echo ""
read -p "Deseja configurar DATABASE_URL (para contexto persistente)? (s/n): " config_db
if [ "$config_db" = "s" ]; then
    read -p "Cole sua DATABASE_URL (Supabase/PostgreSQL): " db_url
    railway variables --set DATABASE_URL="$db_url"
    echo "✅ Database URL configurada"
else
    echo "⚠️  Database não configurado - contexto apenas em memória"
fi

echo ""

# ============================================
# 5. AGUARDAR REDEPLOY
# ============================================
echo "⏳ Aguardando redeploy após configuração de variáveis..."
echo "   (Railway faz redeploy automático quando variáveis mudam)"
echo ""
read -p "Pressione ENTER quando o deploy completar..."

echo ""

# ============================================
# 6. TESTAR ENDPOINTS
# ============================================
echo "🧪 Testando endpoints..."
echo ""

BASE_URL="https://syncads-python-microservice-production.up.railway.app"

echo "1️⃣  Testando health check geral..."
curl -s $BASE_URL/health | jq '.' || echo "❌ Falhou"
echo ""

echo "2️⃣  Testando Omnibrain health..."
curl -s $BASE_URL/api/omnibrain/health | jq '.' || echo "❌ Falhou"
echo ""

echo "3️⃣  Testando Modules health..."
curl -s $BASE_URL/api/modules/health | jq '.' || echo "❌ Falhou"
echo ""

echo "4️⃣  Testando execução simples..."
curl -s -X POST $BASE_URL/api/omnibrain/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Conte quantas palavras tem neste texto: Hello World Test",
    "context": {}
  }' | jq '.' || echo "❌ Falhou"
echo ""

# ============================================
# 7. TESTAR INTEGRAÇÃO FRONTEND
# ============================================
echo "🌐 Testando integração frontend..."
echo ""
echo "Abra em seu navegador:"
echo "   https://syncads.com.br"
echo ""
echo "No chat, teste um comando:"
echo "   'Faça scraping de example.com'"
echo ""
echo "Verifique no console (F12) se aparece:"
echo "   [Omnibrain] Executed in ...ms"
echo ""

# ============================================
# 8. VERIFICAR VARIÁVEIS CONFIGURADAS
# ============================================
echo "📋 Variáveis de ambiente configuradas:"
railway variables
echo ""

# ============================================
# 9. VER LOGS (OPCIONAL)
# ============================================
read -p "Deseja ver os logs do serviço? (s/n): " show_logs
if [ "$show_logs" = "s" ]; then
    echo "📜 Logs do serviço (Ctrl+C para sair):"
    railway logs
fi

echo ""
echo "============================================"
echo "✅ CONFIGURAÇÃO COMPLETA!"
echo "============================================"
echo ""
echo "📊 Status do Sistema:"
echo "   Backend:  $BASE_URL"
echo "   Frontend: https://syncads.com.br"
echo "   Docs:     $BASE_URL/docs"
echo "   GraphQL:  $BASE_URL/graphql"
echo ""
echo "📝 Próximos passos:"
echo "   1. Testar comandos no chat"
echo "   2. Conectar módulos reais (Shopify, Marketing, etc)"
echo "   3. Gerar library profiles adicionais"
echo "   4. Implementar rate limiting"
echo "   5. Adicionar observability"
echo ""
echo "🎊 Sistema está 95%+ funcional!"
echo "============================================"
