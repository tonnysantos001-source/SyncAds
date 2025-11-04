#!/bin/bash

# ============================================
# SCRIPT DE DEPLOY COMPLETO - SyncAds
# ============================================
# Este script faz o deploy completo:
# - Edge function sync-order-to-shopify
# - Frontend (git push)
# ============================================

echo "🚀 INICIANDO DEPLOY COMPLETO..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 1. BUILD LOCAL
# ============================================
echo "${YELLOW}📦 1/4 - Fazendo build local...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo "${RED}❌ Erro no build! Corrija os erros antes de continuar.${NC}"
    exit 1
fi

echo "${GREEN}✅ Build passou com sucesso!${NC}"
echo ""

# ============================================
# 2. DEPLOY EDGE FUNCTION
# ============================================
echo "${YELLOW}⚡ 2/4 - Deploy da edge function sync-order-to-shopify...${NC}"

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "${RED}❌ Supabase CLI não encontrado!${NC}"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

# Deploy da função
supabase functions deploy sync-order-to-shopify

if [ $? -ne 0 ]; then
    echo "${RED}❌ Erro ao fazer deploy da edge function!${NC}"
    echo "Tente manualmente: supabase functions deploy sync-order-to-shopify"
    exit 1
fi

echo "${GREEN}✅ Edge function deployada com sucesso!${NC}"
echo ""

# ============================================
# 3. GIT COMMIT E PUSH
# ============================================
echo "${YELLOW}📝 3/4 - Commit e push para GitHub...${NC}"

# Adicionar arquivos
git add .

# Commit
git commit -m "fix: corrigir sincronização com Shopify - dados do cadastro salvos"

# Push
git push origin main

if [ $? -ne 0 ]; then
    echo "${RED}❌ Erro ao fazer push!${NC}"
    echo "Verifique sua conexão e permissões do GitHub"
    exit 1
fi

echo "${GREEN}✅ Código enviado para GitHub!${NC}"
echo ""

# ============================================
# 4. AGUARDAR DEPLOY VERCEL
# ============================================
echo "${YELLOW}⏳ 4/4 - Aguardando deploy da Vercel...${NC}"
echo ""
echo "A Vercel está fazendo o deploy automático..."
echo "Aguarde aproximadamente ${BLUE}2 minutos${NC}"
echo ""

# Contador de 120 segundos
for i in {120..1}; do
    echo -ne "\r⏱️  Aguardando: ${i}s   "
    sleep 1
done

echo -e "\n"
echo "${GREEN}✅ Deploy deve estar completo!${NC}"
echo ""

# ============================================
# INSTRUÇÕES FINAIS
# ============================================
echo "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║                    DEPLOY COMPLETO! ✅                     ║${NC}"
echo "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1️⃣  ${YELLOW}LIMPAR PEDIDOS ANTIGOS (OBRIGATÓRIO)${NC}"
echo "   Acesse: https://supabase.com/dashboard/project/ggutzkdfsoyrzqxbjxqd/sql"
echo "   Cole e execute:"
echo ""
echo "   ${BLUE}BEGIN;${NC}"
echo "   ${BLUE}DELETE FROM \"OrderItem\" WHERE \"orderId\" IN (SELECT id FROM \"Order\");${NC}"
echo "   ${BLUE}DELETE FROM \"OrderHistory\" WHERE \"orderId\" IN (SELECT id FROM \"Order\");${NC}"
echo "   ${BLUE}DELETE FROM \"Order\";${NC}"
echo "   ${BLUE}DELETE FROM \"ShopifyOrder\";${NC}"
echo "   ${BLUE}COMMIT;${NC}"
echo ""
echo "2️⃣  ${YELLOW}FAZER NOVO PEDIDO DE TESTE${NC}"
echo "   - Acesse: https://syncads-dun.vercel.app"
echo "   - Preencha com dados REAIS (não genéricos)"
echo "   - Finalize o pedido"
echo ""
echo "3️⃣  ${YELLOW}VERIFICAR NO SYNCADS${NC}"
echo "   - Acesse: https://syncads-dun.vercel.app/orders/all"
echo "   - Deve mostrar nome e email reais"
echo ""
echo "4️⃣  ${YELLOW}VERIFICAR NA SHOPIFY${NC}"
echo "   - Acesse: https://admin.shopify.com/store/syncads-ai/orders"
echo "   - Pedido deve ter aparecido com dados corretos"
echo ""
echo "5️⃣  ${YELLOW}DEBUG (SE NECESSÁRIO)${NC}"
echo "   - Abra F12 (Console) no navegador"
echo "   - Procure por mensagens:"
echo "     ${GREEN}✅ [UPDATE] Pedido atualizado com sucesso!${NC}"
echo "     ${GREEN}✅ [SHOPIFY] Pedido sincronizado com sucesso!${NC}"
echo ""
echo "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "${GREEN}🎉 TUDO PRONTO! Agora é só testar! 🚀${NC}"
echo ""
echo "${YELLOW}📊 Links úteis:${NC}"
echo "   - Vercel: https://vercel.com/tonnysantos001-source/syncads/deployments"
echo "   - Supabase Logs: https://supabase.com/dashboard/project/ggutzkdfsoyrzqxbjxqd/logs/edge-functions"
echo "   - Shopify: https://admin.shopify.com/store/syncads-ai/orders"
echo ""
