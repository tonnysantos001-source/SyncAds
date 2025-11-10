# 🧪 TESTES CRÍTICOS PRÉ-LANÇAMENTO - SYNCADS

**⏰ Tempo Estimado:** 2-3 horas
**🎯 Objetivo:** Validar funcionalidades críticas antes do lançamento
**⚠️ BLOQUEIO:** Não lançar se algum teste CRÍTICO falhar

---

## 📋 ÍNDICE RÁPIDO

1. [Testes de Queries e Contadores](#1-testes-de-queries-e-contadores) - 30 min
2. [Teste Completo de Usuário](#2-teste-completo-de-usuário) - 45 min
3. [Testes de Gateway de Pagamento](#3-testes-de-gateway-de-pagamento) - 30 min
4. [Testes de IA](#4-testes-de-ia) - 20 min
5. [Testes de Segurança](#5-testes-de-segurança) - 30 min
6. [Checklist Final](#6-checklist-final) - 5 min

---

## 1. TESTES DE QUERIES E CONTADORES

### 🔴 CRÍTICO: Validar Integridade do Banco

**Abrir:** Supabase SQL Editor

#### Teste 1.1: Verificar Mensagens Órfãs
```sql
-- Não deve retornar linhas
SELECT cm.id, cm."userId", cm.content
FROM "ChatMessage" cm
LEFT JOIN "User" u ON cm."userId" = u.id
WHERE u.id IS NULL
LIMIT 10;
```
**✅ Resultado Esperado:** 0 linhas
**❌ Se falhar:** Limpar mensagens órfãs

#### Teste 1.2: Verificar Contagem de Mensagens por Usuário
```sql
-- Comparar com o que aparece no Super Admin
SELECT 
  u.email,
  u.name,
  COUNT(cm.id) as total_messages
FROM "User" u
LEFT JOIN "ChatMessage" cm ON cm."userId" = u.id
GROUP BY u.id, u.email, u.name
ORDER BY total_messages DESC
LIMIT 10;
```
**✅ Resultado Esperado:** Números devem bater com o painel Super Admin → Clientes
**🔍 Validar:** Abrir `https://seu-dominio/super-admin/clients` e comparar

#### Teste 1.3: Verificar Assinaturas Ativas
```sql
-- Validar assinaturas
SELECT 
  u.email,
  s.status,
  p.name as plan_name,
  p.price,
  s."currentPeriodEnd"
FROM "Subscription" s
JOIN "User" u ON s."userId" = u.id
JOIN "Plan" p ON s."planId" = p.id
WHERE s.status = 'active'
ORDER BY s."createdAt" DESC;
```
**✅ Resultado Esperado:** Todas as assinaturas ativas devem ter datas válidas
**❌ Se falhar:** Assinaturas expiradas com status 'active'

#### Teste 1.4: Verificar Campanhas Órfãs
```sql
-- Não deve retornar linhas
SELECT c.id, c.name, c."userId"
FROM "Campaign" c
LEFT JOIN "User" u ON c."userId" = u.id
WHERE u.id IS NULL;
```
**✅ Resultado Esperado:** 0 linhas

#### Teste 1.5: Validar Receita Total
```sql
-- Somar todas as faturas pagas
SELECT 
  COUNT(*) as total_invoices_paid,
  SUM(amount) as total_revenue_cents,
  SUM(amount) / 100 as total_revenue_reais
FROM "Invoice"
WHERE status = 'paid';
```
**✅ Resultado Esperado:** Comparar com Super Admin → Faturamento
**🔍 Validar:** `https://seu-dominio/super-admin/billing`

---

## 2. TESTE COMPLETO DE USUÁRIO

### 🔴 CRÍTICO: Fluxo End-to-End

#### Teste 2.1: Cadastro de Novo Usuário
1. **Abrir:** `https://seu-dominio/register`
2. **Preencher:**
   - Nome: `Teste Lançamento`
   - Email: `teste+launch@seudominio.com`
   - Senha: `Teste@2024`
3. **Verificar email:** Deve receber link de confirmação
4. **Clicar no link:** Deve redirecionar para login
5. **Fazer login:** Deve entrar no dashboard

**✅ Resultado Esperado:**
- ✅ Email enviado em < 10s
- ✅ Confirmação funciona
- ✅ Login bem-sucedido
- ✅ Dashboard carrega

**❌ Se falhar:** BLOQUEIO - Não lançar

#### Teste 2.2: Dashboard de Boas-Vindas
1. **Após login:** Verificar se mostra:
   - ✅ Nome do usuário
   - ✅ Plano atual (FREE)
   - ✅ Limite de mensagens IA
   - ✅ Botão "Criar Campanha"
   - ✅ Botão "Chat com IA"

**✅ Resultado Esperado:** Todas as informações visíveis e corretas

#### Teste 2.3: Chat com IA
1. **Ir para:** `https://seu-dominio/app/chat`
2. **Enviar mensagem:** "Olá! Me ajude a criar uma campanha de marketing"
3. **Aguardar resposta:** < 10 segundos

**✅ Resultado Esperado:**
- ✅ IA responde em < 10s
- ✅ Mensagem salva no banco
- ✅ Contador de uso atualiza

**Validar no SQL:**
```sql
SELECT content, role, "createdAt"
FROM "ChatMessage"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'teste+launch@seudominio.com')
ORDER BY "createdAt" DESC
LIMIT 5;
```

#### Teste 2.4: Criar Campanha Simples
1. **Ir para:** `https://seu-dominio/app/campaigns`
2. **Clicar:** "Nova Campanha"
3. **Preencher:**
   - Nome: `Campanha Teste Lançamento`
   - Produto: Selecionar qualquer
4. **Salvar**

**✅ Resultado Esperado:**
- ✅ Campanha criada
- ✅ Aparece na lista
- ✅ Salva no banco

**Validar no SQL:**
```sql
SELECT name, status, "createdAt"
FROM "Campaign"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'teste+launch@seudominio.com');
```

#### Teste 2.5: Testar Upgrade de Plano
1. **Ir para:** `https://seu-dominio/app/billing`
2. **Ver planos disponíveis**
3. **Clicar:** "Fazer Upgrade"
4. **Verificar:** Checkout abre corretamente

**✅ Resultado Esperado:**
- ✅ Planos visíveis com preços
- ✅ Botão de upgrade funciona
- ✅ Página de checkout carrega

---

## 3. TESTES DE GATEWAY DE PAGAMENTO

### 🔴 CRÍTICO: Pelo menos 1 gateway deve funcionar 100%

#### Teste 3.1: Identificar Gateways Ativos

**Abrir SQL Editor:**
```sql
-- Ver gateways configurados
SELECT 
  gateway,
  "isActive",
  "createdAt"
FROM "GatewayConfig"
WHERE "isActive" = true;
```

**✅ Resultado Esperado:** Pelo menos 1 gateway ativo

#### Teste 3.2: Testar Criação de PIX (Ambiente de Teste)

**⚠️ IMPORTANTE:** Usar credenciais de SANDBOX/TEST

1. **Ir para:** Super Admin → Gateways
2. **Selecionar gateway ativo**
3. **Verificar:** Credenciais de teste configuradas

**Criar transação de teste:**
```typescript
// No console do browser (DevTools)
// OU criar um endpoint de teste
const testPayment = {
  amount: 100, // R$ 1,00
  method: 'PIX',
  description: 'Teste de pagamento - Lançamento'
};

// Chamar API do gateway
// Verificar se gera QR Code
```

**✅ Resultado Esperado:**
- ✅ Transação criada
- ✅ QR Code gerado
- ✅ Status inicial: 'pending'

#### Teste 3.3: Simular Webhook de Pagamento

**Endpoint:** `https://seu-dominio/api/webhooks/[gateway]`

```bash
# Exemplo de teste manual (ajustar conforme gateway)
curl -X POST https://seu-dominio/api/webhooks/test-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "transaction_id": "TEST_123",
    "amount": 100
  }'
```

**✅ Resultado Esperado:**
- ✅ Webhook recebido
- ✅ Status atualizado no banco
- ✅ Logs registrados

**Validar:**
```sql
SELECT * FROM "PaymentTransaction"
WHERE "gatewayTransactionId" = 'TEST_123';
```

#### Teste 3.4: Validação de Segurança do Webhook

**🔴 CRÍTICO:** Webhooks DEVEM validar assinatura

**Verificar no código:**
```typescript
// src/lib/gateways/[gateway]/index.ts
// Procurar por:
// validateWebhookSignature()
```

**❌ Se não implementado:** 
- Marcar como BLOQUEIO
- Implementar antes do lançamento

---

## 4. TESTES DE IA

### 🟡 IMPORTANTE: IA deve responder corretamente

#### Teste 4.1: Verificar Conexões de IA Ativas

**SQL:**
```sql
SELECT 
  name,
  provider,
  model,
  "isActive"
FROM "GlobalAiConnection"
WHERE "isActive" = true;
```

**✅ Resultado Esperado:** Pelo menos 1 conexão ativa

#### Teste 4.2: Testar IA no Chat do Usuário

1. **Login como usuário teste**
2. **Ir para Chat:** `https://seu-dominio/app/chat`
3. **Testar perguntas:**
   - "Me ajude a criar uma campanha"
   - "Qual a melhor estratégia de marketing?"
   - "Como aumentar conversões?"

**✅ Resultado Esperado:**
- ✅ Responde em < 10s
- ✅ Respostas coerentes
- ✅ Não dá erro de API key
- ✅ Contador de uso atualiza

#### Teste 4.3: Verificar Limites de Uso

**SQL:**
```sql
-- Ver uso de IA do usuário
SELECT 
  u.email,
  s."usedAiMessages",
  p."maxAiMessages"
FROM "Subscription" s
JOIN "User" u ON s."userId" = u.id
JOIN "Plan" p ON s."planId" = p.id
WHERE u.email = 'teste+launch@seudominio.com';
```

**✅ Resultado Esperado:**
- ✅ `usedAiMessages` está correto
- ✅ Não excede `maxAiMessages`

#### Teste 4.4: Testar Bloqueio por Limite

1. **Se plano FREE tem limite de 50 mensagens**
2. **Criar script para enviar 51 mensagens**
3. **Verificar:** 51ª deve ser bloqueada

**✅ Resultado Esperado:**
- ✅ 50 mensagens processadas
- ✅ 51ª retorna erro "Limite atingido"
- ✅ Mostra mensagem para upgrade

---

## 5. TESTES DE SEGURANÇA

### 🔴 CRÍTICO: Segurança básica deve estar OK

#### Teste 5.1: RLS (Row Level Security) no Supabase

**Abrir:** Supabase → Table Editor → User

**Testar:**
1. **Sem login:** Não deve conseguir ver usuários
2. **Com login:** Deve ver apenas próprios dados

**Validar RLS Policies:**
```sql
-- Ver policies da tabela User
SELECT * FROM pg_policies 
WHERE tablename = 'User';

-- Ver policies da tabela ChatMessage
SELECT * FROM pg_policies 
WHERE tablename = 'ChatMessage';
```

**✅ Resultado Esperado:**
- ✅ Policies ativas
- ✅ Usuário só vê próprios dados

#### Teste 5.2: Testar SQL Injection (Básico)

**No campo de busca do chat ou campanha:**
```
' OR '1'='1
1'; DROP TABLE "User"; --
```

**✅ Resultado Esperado:**
- ✅ Nenhum erro exposto
- ✅ Query não executa
- ✅ Inputs sanitizados

#### Teste 5.3: Rate Limiting

**Testar:**
1. **Fazer 100 requests rápidas** para `/api/chat`
2. **Verificar:** Deve bloquear após X requests

**✅ Resultado Esperado:**
- ✅ Rate limit funciona
- ✅ Retorna 429 (Too Many Requests)

#### Teste 5.4: Validar API Keys

**Verificar:**
```bash
# .env deve ter:
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # Nunca expor no frontend!
OPENAI_API_KEY=
```

**🔴 CRÍTICO:**
- ❌ SERVICE_ROLE_KEY nunca deve estar no código frontend
- ❌ API Keys nunca devem estar em commits Git
- ✅ Usar variáveis de ambiente

---

## 6. CHECKLIST FINAL

### ✅ Antes de Lançar

#### Frontend
- [ ] Build sem erros (`npm run build`)
- [ ] Sem console.errors em produção
- [ ] Todas as páginas carregam
- [ ] Tema DARK aplicado em todo lugar
- [ ] Mobile responsivo funciona
- [ ] Imagens otimizadas

#### Backend
- [ ] Todas as queries funcionam
- [ ] RLS policies ativas
- [ ] Webhooks validados
- [ ] Pelo menos 1 gateway 100% funcional
- [ ] Backup do banco feito

#### IA
- [ ] Pelo menos 1 provider ativo
- [ ] Limites de uso funcionam
- [ ] Respostas em < 10s
- [ ] Contador de uso correto

#### Pagamentos
- [ ] Gateway testado end-to-end
- [ ] Webhooks funcionando
- [ ] Status atualiza corretamente
- [ ] Faturas sendo geradas

#### Segurança
- [ ] RLS ativo
- [ ] API Keys protegidas
- [ ] Rate limiting funciona
- [ ] Inputs sanitizados

#### Monitoramento
- [ ] Logs configurados
- [ ] Alertas de erro ativos
- [ ] Dashboard de métricas
- [ ] Backup automático

---

## 🚨 BLOQUEIOS - NÃO LANÇAR SE:

- 🔴 Nenhum gateway de pagamento funciona
- 🔴 IA não responde
- 🔴 Cadastro/Login quebrado
- 🔴 Queries retornam dados incorretos
- 🔴 RLS desativado
- 🔴 API Keys expostas no frontend
- 🔴 Webhooks não validam assinatura

---

## ✅ PODE LANÇAR SE:

- ✅ Todos os testes CRÍTICOS passam
- ✅ Pelo menos 1 gateway 100% funcional
- ✅ IA funcionando normalmente
- ✅ Queries corretas
- ✅ Segurança básica OK

---

## 📊 REGISTRO DE TESTES

### Data: ___/___/2024
### Responsável: _______________

| Teste | Status | Tempo | Observações |
|-------|--------|-------|-------------|
| 1.1 - Mensagens Órfãs | ⬜ | ___min | |
| 1.2 - Contagem Mensagens | ⬜ | ___min | |
| 1.3 - Assinaturas Ativas | ⬜ | ___min | |
| 1.4 - Campanhas Órfãs | ⬜ | ___min | |
| 1.5 - Receita Total | ⬜ | ___min | |
| 2.1 - Cadastro Usuário | ⬜ | ___min | |
| 2.2 - Dashboard | ⬜ | ___min | |
| 2.3 - Chat IA | ⬜ | ___min | |
| 2.4 - Criar Campanha | ⬜ | ___min | |
| 2.5 - Upgrade Plano | ⬜ | ___min | |
| 3.1 - Gateways Ativos | ⬜ | ___min | |
| 3.2 - Criar PIX Teste | ⬜ | ___min | |
| 3.3 - Simular Webhook | ⬜ | ___min | |
| 3.4 - Validar Webhook | ⬜ | ___min | |
| 4.1 - IA Ativa | ⬜ | ___min | |
| 4.2 - Testar Chat IA | ⬜ | ___min | |
| 4.3 - Limites Uso | ⬜ | ___min | |
| 4.4 - Bloqueio Limite | ⬜ | ___min | |
| 5.1 - RLS Policies | ⬜ | ___min | |
| 5.2 - SQL Injection | ⬜ | ___min | |
| 5.3 - Rate Limiting | ⬜ | ___min | |
| 5.4 - API Keys | ⬜ | ___min | |

**RESULTADO FINAL:** ⬜ APROVADO  /  ⬜ REPROVADO

**Observações Finais:**
```
_______________________________________________________
_______________________________________________________
_______________________________________________________
```

---

**✅ APROVAÇÃO PARA LANÇAMENTO**

Eu, _________________, confirmo que todos os testes críticos foram executados e aprovados.

Data: ___/___/2024
Assinatura: _________________

---

*Documento criado para auditoria pré-lançamento do SyncAds*
*Validade: 48 horas antes do lançamento*