#!/bin/bash

# ============================================
# DEPLOY EDGE FUNCTION - SHOPIFY CREATE ORDER
# ============================================
#
# Este script faz o deploy da Edge Function
# com a flag --no-verify-jwt para permitir
# requisições públicas (anon key)
#
# ============================================

echo "🚀 Iniciando deploy da Edge Function..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
PROJECT_REF="ovskepqggmxlfckxqgbr"
FUNCTION_NAME="shopify-create-order"

echo "📦 Projeto: $PROJECT_REF"
echo "⚡ Função: $FUNCTION_NAME"
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI não está instalado!${NC}"
    echo ""
    echo "Instale com:"
    echo "npm install -g supabase"
    exit 1
fi

# Fazer deploy
echo "🔨 Fazendo deploy..."
echo ""

supabase functions deploy $FUNCTION_NAME \
  --project-ref $PROJECT_REF \
  --no-verify-jwt

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deploy realizado com sucesso!${NC}"
    echo ""
    echo "📍 URL da função:"
    echo "https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME"
    echo ""
    echo -e "${YELLOW}⚠️  A função aceita requisições públicas (anon key)${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Erro ao fazer deploy!${NC}"
    echo ""
    echo "Tente:"
    echo "1. Verificar se está logado: supabase login"
    echo "2. Verificar se o projeto existe: supabase projects list"
    echo "3. Fazer link manual: supabase link --project-ref $PROJECT_REF"
    exit 1
fi

# Instruções finais
echo "🎯 Próximos passos:"
echo ""
echo "1. Teste a função:"
echo "   curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'apikey: YOUR_ANON_KEY' \\"
echo "     -d '{\"shopifyDomain\":\"sua-loja.myshopify.com\",\"items\":[...]}'"
echo ""
echo "2. Verifique os logs:"
echo "   supabase functions logs $FUNCTION_NAME --project-ref $PROJECT_REF"
echo ""
echo "3. Atualize o script Shopify se necessário"
echo ""

echo -e "${GREEN}✨ Concluído!${NC}"
