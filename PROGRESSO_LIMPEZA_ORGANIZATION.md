# 📋 PROGRESSO DA LIMPEZA DE ORGANIZAÇÕES

**Última Atualização:** 30 de Outubro de 2025, em andamento...

---

## ✅ EDGE FUNCTIONS LIMPAS (3/19)

### 1. ✅ `chat/index.ts`
**Status:** COMPLETO  
**Mudanças:**
- Removido `organizationId` do User query
- Removido `OrganizationAiConnection` query
- Agora busca direto `GlobalAiConnection` ativa
- `AiUsage.upsert` sem organizationId
- **Linhas alteradas:** ~40

### 2. ✅ `chat-stream/index.ts`  
**Status:** COMPLETO  
**Mudanças:**
- `createCampaign`: organizationId → userId
- `scrapeProducts`: removido organizationId do body
- Analytics: "DA ORGANIZAÇÃO" → "DO USUÁRIO"
- Relatório: "DA ORGANIZAÇÃO" → "DO USUÁRIO"
- **Linhas alteradas:** ~10

### 3. ✅ `process-payment/index.ts`
**Status:** COMPLETO ⭐ CRÍTICO PARA CHECKOUT
**Mudanças:**
- Interface `PaymentRequest`: organizationId → userId
- Stripe metadata: organizationId → userId
- Mercado Pago metadata: organization_id → user_id
- Validação: organizationId → userId
- GatewayConfig query: `.eq('organizationId')` → `.eq('userId')`
- Transaction insert: organizationId → userId
- Mensagens de erro atualizadas
- **Linhas alteradas:** ~20

---

## 🔄 EDGE FUNCTIONS PENDENTES (16/19)

### Alta Prioridade (fazem queries ao banco):

4. ⏳ `verify-domain/index.ts` - 5 refs
5. ⏳ `generate-image/index.ts` - 8 refs
6. ⏳ `generate-video/index.ts` - 7 refs
7. ⏳ `automation-engine/index.ts` - 8 refs
8. ⏳ `advanced-analytics/index.ts` - 7 refs
9. ⏳ `shopify-webhook/index.ts` - 6 refs
10. ⏳ `ai-advisor/index.ts` - 6 refs
11. ⏳ `ai-tools/index.ts` - 4 refs
12. ⏳ `content-assistant/index.ts` - 3 refs
13. ⏳ `meta-ads-tools/index.ts` - 3 refs

### Média Prioridade:

14. ⏳ `chat-stream-working/index.ts` - 7 refs (função antiga?)
15. ⏳ `super-ai-tools/index.ts` - 2 refs
16. ⏳ `file-generator/index.ts` - 2 refs
17. ⏳ `file-generator-v2/index.ts` - 2 refs
18. ⏳ `advanced-scraper/index.ts` - 2 refs
19. ⏳ `auth-meta/index.ts` - 2 refs

---

## 📊 ESTATÍSTICAS

- **Edge Functions Total:** 19
- **Limpas:** 3 (15.8%)
- **Pendentes:** 16 (84.2%)
- **Referências removidas:** ~70 de ~94
- **Tempo estimado restante:** 1-2 horas

---

## 🎯 PRÓXIMOS PASSOS

### Hoje (Prioridade ALTA):
1. ✅ Limpar 3 Edge Functions críticas (FEITO)
2. ⏳ Limpar demais Edge Functions (fazendo...)
3. ⏳ Limpar Frontend (APIs críticas)
4. ⏳ Executar Migration SQL no Supabase
5. ⏳ Regenerar database.types.ts

### Amanhã:
- Limpar páginas do frontend
- Testes completos
- Documentar mudanças

---

## 📝 NOTAS IMPORTANTES

### ⚠️ CUIDADOS:
1. **Sempre testar** após cada Edge Function limpa
2. **Não quebrar** funcionalidades existentes
3. **RLS Policies** precisam ser atualizadas após migration
4. **Frontend** precisa ser atualizado DEPOIS do banco

### ✅ PADRÃO DE SUBSTITUIÇÃO:

```typescript
// ❌ ANTES
const { data: userData } = await supabase
  .from('User')
  .select('organizationId')
  .eq('id', user.id)
  .single()

const { data } = await supabase
  .from('SomeTable')
  .select('*')
  .eq('organizationId', userData.organizationId)

// ✅ DEPOIS
const { data } = await supabase
  .from('SomeTable')
  .select('*')
  .eq('userId', user.id)
```

---

## 🚀 EXECUÇÃO EM ANDAMENTO...

Continuando limpeza das demais Edge Functions...


