# 🔧 GUIA: SETUP UPSTASH REDIS

## 1. Criar Conta e Database

1. Acesse: https://console.upstash.com
2. Crie uma conta (grátis para começar)
3. Clique em "Create Database"
4. Nome: `syncads-rate-limiter`
5. Região: `us-east-1` (ou mais próxima)
6. Tipo: `Redis`
7. Confirme criação

## 2. Obter Credenciais

Após criar o database:
1. Clique no database criado
2. Vá na aba "Details"
3. Copie:
   - `UPSTASH_REDIS_URL`: Ex: `https://syncads-12345.upstash.io`
   - `UPSTASH_REDIS_TOKEN`: Ex: `AXIxyz...`

## 3. Adicionar ao Supabase Secrets

**Via Supabase Dashboard:**

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Vá em **Settings** → **Edge Functions** → **Secrets**
3. Clique em "Add new secret"
4. Adicione:
   ```
   UPSTASH_REDIS_URL = https://syncads-12345.upstash.io
   ```
5. Clique em "Add new secret" novamente
6. Adicione:
   ```
   UPSTASH_REDIS_TOKEN = AXIxyz...
   ```
7. Salve

**Via CLI:**
```bash
supabase secrets set UPSTASH_REDIS_URL="https://syncads-12345.upstash.io"
supabase secrets set UPSTASH_REDIS_TOKEN="AXIxyz..."
```

## 4. Para Desenvolvimento Local

Adicione ao arquivo `.env.local`:
```
UPSTASH_REDIS_URL=https://syncads-12345.upstash.io
UPSTASH_REDIS_TOKEN=AXIxyz...
```

## 5. Validar Configuração

Execute no Supabase SQL Editor:
```sql
-- Testar se a função rate_limit está funcionando
SELECT checkRateLimit('test-user', 'test-endpoint', '{"maxRequests": 100, "windowMs": 60000}');
```

Ou veja os logs da Edge Function após uma requisição de chat:
```
⏱️ Rate limit check: OK (87/100 remaining)
```

## 6. Monitoramento

**Upstash Dashboard:**
- Ver quantidade de requests/min
- Ver latency
- Ver data usage

**Supabase Logs:**
- Monitorar logs de chat-stream
- Verificar se rate limiting está ativo
- Checar para HTTP 429 responses

## ✅ Teste Rápido

1. Envie 101 mensagens ao chat em < 1 minuto
2. 1ª-100ª: ✅ Deve passar
3. 101ª: ❌ Deve retornar HTTP 429
4. Logs devem mostrar: `⏱️ Rate limit exceeded`

## 🎯 Configuração Avançada

### Ajustar Limite por Endpoint

Edite `chat-stream/index.ts`:
```typescript
const rateLimitResult = await checkRateLimit(
  user.id,
  'chat-stream',
  { 
    maxRequests: 50, // Reduzir para 50/min
    windowMs: 60000 
  }
)
```

### Usar Different Limites para Diferentes Endpoints

```typescript
// Chat: 100 req/min
// Web search: 20 req/min
// File generation: 10 req/min
```

## 🔒 Segurança

- ✅ **Redis credentials** são seguros no Supabase Secrets
- ✅ **Rate limit** é por usuário (userId isolado)
- ✅ **Fail-open**: Se Redis falhar, permite requests (log de warning)
- ✅ **TTL automático**: Remove dados antigos automaticamente

## 📊 Pricing

**Upstash Free Tier:**
- 10,000 requests/day
- 256MB storage
- Perfeito para começar!

**Upstash Pay-as-you-go:**
- $0.20 per 100K requests
- Muito barato para produção

## ❓ Troubleshooting

**"Upstash Redis não configurado":**
→ Adicione secrets no Supabase

**"Rate limit not working":**
→ Check logs: deve ver `✅ Rate limit OK`

**"Always failing open":**
→ Verifique credenciais no Supabase Secrets

## 🎉 Concluído!

Agora você tem:
- ✅ Rate limiting funcional
- ✅ Upstash Redis conectado
- ✅ Proteção contra abuso
- ✅ Logs detalhados

Próximo: Adicionar API Keys (Exa, Tavily, Serper)

