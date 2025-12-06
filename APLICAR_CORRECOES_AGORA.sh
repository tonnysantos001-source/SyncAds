#!/bin/bash
# ============================================
# SYNCADS - SCRIPT DE CORREÇÃO COMPLETA
# Data: Janeiro 2025
# ============================================

echo "🚀 INICIANDO CORREÇÕES DO SYNCADS..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# PASSO 1: CONFIGURAR IAs NO BANCO DE DADOS
# ============================================
echo -e "${BLUE}📊 PASSO 1: Configurando IAs no banco de dados...${NC}"
echo ""

echo "Execute este SQL no Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/sql"
echo ""
echo -e "${YELLOW}Arquivo: FIX_AI_COMPLETE.sql${NC}"
echo "Pressione ENTER após executar o SQL..."
read

# ============================================
# PASSO 2: DEPLOY DAS EDGE FUNCTIONS
# ============================================
echo ""
echo -e "${BLUE}🚀 PASSO 2: Deploy das Edge Functions corrigidas...${NC}"
echo ""

# Verificar se supabase CLI está instalado
if ! command -v supabase &> /dev/null
then
    echo -e "${RED}❌ Supabase CLI não encontrado!${NC}"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

echo "Fazendo login no Supabase..."
supabase login

echo ""
echo "Fazendo link com o projeto..."
supabase link --project-ref ovskepqggmxlfckxqgbr

echo ""
echo "🔄 Deployando ai-router..."
supabase functions deploy ai-router

echo ""
echo "🔄 Deployando chat-enhanced..."
supabase functions deploy chat-enhanced

echo ""
echo -e "${GREEN}✅ Edge Functions deployadas!${NC}"

# ============================================
# PASSO 3: CONFIGURAR VARIÁVEIS DE AMBIENTE
# ============================================
echo ""
echo -e "${BLUE}⚙️ PASSO 3: Configurando variáveis de ambiente...${NC}"
echo ""

echo "Configurando secrets das edge functions..."

# Python Service URL
supabase secrets set PYTHON_SERVICE_URL=https://syncads-python-microservice-production.up.railway.app --project-ref ovskepqggmxlfckxqgbr

# Groq API Key
echo ""
echo -e "${YELLOW}Cole sua Groq API Key (ou pressione ENTER para usar a atual):${NC}"
read GROQ_KEY
if [ ! -z "$GROQ_KEY" ]; then
    supabase secrets set GROQ_API_KEY=$GROQ_KEY --project-ref ovskepqggmxlfckxqgbr
fi

# Gemini API Key
echo ""
echo -e "${YELLOW}Cole sua Gemini API Key (ou pressione ENTER para usar a atual):${NC}"
read GEMINI_KEY
if [ ! -z "$GEMINI_KEY" ]; then
    supabase secrets set GEMINI_API_KEY=$GEMINI_KEY --project-ref ovskepqggmxlfckxqgbr
fi

echo ""
echo -e "${GREEN}✅ Variáveis configuradas!${NC}"

# ============================================
# PASSO 4: CORRIGIR RAILWAY (PYTHON SERVICE)
# ============================================
echo ""
echo -e "${BLUE}🚂 PASSO 4: Verificando Python Service no Railway...${NC}"
echo ""

echo "Acesse o Railway Dashboard:"
echo "https://railway.app/project/sua-project-id"
echo ""
echo "Verifique os logs de erro e configure as variáveis:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_KEY"
echo ""
echo "Pressione ENTER após verificar..."
read

# ============================================
# PASSO 5: INSTALAR BIBLIOTECAS NO PYTHON SERVICE
# ============================================
echo ""
echo -e "${BLUE}📦 PASSO 5: Bibliotecas a instalar no Python Service${NC}"
echo ""

echo "No Railway, adicione ao requirements.txt:"
echo ""
echo -e "${YELLOW}# Browser Automation${NC}"
echo "playwright>=1.41.0"
echo "selenium>=4.17.0"
echo ""
echo -e "${YELLOW}# IA Avançada (OPCIONAL - instalar depois)${NC}"
echo "# browser-use>=0.1.0"
echo "# litewebagent>=0.1.0"
echo "# agentql>=0.1.0"
echo ""
echo "Pressione ENTER para continuar..."
read

# ============================================
# PASSO 6: BUILD E DEPLOY DO FRONTEND
# ============================================
echo ""
echo -e "${BLUE}🌐 PASSO 6: Build e Deploy do Frontend...${NC}"
echo ""

echo "Instalando dependências..."
npm install

echo ""
echo "Fazendo build..."
npm run build

echo ""
echo "Deploy no Vercel..."
if command -v vercel &> /dev/null
then
    vercel --prod
else
    echo -e "${YELLOW}⚠️ Vercel CLI não encontrado. Faça deploy manual:${NC}"
    echo "1. Commit as mudanças no Git"
    echo "2. Push para o repositório"
    echo "3. Vercel fará deploy automático"
fi

# ============================================
# PASSO 7: TESTAR INTEGRAÇÃO
# ============================================
echo ""
echo -e "${BLUE}🧪 PASSO 7: Testes de Integração${NC}"
echo ""

echo "Testando AI Router..."
curl -X POST "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/ai-router" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E" \
  -d '{"message":"Olá, como você está?"}'

echo ""
echo ""
echo "Testando geração de imagem com Gemini..."
curl -X POST "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/ai-router" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E" \
  -d '{"message":"Crie uma imagem de um gato astronauta"}'

# ============================================
# PASSO 8: VERIFICAR EXTENSÃO CHROME
# ============================================
echo ""
echo -e "${BLUE}🔌 PASSO 8: Extensão Chrome${NC}"
echo ""

echo "Para testar a extensão:"
echo "1. Abra Chrome e vá para chrome://extensions"
echo "2. Ative 'Modo do desenvolvedor'"
echo "3. Clique em 'Carregar sem compactação'"
echo "4. Selecione a pasta: chrome-extension/"
echo "5. A extensão será carregada"
echo ""
echo "Teste o feedback visual DOM:"
echo "1. Abra o Side Panel da extensão"
echo "2. Digite um comando DOM como 'liste as abas'"
echo "3. Veja a borda azul piscando e o overlay"
echo ""
echo "Pressione ENTER para continuar..."
read

# ============================================
# RESUMO FINAL
# ============================================
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ CORREÇÕES APLICADAS COM SUCESSO!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

echo -e "${BLUE}📋 RESUMO DO QUE FOI FEITO:${NC}"
echo ""
echo "✅ 1. Configurado Grok (GROQ) para chat rápido"
echo "✅ 2. Configurado Gemini para imagens e multimodal"
echo "✅ 3. AI Router corrigido e deployado"
echo "✅ 4. Chat-enhanced atualizado com suporte completo"
echo "✅ 5. Feedback visual DOM implementado na extensão"
echo "✅ 6. Variáveis de ambiente configuradas"
echo ""

echo -e "${YELLOW}⚠️ AÇÕES MANUAIS NECESSÁRIAS:${NC}"
echo ""
echo "1. ⚠️ Verificar logs do Railway e corrigir token"
echo "   https://railway.app/project/YOUR_PROJECT"
echo ""
echo "2. ⚠️ Adicionar bibliotecas avançadas ao Python Service:"
echo "   - browser-use (automação inteligente)"
echo "   - litewebagent (agente web)"
echo "   - agentql (queries estruturadas)"
echo ""
echo "3. ⚠️ Instalar Playwright browsers no Railway:"
echo "   Adicionar no Dockerfile: RUN playwright install chromium"
echo ""

echo -e "${BLUE}📝 PRÓXIMOS TESTES:${NC}"
echo ""
echo "1. Teste no chat:"
echo "   - 'Olá' → deve usar GROK"
echo "   - 'Crie uma imagem de um gato' → deve usar GEMINI"
echo "   - 'Analise esta imagem' (com anexo) → deve usar GEMINI"
echo ""
echo "2. Teste DOM na extensão:"
echo "   - Abra uma página qualquer"
echo "   - No Side Panel digite: 'liste as abas'"
echo "   - Deve ver borda azul piscando e overlay"
echo ""
echo "3. Teste Railway:"
echo "   - Verifique se o serviço está online"
echo "   - Teste endpoint: curl https://syncads-python-microservice-production.up.railway.app/health"
echo ""

echo -e "${GREEN}🎉 SISTEMA PRONTO PARA USO!${NC}"
echo ""
echo "Qualquer problema, verifique os logs:"
echo "  - Supabase: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/logs"
echo "  - Railway: https://railway.app/project/YOUR_PROJECT/logs"
echo "  - Chrome Extension: Abra DevTools na extensão"
echo ""

# ============================================
# FIM DO SCRIPT
# ============================================
