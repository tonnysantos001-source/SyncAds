# 🚀 Deployment Checklist

Checklist completo para deploy seguro em produção.

---

## 📋 Pré-Deploy

### Código
- [ ] Todos os arquivos commitados em Git
- [ ] CHANGELOG.md atualizado
- [ ] Versão incrementada (semver)
- [ ] Build local passando sem erros
- [ ] Linter passando
- [ ] Testes passando (se existentes)

### Verificações
- [ ] Score >= 90/100
- [ ] Estrutura de arquivos correta
- [ ] Imports sem erros
- [ ] Edge Functions sem erros de sintaxe
- [ ] Frontend build sem warnings críticos

### Configurações
- [ ] API Keys configuradas no Supabase Secrets
  - [ ] EXA_API_KEY
  - [ ] TAVILY_API_KEY
  - [ ] SERPER_API_KEY
  - [ ] OPENAI_API_KEY (opcional)
  - [ ] ANTHROPIC_API_KEY (opcional)
- [ ] Upstash Redis configurado (opcional)
  - [ ] UPSTASH_REDIS_URL
  - [ ] UPSTASH_REDIS_TOKEN
- [ ] Supabase Storage limpo
  - [ ] Bucket `temp-downloads` existe
  - [ ] Policies RLS configuradas
- [ ] Variáveis de ambiente no Vercel
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY

---

## 🚀 Deploy

### Edge Functions
```bash
# Deploy de todas as funções
supabase functions deploy

# Deploy específico
supabase functions deploy chat-stream
supabase functions deploy file-generator-v2
```

### Frontend
```bash
# Build local
npm run build

# Commit e push (Vercel auto-deploy)
git add .
git commit -m "chore: bump to v1.0.0"
git push origin main

# Monitorar deploy
# Acessar: https://vercel.com/dashboard
```

### Verificações Pós-Deploy
- [ ] Verificar logs no Supabase Dashboard
  - [ ] Sem erros 500
  - [ ] Rate limiting funcionando
  - [ ] Circuit breaker ativo
- [ ] Testar funcionalidades críticas:
  - [ ] Login/logout
  - [ ] Chat com IA (1 mensagem completa)
  - [ ] Web search
  - [ ] Download de arquivo (XLSX)
  - [ ] Rate limit (fazer 101 requests)
- [ ] Verificar métricas:
  - [ ] Total de requisições
  - [ ] Taxa de erro < 1%
  - [ ] Tempo médio de resposta < 2s

---

## 📊 Pós-Deploy

### Monitoramento (Primeiras 24h)
- [ ] Monitorar métricas por 1 hora
- [ ] Verificar taxa de erro
- [ ] Verificar rate limiting
- [ ] Verificar circuit breaker
- [ ] Verificar timeouts
- [ ] Acompanhar logs de erro

### Comunicação
- [ ] Notificar usuários de downtime (se houver)
- [ ] Atualizar status page
- [ ] Manter CHANGELOG atualizado

### Rollback (se necessário)
```bash
# Rollback Edge Functions
supabase functions deploy --rollback chat-stream

# Rollback Vercel
# Acessar Dashboard → Deployments → 3 dots → Redeploy previous deployment
```

---

## 🧪 Testes de Produção

### Teste 1: Chat Completo
```bash
# Enviar mensagem
curl -X POST https://[project].supabase.co/functions/v1/chat-stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Olá","conversationId":"conv-123"}'

# Verificar resposta
# Esperado: 200 OK com resposta da IA
```

### Teste 2: Rate Limit
```bash
# Fazer 101 requests em < 1 minuto
for i in {1..101}; do
  curl -X POST https://[project].supabase.co/functions/v1/chat-stream \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"test","conversationId":"conv-123"}'
done

# Verificar resposta 101
# Esperado: 429 Too Many Requests
```

### Teste 3: Download de Arquivo
```bash
# Gerar XLSX
curl -X POST https://[project].supabase.co/functions/v1/file-generator-v2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format":"xlsx",
    "data":[{"name":"Test","value":123}],
    "userId":"user-123",
    "organizationId":"org-123",
    "conversationId":"conv-123"
  }'

# Verificar resposta
# Esperado: 200 OK com signedUrl
```

### Teste 4: Circuit Breaker
```bash
# Remover API key temporariamente
# Enviar 5 requests falhando
# 6ª request deve retornar erro imediatamente
# Aguardar 60s
# Testar recovery
```

---

## 📈 Métricas Esperadas

### Performance
- ✅ Response time < 2 segundos
- ✅ Success rate > 99%
- ✅ Error rate < 1%
- ✅ Uptime > 99.9%

### Rate Limiting
- ✅ 100 req/min por usuário
- ✅ HTTP 429 quando excedido
- ✅ Retry-After header correto

### Circuit Breaker
- ✅ 5 falhas = OPEN (60s)
- ✅ Fallback automático funcionando
- ✅ Logs de cada tentativa

---

## ⚠️ Problemas Comuns

### Erro: "Invalid API Key"
**Causa:** API keys não configuradas no Supabase Secrets  
**Solução:** Adicionar keys em Settings → Edge Functions → Secrets

### Erro: "Rate limit exceeded"
**Causa:** Upstash Redis não configurado ou falhou  
**Solução:** Sistema faz fail-open, aceita requests mas sem limite

### Erro: "Circuit breaker OPEN"
**Causa:** 5 falhas consecutivas na API  
**Solução:** Aguardar 60s ou verificar API key

### Erro: "Timeout after 10s"
**Causa:** Requisição muito lenta  
**Solução:** Tenta fallback automaticamente

---

## 📞 Suporte

**Emergências:**
- Email: support@syncads.com
- WhatsApp: +55 11 99999-9999
- Slack: #dev-alerts

**Docs:**
- API: /api/docs
- OpenAPI: /docs/openapi.json
- Status: /status.html

---

**Última Atualização:** 2025-10-26  
**Versão:** v1.0.0

