# 🎯 SISTEMA DE SPLIT DE PAGAMENTO E GESTÃO DE PLANOS

**Data:** 04/02/2025  
**Status:** ✅ Implementado  
**Ambiente:** SyncAds SaaS Platform

---

## 📋 RESUMO EXECUTIVO

Implementamos um **sistema dual de monetização** para o SyncAds:

1. **Assinaturas (MRR)** - Receita recorrente mensal via planos
2. **Split de Pagamento** - Receita por transação com alternância inteligente de gateways

---

## 🏗️ ARQUITETURA IMPLEMENTADA

### 1️⃣ **BANCO DE DADOS**

#### Novas Tabelas Criadas:

**`PaymentSplitRule`** - Regras de Split de Pagamento
- Controle total de alternância de gateways
- Tipos: Frequência, Percentual, Valor, Tempo, Manual
- Configurações por cliente ou globais
- Contadores automáticos e estatísticas

**`PaymentSplitLog`** - Histórico de Transações
- Log de cada decisão de split
- Rastreamento completo de receita admin vs cliente
- Auditoria detalhada

**`PlanDailyUsage`** - Uso Diário de Recursos
- Rastreamento de mensagens IA por dia
- Rastreamento de imagens IA por dia
- Reset automático diário

#### Tabelas Expandidas:

**`Plan`** - Novos Campos
- `maxAiMessagesDaily` - Limite diário de mensagens IA
- `maxAiImagesDaily` - Limite diário de imagens IA
- `maxCheckoutPages` - Limite de páginas de checkout
- `maxProducts` - Limite de produtos
- `hasCustomDomain` - Domínio personalizado
- `hasAdvancedAnalytics` - Analytics avançado
- `hasPrioritySupport` - Suporte prioritário
- `hasApiAccess` - Acesso à API
- `transactionFeePercentage` - Taxa % por transação
- `transactionFeeFixed` - Taxa fixa por transação

---

### 2️⃣ **FUNÇÕES SQL CRIADAS**

#### `determine_split_gateway(user_id, order_value)`
**Função Principal de Split**
- Determina automaticamente qual gateway usar
- Aplica regras por prioridade
- Atualiza contadores e estatísticas
- Retorna: decisão (admin/client) + gateway_id + motivo

**Tipos de Regra:**

1. **Frequência** 
   - A cada X transações, Y vão pro admin
   - Exemplo: A cada 10, 2 para o admin

2. **Percentual**
   - X% das transações vão pro admin
   - Exemplo: 20% para o admin

3. **Valor**
   - Transações entre R$ X e R$ Y
   - Exemplo: Vendas acima de R$ 500

4. **Tempo**
   - A cada X horas/dias
   - Exemplo: A cada 24 horas

5. **Manual**
   - Controle manual direto

#### `increment_daily_usage(user_id, message_type)`
**Controle de Limites Diários**
- Verifica limite do plano
- Incrementa contador
- Retorna true/false se pode usar

#### `reset_daily_usage_counters()`
**Reset Automático**
- Cria registros para hoje
- Limpa registros antigos (90+ dias)

---

## 🎨 FRONTEND IMPLEMENTADO

### 1️⃣ **Página: Gestão de Planos** (`/super-admin/plans`)

**Funcionalidades:**
- ✅ CRUD completo de planos
- ✅ Configuração de preços e intervalos
- ✅ Limites diários de IA (mensagens/imagens)
- ✅ Limites de recursos (checkout, produtos, projetos)
- ✅ Features booleanas (domínio, analytics, suporte, API)
- ✅ Lista descritiva de features
- ✅ Taxas de transação configuráveis
- ✅ Marcar plano como "Popular"
- ✅ Ativar/Desativar planos
- ✅ Dashboard com MRR/ARR

**Componentes:**
- Modal de criação/edição
- Tabela de planos com estatísticas
- Cards de métricas (MRR, ARR, assinantes)

---

### 2️⃣ **Página: Split de Pagamento** (`/super-admin/payment-split`)

**Funcionalidades Previstas:**
- ✅ CRUD de regras de split
- ✅ Configuração por tipo (frequência, %, valor, tempo)
- ✅ Ativar/Desativar regras
- ✅ Definir gateway do admin
- ✅ Prioridade de regras
- ✅ Dashboard de distribuição
- ✅ Histórico de transações
- ✅ Estatísticas de receita

**Dashboard Exibe:**
- Total de transações
- Transações admin vs cliente (%)
- Receita admin vs cliente
- Gráficos de distribuição

---

## 🔧 COMO USAR

### **1. Aplicar Migration**

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor no Painel Supabase
# Copiar e executar: supabase/migrations/20250204000000_payment_split_and_plans_system.sql
```

### **2. Criar Planos**

1. Acessar `/super-admin/plans`
2. Clicar em "Novo Plano"
3. Configurar:
   - Nome, slug, descrição
   - Preço e intervalo
   - Limites diários de IA
   - Features e recursos
   - Taxas de transação
4. Salvar

**Exemplo de Plano:**
```json
{
  "name": "Plano Pro",
  "slug": "pro",
  "price": 199.90,
  "interval": "month",
  "maxAiMessagesDaily": 200,
  "maxAiImagesDaily": 100,
  "maxCheckoutPages": 10,
  "transactionFeePercentage": 2.5
}
```

### **3. Configurar Split de Pagamento**

1. Acessar `/super-admin/payment-split`
2. Clicar em "Nova Regra"
3. Escolher tipo:
   - **Frequência:** A cada 10 transações, 2 vão pro admin
   - **Percentual:** 20% das transações para admin
   - **Valor:** Transações acima de R$ 500
4. Selecionar gateway do admin
5. Definir prioridade
6. Ativar regra

### **4. Integração no Checkout**

```typescript
// No momento do checkout, consultar qual gateway usar
const result = await supabase.rpc('determine_split_gateway', {
  p_user_id: userId,
  p_order_value: orderTotal
});

if (result.data.decision === 'admin') {
  // Usar gateway do admin (você lucra 100%)
  gatewayId = result.data.gatewayId;
} else {
  // Usar gateway do cliente
  gatewayId = clientGatewayId;
}

// Registrar no log
await supabase.from('PaymentSplitLog').insert({
  orderId,
  userId,
  ruleId: result.data.ruleId,
  decision: result.data.decision,
  gatewayId,
  amount: orderTotal,
  adminRevenue: result.data.decision === 'admin' ? orderTotal : 0,
  clientRevenue: result.data.decision === 'client' ? orderTotal : 0,
  reason: result.data.reason
});
```

### **5. Verificar Limites de IA**

```typescript
// Antes de processar mensagem IA
const canUse = await supabase.rpc('increment_daily_usage', {
  p_user_id: userId,
  p_message_type: 'message' // ou 'image'
});

if (!canUse.data) {
  throw new Error('Limite diário de mensagens atingido');
}

// Processar mensagem...
```

---

## 📊 MÉTRICAS DISPONÍVEIS

### **Planos:**
- Total de planos
- Planos ativos
- Assinaturas ativas
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Assinantes por plano

### **Split de Pagamento:**
- Total de transações
- % Admin vs Cliente
- Receita admin vs cliente
- Estatísticas por regra
- Contador de alternância
- Última vez que regra foi aplicada

### **Uso Diário:**
- Mensagens IA usadas hoje
- Imagens IA usadas hoje
- Limite do plano
- % de uso

---

## 🎯 EXEMPLOS DE REGRAS

### Exemplo 1: Frequência
```
Nome: "Split 20% Admin"
Tipo: Frequência
A cada: 10 transações
Pegar: 2 transações
Gateway Admin: Mercado Pago SyncAds
Ativo: Sim
```
**Resultado:** A cada 10 vendas, 2 vão pro seu Mercado Pago (20% de lucro direto)

### Exemplo 2: Percentual
```
Nome: "Split 15% Probabilístico"
Tipo: Percentual
Percentual: 15%
Gateway Admin: Stripe SyncAds
Ativo: Sim
```
**Resultado:** 15% de TODAS as transações vão pro seu Stripe (distribuição aleatória)

### Exemplo 3: Valor
```
Nome: "Vendas Premium"
Tipo: Valor
Valor Mínimo: R$ 500
Gateway Admin: PagSeguro SyncAds
Ativo: Sim
```
**Resultado:** Todas as vendas acima de R$ 500 vão pro seu PagSeguro

### Exemplo 4: Por Cliente
```
Nome: "VIP Cliente X"
Tipo: Frequência
A cada: 20 transações
Pegar: 1 transação
Usuário: [ID do cliente VIP]
Prioridade: 10
Ativo: Sim
```
**Resultado:** Cliente VIP tem split diferenciado (apenas 5% pra você)

---

## 🔐 SEGURANÇA

### RLS Policies Aplicadas:

**PaymentSplitRule:**
- ✅ Super Admin: Controle total
- ✅ Usuários: Podem ver apenas regras aplicáveis a eles

**PaymentSplitLog:**
- ✅ Super Admin: Ver todos os logs
- ✅ Usuários: Ver apenas seus logs
- ✅ Sistema: Pode inserir logs

**PlanDailyUsage:**
- ✅ Usuários: Ver apenas seu próprio uso
- ✅ Super Admin: Ver todos os usos

---

## 📈 PRÓXIMOS PASSOS

### Fase 1 - Integração Checkout ✅ PRONTO
- [x] Migration aplicada
- [x] Páginas criadas
- [x] Funções SQL prontas
- [ ] Integrar no fluxo de checkout
- [ ] Testar split real

### Fase 2 - Analytics
- [ ] Dashboard de receita por fonte
- [ ] Gráficos de distribuição temporal
- [ ] Relatórios de performance por gateway
- [ ] Alertas de limites atingidos

### Fase 3 - Automação
- [ ] Webhook para Stripe (assinaturas)
- [ ] Email de notificação (limite atingido)
- [ ] Auto-upgrade de plano
- [ ] Cron job para reset diário

---

## 🐛 TROUBLESHOOTING

### Problema: Regra não está sendo aplicada
**Solução:**
1. Verificar se regra está ativa (`isActive = true`)
2. Verificar prioridade (maior número = maior prioridade)
3. Verificar se há regra específica do usuário (sobrescreve global)

### Problema: Contador não incrementa
**Solução:**
1. Verificar se função `determine_split_gateway` está sendo chamada
2. Verificar logs na tabela `PaymentSplitLog`
3. Rodar manualmente: `SELECT * FROM "PaymentSplitRule" WHERE id = '[rule_id]';`

### Problema: Limite diário não funciona
**Solução:**
1. Verificar se plano tem limite configurado (`maxAiMessagesDaily > 0`)
2. Executar: `SELECT * FROM "PlanDailyUsage" WHERE "userId" = '[user_id]' AND date = CURRENT_DATE;`
3. Rodar reset manual: `SELECT reset_daily_usage_counters();`

---

## 📞 SUPORTE

Para dúvidas ou problemas:
1. Verificar logs no Supabase
2. Consultar esta documentação
3. Revisar código das páginas implementadas
4. Testar funções SQL manualmente

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Migration SQL criada
- [x] Tabelas criadas e configuradas
- [x] Funções SQL implementadas
- [x] RLS Policies aplicadas
- [x] Página de Gestão de Planos criada
- [x] Página de Split de Pagamento criada
- [x] Rotas adicionadas no App.tsx
- [x] Menu atualizado no SuperAdminLayout
- [ ] Migration aplicada no banco
- [ ] Testado em desenvolvimento
- [ ] Integrado no checkout
- [ ] Testado com transações reais
- [ ] Documentação entregue

---

**FIM DO DOCUMENTO**