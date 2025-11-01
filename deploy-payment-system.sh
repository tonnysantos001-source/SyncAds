#!/bin/bash

# ============================================
# DEPLOY COMPLETO - SISTEMA DE PAGAMENTOS
# ============================================
#
# Script para deploy automático de todas as
# funcionalidades do sistema de pagamento
#
# Executa:
# - Migration do banco
# - Deploy de edge functions
# - Configuração de cron jobs
# - Testes de saúde
#
# ============================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✅ ${NC}$1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${NC}$1"
}

log_error() {
    echo -e "${RED}❌ ${NC}$1"
}

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI não encontrado!"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

log_info "Iniciando deploy do sistema de pagamentos..."
echo ""

# ============================================
# 1. APLICAR MIGRATION
# ============================================
log_info "Passo 1/5: Aplicando migration do banco de dados..."

if supabase db push; then
    log_success "Migration aplicada com sucesso!"
else
    log_error "Erro ao aplicar migration"
    log_warning "Tente aplicar manualmente:"
    echo "  cd supabase"
    echo "  supabase db push"
    exit 1
fi

echo ""

# ============================================
# 2. DEPLOY EDGE FUNCTION
# ============================================
log_info "Passo 2/5: Deploy da Edge Function de retry..."

if supabase functions deploy payment-retry-processor; then
    log_success "Edge Function deployada com sucesso!"
else
    log_error "Erro no deploy da Edge Function"
    log_warning "Tente manualmente:"
    echo "  supabase functions deploy payment-retry-processor"
    exit 1
fi

echo ""

# ============================================
# 3. VERIFICAR STATUS
# ============================================
log_info "Passo 3/5: Verificando status das functions..."

supabase functions list

echo ""

# ============================================
# 4. REFRESH DE MÉTRICAS
# ============================================
log_info "Passo 4/5: Inicializando views materializadas..."

# Criar script SQL temporário
cat > /tmp/refresh_views.sql << 'EOF'
-- Refresh inicial das views materializadas
REFRESH MATERIALIZED VIEW "CheckoutMetricsView";
REFRESH MATERIALIZED VIEW "GatewayPerformanceView";
REFRESH MATERIALIZED VIEW "FailingGatewaysView";
EOF

if supabase db execute -f /tmp/refresh_views.sql; then
    log_success "Views materializadas inicializadas!"
else
    log_warning "Erro ao inicializar views (normal se não houver dados)"
fi

rm /tmp/refresh_views.sql

echo ""

# ============================================
# 5. CONFIGURAR CRON JOBS
# ============================================
log_info "Passo 5/5: Configurando Cron Jobs..."

# Obter URL do projeto
PROJECT_URL=$(supabase status --output json 2>/dev/null | grep -o '"api_url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PROJECT_URL" ]; then
    log_warning "Não foi possível obter URL do projeto automaticamente"
    log_info "Configure os cron jobs manualmente:"
    cat << 'EOF'

-- Execute no Supabase SQL Editor:

-- 1. Processar retry queue a cada 1 minuto
SELECT cron.schedule(
  'process-payment-retries',
  '*/1 * * * *',
  $$SELECT net.http_post(
      url:='https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor',
      headers:='{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb
  );$$
);

-- 2. Refresh métricas a cada 5 minutos
SELECT cron.schedule(
  'refresh-payment-metrics',
  '*/5 * * * *',
  'SELECT refresh_payment_metrics()'
);

-- 3. Limpar cache expirado a cada hora
SELECT cron.schedule(
  'clean-expired-cache',
  '0 * * * *',
  'DELETE FROM "GatewayConfigCache" WHERE "expiresAt" < NOW()'
);

-- 4. Limpar eventos antigos (>90 dias) diariamente
SELECT cron.schedule(
  'clean-old-events',
  '0 2 * * *',
  'DELETE FROM "PaymentEvent" WHERE "createdAt" < NOW() - INTERVAL ''90 days'''
);

-- 5. Cleanup retry queue (diariamente às 3am)
SELECT cron.schedule(
  'cleanup-retry-queue',
  '0 3 * * *',
  $$SELECT net.http_post(
      url:='https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor?action=cleanup',
      headers:='{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb
  );$$
);

EOF
else
    log_success "URL do projeto: $PROJECT_URL"
    log_info "Criando cron jobs..."

    # Criar script SQL para cron jobs
    cat > /tmp/setup_cron.sql << EOF
-- Configurar Cron Jobs para sistema de pagamentos

-- 1. Refresh métricas a cada 5 minutos
SELECT cron.schedule(
  'refresh-payment-metrics',
  '*/5 * * * *',
  'SELECT refresh_payment_metrics()'
);

-- 2. Limpar cache expirado a cada hora
SELECT cron.schedule(
  'clean-expired-cache',
  '0 * * * *',
  'DELETE FROM "GatewayConfigCache" WHERE "expiresAt" < NOW()'
);

-- 3. Limpar eventos antigos (>90 dias) diariamente
SELECT cron.schedule(
  'clean-old-events',
  '0 2 * * *',
  'DELETE FROM "PaymentEvent" WHERE "createdAt" < NOW() - INTERVAL ''90 days'''
);
EOF

    if supabase db execute -f /tmp/setup_cron.sql; then
        log_success "Cron jobs configurados!"
    else
        log_warning "Execute manualmente no SQL Editor"
    fi

    rm /tmp/setup_cron.sql
fi

echo ""
echo "============================================"
log_success "DEPLOY CONCLUÍDO COM SUCESSO!"
echo "============================================"
echo ""

# ============================================
# INSTRUÇÕES FINAIS
# ============================================
log_info "Próximos passos:"
echo ""

echo "1️⃣  CONFIGURAR WEBHOOKS NOS GATEWAYS"
echo ""
echo "   Stripe:"
echo "   URL: ${PROJECT_URL}/functions/v1/payment-webhook/stripe"
echo "   Events: payment_intent.succeeded, payment_intent.payment_failed"
echo ""
echo "   Mercado Pago:"
echo "   URL: ${PROJECT_URL}/functions/v1/payment-webhook/mercado-pago"
echo "   Topics: payment, merchant_order"
echo ""
echo "   Asaas:"
echo "   URL: ${PROJECT_URL}/functions/v1/payment-webhook/asaas"
echo "   Events: PAYMENT_RECEIVED, PAYMENT_OVERDUE"
echo ""

echo "2️⃣  TESTAR SISTEMA"
echo ""
echo "   # Health Check do Retry Processor"
echo "   curl '${PROJECT_URL}/functions/v1/payment-retry-processor?action=health'"
echo ""
echo "   # Ver métricas no dashboard"
echo "   Acesse: Relatórios > Visão Geral"
echo ""

echo "3️⃣  MONITORAR"
echo ""
echo "   # Ver logs da edge function"
echo "   supabase functions logs payment-retry-processor"
echo ""
echo "   # Ver alertas ativos"
echo "   SELECT * FROM \"PaymentAlert\" WHERE status = 'active';"
echo ""
echo "   # Ver fila de retry"
echo "   SELECT status, COUNT(*) FROM \"PaymentRetryQueue\" GROUP BY status;"
echo ""

echo "4️⃣  DOCUMENTAÇÃO COMPLETA"
echo ""
echo "   Leia: AUDITORIA_PAGAMENTOS_STATUS.md"
echo ""

log_success "Sistema de pagamentos deployado e pronto para uso! 🚀"
echo ""

# Verificar saúde do sistema
log_info "Verificando saúde do sistema..."

if command -v curl &> /dev/null && [ ! -z "$PROJECT_URL" ]; then
    HEALTH_RESPONSE=$(curl -s "${PROJECT_URL}/functions/v1/payment-retry-processor?action=health" || echo "")

    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        log_success "Sistema está saudável! ✨"
    else
        log_warning "Health check não respondeu como esperado"
        echo "Response: $HEALTH_RESPONSE"
    fi
else
    log_warning "Curl não disponível - pule o health check"
fi

echo ""
log_info "Para mais informações, consulte: AUDITORIA_PAGAMENTOS_STATUS.md"
