#!/bin/bash

# ============================================
# COMANDOS RÁPIDOS - SyncAds
# ============================================
# Use este arquivo para executar tarefas comuns
# ============================================

echo "🚀 SyncAds - Comandos Rápidos"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# 1. LIMPAR PEDIDOS DE TESTE (VIA SQL)
# ============================================
limpar_pedidos() {
    echo "${YELLOW}🗑️  Limpando pedidos de teste...${NC}"
    echo "Execute este SQL no Supabase SQL Editor:"
    echo ""
    echo "BEGIN;"
    echo "DELETE FROM \"OrderItem\" WHERE \"orderId\" IN (SELECT id FROM \"Order\");"
    echo "DELETE FROM \"OrderHistory\" WHERE \"orderId\" IN (SELECT id FROM \"Order\");"
    echo "DELETE FROM \"Order\";"
    echo "DELETE FROM \"ShopifyOrder\";"
    echo "COMMIT;"
    echo ""
    echo "Depois verifique:"
    echo "SELECT (SELECT COUNT(*) FROM \"Order\") as total_orders;"
    echo ""
}

# ============================================
# 2. BUILD LOCAL
# ============================================
build_local() {
    echo "${YELLOW}🔨 Fazendo build local...${NC}"
    npm run build
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Build concluído com sucesso!${NC}"
    else
        echo "${RED}❌ Erro no build!${NC}"
        exit 1
    fi
}

# ============================================
# 3. DEPLOY EDGE FUNCTION
# ============================================
deploy_edge_function() {
    echo "${YELLOW}🚀 Fazendo deploy da edge function...${NC}"
    supabase functions deploy sync-order-to-shopify
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Edge function deployada!${NC}"
        echo "Verifique em: https://supabase.com/dashboard/project/ggutzkdfsoyrzqxbjxqd/functions"
    else
        echo "${RED}❌ Erro no deploy!${NC}"
        exit 1
    fi
}

# ============================================
# 4. VER LOGS DA EDGE FUNCTION
# ============================================
ver_logs() {
    echo "${YELLOW}📋 Buscando logs da edge function...${NC}"
    supabase functions logs sync-order-to-shopify --limit 50
}

# ============================================
# 5. DEPLOY COMPLETO (EDGE + FRONTEND)
# ============================================
deploy_completo() {
    echo "${YELLOW}🚀 Deploy completo iniciado...${NC}"

    # 1. Build local
    echo "1️⃣  Build local..."
    npm run build

    # 2. Deploy edge function
    echo "2️⃣  Deploy edge function..."
    supabase functions deploy sync-order-to-shopify

    # 3. Git commit e push
    echo "3️⃣  Fazendo commit e push..."
    git add .
    git commit -m "feat: correções pedidos + integração shopify"
    git push origin main

    echo ""
    echo "${GREEN}✅ Deploy completo!${NC}"
    echo "Aguarde ~2 minutos para Vercel fazer deploy"
    echo "Verifique em: https://vercel.com/tonnysantos001-source/syncads/deployments"
}

# ============================================
# 6. TESTAR INTEGRAÇÃO SHOPIFY
# ============================================
testar_shopify() {
    echo "${YELLOW}🧪 Testando integração Shopify...${NC}"
    echo ""
    echo "1. Abra: https://syncads-dun.vercel.app/checkout/[orderId]"
    echo "2. Faça um pedido de teste"
    echo "3. Verifique no SyncAds: https://syncads-dun.vercel.app/orders/all"
    echo "4. Verifique na Shopify: https://admin.shopify.com/store/syncads-ai/orders"
    echo ""
    echo "Ou execute manualmente via console (F12):"
    echo "const { data, error } = await supabase.functions.invoke('sync-order-to-shopify', {"
    echo "  body: { orderId: 'SEU_ORDER_ID_AQUI' }"
    echo "});"
    echo "console.log(data, error);"
    echo ""
}

# ============================================
# 7. DEV LOCAL
# ============================================
dev_local() {
    echo "${YELLOW}💻 Iniciando servidor local...${NC}"
    npm run dev
}

# ============================================
# 8. VERIFICAR STATUS
# ============================================
verificar_status() {
    echo "${YELLOW}📊 Verificando status do sistema...${NC}"
    echo ""

    # Build
    echo "🔨 Build local:"
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ${GREEN}✅ Build passando${NC}"
    else
        echo "  ${RED}❌ Build com erros${NC}"
    fi

    # Git
    echo "📝 Git status:"
    git status -s

    # Edge functions
    echo "⚡ Edge functions:"
    supabase functions list 2>/dev/null | grep sync-order-to-shopify

    echo ""
}

# ============================================
# 9. LIMPAR CACHE
# ============================================
limpar_cache() {
    echo "${YELLOW}🧹 Limpando cache...${NC}"
    rm -rf node_modules/.vite
    rm -rf dist
    echo "${GREEN}✅ Cache limpo!${NC}"
    echo "Execute 'npm install' se necessário"
}

# ============================================
# MENU INTERATIVO
# ============================================
mostrar_menu() {
    echo ""
    echo "=========================================="
    echo "  MENU DE COMANDOS"
    echo "=========================================="
    echo "1) Limpar pedidos de teste (SQL)"
    echo "2) Build local"
    echo "3) Deploy edge function"
    echo "4) Ver logs edge function"
    echo "5) Deploy completo (edge + frontend)"
    echo "6) Testar integração Shopify"
    echo "7) Dev local (npm run dev)"
    echo "8) Verificar status do sistema"
    echo "9) Limpar cache"
    echo "0) Sair"
    echo "=========================================="
    echo ""
}

# ============================================
# EXECUÇÃO DO MENU
# ============================================
if [ "$1" == "" ]; then
    while true; do
        mostrar_menu
        read -p "Escolha uma opção: " opcao

        case $opcao in
            1) limpar_pedidos ;;
            2) build_local ;;
            3) deploy_edge_function ;;
            4) ver_logs ;;
            5) deploy_completo ;;
            6) testar_shopify ;;
            7) dev_local ;;
            8) verificar_status ;;
            9) limpar_cache ;;
            0) echo "👋 Até logo!"; exit 0 ;;
            *) echo "${RED}❌ Opção inválida!${NC}" ;;
        esac

        echo ""
        read -p "Pressione ENTER para continuar..."
    done
else
    # Executar comando direto
    case $1 in
        limpar) limpar_pedidos ;;
        build) build_local ;;
        deploy-edge) deploy_edge_function ;;
        logs) ver_logs ;;
        deploy) deploy_completo ;;
        test) testar_shopify ;;
        dev) dev_local ;;
        status) verificar_status ;;
        clean) limpar_cache ;;
        *) echo "${RED}❌ Comando desconhecido: $1${NC}" ;;
    esac
fi

# ============================================
# EXEMPLOS DE USO:
# ============================================
# ./COMANDOS_RÁPIDOS.sh              # Menu interativo
# ./COMANDOS_RÁPIDOS.sh build        # Build local
# ./COMANDOS_RÁPIDOS.sh deploy       # Deploy completo
# ./COMANDOS_RÁPIDOS.sh logs         # Ver logs
# ./COMANDOS_RÁPIDOS.sh status       # Verificar status
# ============================================
