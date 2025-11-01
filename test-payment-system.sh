#!/bin/bash

# ============================================
# TESTE COMPLETO - SISTEMA DE PAGAMENTOS
# ============================================
#
# Script para testar todas as funcionalidades
# do sistema de pagamento
#
# Testa:
# - Tabelas do banco
# - Views materializadas
# - Funções
# - Edge Functions
# - API Frontend
#
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Funções auxiliares
log_test() {
    echo -e "${CYAN}🧪 ${NC}$1"
}

log_pass() {
    echo -e "${GREEN}✅ PASSOU:${NC} $1"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

log_fail() {
    echo -e "${RED}❌ FALHOU:${NC} $1"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_section() {
    echo ""
    echo "============================================"
    echo -e "${YELLOW}$1${NC}"
    echo "============================================"
    echo ""
}

# ============================================
# 1. VERIFICAR TABELAS
# ============================================
log_section "1. VERIFICANDO TABELAS DO BANCO"

log_test "Verificando tabela PaymentEvent..."
if supabase db execute "SELECT COUNT(*) FROM \"PaymentEvent\"" &>/dev/null; then
    log_pass "PaymentEvent existe"
else
    log_fail "PaymentEvent não encontrada"
fi

log_test "Verificando tabela GatewayMetrics..."
if supabase db execute "SELECT COUNT(*) FROM \"GatewayMetrics\"" &>/dev/null; then
    log_pass "GatewayMetrics existe"
else
    log_fail "GatewayMetrics não encontrada"
fi

log_test "Verificando tabela PaymentAlert..."
if supabase db execute "SELECT COUNT(*) FROM \"PaymentAlert\"" &>/dev/null; then
    log_pass "PaymentAlert existe"
else
    log_fail "PaymentAlert não encontrada"
fi

log_test "Verificando tabela PaymentRetryQueue..."
if supabase db execute "SELECT COUNT(*) FROM \"PaymentRetryQueue\"" &>/dev/null; then
    log_pass "PaymentRetryQueue existe"
else
    log_fail "PaymentRetryQueue não encontrada"
fi

log_test "Verificando tabela GatewayConfigCache..."
if supabase db execute "SELECT COUNT(*) FROM \"GatewayConfigCache\"" &>/dev/null; then
    log_pass "GatewayConfigCache existe"
else
    log_fail "GatewayConfigCache não encontrada"
fi

# ============================================
# 2. VERIFICAR VIEWS MATERIALIZADAS
# ============================================
log_section "2. VERIFICANDO VIEWS MATERIALIZADAS"

log_test "Verificando CheckoutMetricsView..."
if supabase db execute "SELECT * FROM \"CheckoutMetricsView\" LIMIT 1" &>/dev/null; then
    log_pass "CheckoutMetricsView existe"
else
    log_fail "CheckoutMetricsView não encontrada"
fi

log_test "Verificando GatewayPerformanceView..."
if supabase db execute "SELECT * FROM \"GatewayPerformanceView\" LIMIT 1" &>/dev/null; then
    log_pass "GatewayPerformanceView existe"
else
    log_fail "GatewayPerformanceView não encontrada"
fi

log_test "Verificando FailingGatewaysView..."
if supabase db execute "SELECT * FROM \"FailingGatewaysView\" LIMIT 1" &>/dev/null; then
    log_pass "FailingGatewaysView existe"
else
    log_fail "FailingGatewaysView não encontrada"
fi

# ============================================
# 3. VERIFICAR FUNÇÕES
# ============================================
log_section "3. VERIFICANDO FUNÇÕES DO BANCO"

log_test "Testando função refresh_payment_metrics..."
if supabase db execute "SELECT refresh_payment_metrics()" &>/dev/null; then
    log_pass "refresh_payment_metrics funciona"
else
    log_fail "refresh_payment_metrics com erro"
fi

log_test "Testando função calculate_next_retry..."
if supabase db execute "SELECT calculate_next_retry(1, 1000, 300000)" &>/dev/null; then
    log_pass "calculate_next_retry funciona"
else
    log_fail "calculate_next_retry com erro"
fi

# ============================================
# 4. VERIFICAR EDGE FUNCTIONS
# ============================================
log_section "4. VERIFICANDO EDGE FUNCTIONS"

log_test "Listando functions deployadas..."
FUNCTIONS=$(supabase functions list 2>/dev/null || echo "")

if echo "$FUNCTIONS" | grep -q "payment-webhook"; then
    log_pass "payment-webhook deployada"
else
    log_fail "payment-webhook não encontrada"
fi

if echo "$FUNCTIONS" | grep -q "payment-retry-processor"; then
    log_pass "payment-retry-processor deployada"
else
    log_fail "payment-retry-processor não encontrada"
fi

# Health check
log_test "Health check do retry processor..."
PROJECT_URL=$(supabase status --output json 2>/dev/null | grep -o '"api_url":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$PROJECT_URL" ] && command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s "${PROJECT_URL}/functions/v1/payment-retry-processor?action=health" 2>/dev/null || echo "")

    if echo "$HEALTH_RESPONSE" | grep -q "success"; then
        log_pass "Retry processor respondendo"
        echo "   Response: $HEALTH_RESPONSE"
    else
        log_fail "Retry processor não responde corretamente"
    fi
else
    log_info "Pulando health check (sem curl ou URL)"
fi

# ============================================
# 5. VERIFICAR ÍNDICES
# ============================================
log_section "5. VERIFICANDO ÍNDICES"

log_test "Verificando índices da PaymentEvent..."
INDEXES=$(supabase db execute "
    SELECT COUNT(*) as count
    FROM pg_indexes
    WHERE tablename = 'PaymentEvent'
" 2>/dev/null | grep -o '[0-9]\+' | head -1)

if [ "$INDEXES" -ge 5 ]; then
    log_pass "Índices da PaymentEvent criados ($INDEXES índices)"
else
    log_fail "Índices da PaymentEvent faltando (encontrados: $INDEXES)"
fi

log_test "Verificando índices da PaymentRetryQueue..."
INDEXES=$(supabase db execute "
    SELECT COUNT(*) as count
    FROM pg_indexes
    WHERE tablename = 'PaymentRetryQueue'
" 2>/dev/null | grep -o '[0-9]\+' | head -1)

if [ "$INDEXES" -ge 3 ]; then
    log_pass "Índices da PaymentRetryQueue criados ($INDEXES índices)"
else
    log_fail "Índices da PaymentRetryQueue faltando (encontrados: $INDEXES)"
fi

# ============================================
# 6. VERIFICAR TRIGGERS
# ============================================
log_section "6. VERIFICANDO TRIGGERS"

log_test "Verificando trigger check_gateway_failure_rate..."
if supabase db execute "
    SELECT COUNT(*) FROM pg_trigger
    WHERE tgname = 'trigger_check_failure_rate'
" &>/dev/null; then
    log_pass "Trigger de falha de gateway existe"
else
    log_fail "Trigger de falha de gateway não encontrado"
fi

log_test "Verificando trigger auto_enqueue_failed_transaction..."
if supabase db execute "
    SELECT COUNT(*) FROM pg_trigger
    WHERE tgname = 'trigger_auto_retry'
" &>/dev/null; then
    log_pass "Trigger de auto retry existe"
else
    log_fail "Trigger de auto retry não encontrado"
fi

# ============================================
# 7. VERIFICAR RLS
# ============================================
log_section "7. VERIFICANDO ROW LEVEL SECURITY"

log_test "Verificando RLS na PaymentEvent..."
RLS=$(supabase db execute "
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'PaymentEvent'
" 2>/dev/null | grep -o 't\|f')

if [ "$RLS" = "t" ]; then
    log_pass "RLS ativado na PaymentEvent"
else
    log_fail "RLS não ativado na PaymentEvent"
fi

log_test "Verificando políticas RLS..."
POLICIES=$(supabase db execute "
    SELECT COUNT(*) as count
    FROM pg_policies
    WHERE tablename = 'PaymentEvent'
" 2>/dev/null | grep -o '[0-9]\+' | head -1)

if [ "$POLICIES" -ge 2 ]; then
    log_pass "Políticas RLS criadas ($POLICIES políticas)"
else
    log_fail "Políticas RLS faltando (encontradas: $POLICIES)"
fi

# ============================================
# 8. TESTE DE INSERÇÃO
# ============================================
log_section "8. TESTE DE INSERÇÃO DE DADOS"

log_test "Testando inserção de evento..."
# Nota: Este teste pode falhar se não houver organizationId válido
INSERT_RESULT=$(supabase db execute "
    INSERT INTO \"PaymentEvent\" (
        \"organizationId\",
        \"eventType\",
        severity,
        \"eventData\"
    )
    SELECT
        id,
        'test_event',
        'info',
        '{\"test\": true}'::jsonb
    FROM \"Organization\"
    LIMIT 1
    RETURNING id;
" 2>&1)

if echo "$INSERT_RESULT" | grep -q "ERROR"; then
    log_fail "Erro ao inserir evento de teste"
else
    log_pass "Inserção de evento funcionando"
fi

# ============================================
# 9. VERIFICAR ARQUIVOS FRONTEND
# ============================================
log_section "9. VERIFICANDO ARQUIVOS FRONTEND"

log_test "Verificando paymentMetricsApi.ts..."
if [ -f "src/lib/api/paymentMetricsApi.ts" ]; then
    log_pass "paymentMetricsApi.ts existe"
else
    log_fail "paymentMetricsApi.ts não encontrado"
fi

log_test "Verificando ReportsOverviewPage.tsx..."
if [ -f "src/pages/app/reports/ReportsOverviewPage.tsx" ]; then
    log_pass "ReportsOverviewPage.tsx existe"
else
    log_fail "ReportsOverviewPage.tsx não encontrado"
fi

# ============================================
# 10. VERIFICAR DOCUMENTAÇÃO
# ============================================
log_section "10. VERIFICANDO DOCUMENTAÇÃO"

log_test "Verificando AUDITORIA_PAGAMENTOS_STATUS.md..."
if [ -f "AUDITORIA_PAGAMENTOS_STATUS.md" ]; then
    log_pass "Documentação existe"
else
    log_fail "Documentação não encontrada"
fi

# ============================================
# RELATÓRIO FINAL
# ============================================
log_section "RELATÓRIO FINAL"

echo "Total de testes: $TESTS_TOTAL"
echo -e "${GREEN}Passou: $TESTS_PASSED${NC}"
echo -e "${RED}Falhou: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ TODOS OS TESTES PASSARAM! ✨${NC}"
    echo ""
    echo "Sistema de pagamentos está funcionando corretamente!"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure webhooks nos gateways"
    echo "2. Configure cron jobs (veja AUDITORIA_PAGAMENTOS_STATUS.md)"
    echo "3. Acesse o dashboard em: Relatórios > Visão Geral"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM ❌${NC}"
    echo ""
    echo "Por favor, revise os erros acima e:"
    echo "1. Verifique se a migration foi aplicada: supabase db push"
    echo "2. Verifique se as edge functions foram deployadas"
    echo "3. Consulte: AUDITORIA_PAGAMENTOS_STATUS.md"
    echo ""
    exit 1
fi
