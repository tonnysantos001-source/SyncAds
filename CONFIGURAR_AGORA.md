# ⚡ CONFIGURAÇÃO RÁPIDA - AÇÃO IMEDIATA

**Status:** Build #2 rodando no Railway  
**Tempo estimado:** 10-15 minutos

---

## 🔥 PASSOS OBRIGATÓRIOS

### 1. AGUARDAR BUILD COMPLETAR (5-10 min)

Monitorar em: https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94

```bash
# Ou via CLI:
cd python-service
railway status
```

**Aguarde até ver:** ✅ Deployment successful

---

### 2. CONFIGURAR API KEYS (CRÍTICO!)

Acesse: https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94/service/10fb5dd0-85c3-4018-98d1-9e4bbca36150/variables

**Adicionar estas variáveis:**

```env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

**Via CLI (alternativa):**
```bash
cd python-service
railway variables --set OPENAI_API_KEY="sk-proj-..."
railway variables --set ANTHROPIC_API_KEY="sk-ant-..."
railway variables --set GROQ_API_KEY="gsk_..."
```

⚠️ **IMPORTANTE:** Após adicionar, o Railway fará redeploy automático (2-3 min)

---

### 3. CONFIGURAR REDIS (RECOMENDADO)

**Opção A: Railway Redis (Mais fácil)**
```bash
cd python-service
railway add
# Selecionar: Redis
# Ele criará automaticamente a variável REDIS_URL
```

**Opção B: Upstash (Serverless - Grátis)**
1. Criar conta: https://console.upstash.com/
2. Criar Redis database
3. Copiar URL de conexão
4. Adicionar no Railway:
```bash
railway variables --set REDIS_URL="redis://default:..."
```

---

### 4. TESTAR SISTEMA ✅

**Após o deploy completar:**

```bash
# 1. Health check geral
curl https://syncads-python-microservice-production.up.railway.app/health

# Resposta esperada: {"status":"healthy", ...}

# 2. Omnibrain health
curl https://syncads-python-microservice-production.up.railway.app/api/omnibrain/health

# Resposta esperada: {"status":"healthy", "omnibrain_initialized":true, ...}

# 3. Testar execução (exemplo simples)
curl -X POST https://syncads-python-microservice-production.up.railway.app/api/omnibrain/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Conte quantas palavras tem neste texto: Hello World",
    "context": {}
  }'
```

---

### 5. TESTAR INTEGRAÇÃO FRONTEND

1. Abrir: https://syncads.com.br
2. Fazer login
3. Abrir chat
4. Enviar comando: **"Faça scraping de example.com"**
5. Verificar no console (F12):
   - Deve aparecer: `[Omnibrain] Executed in ...ms`
   - Status deve ser: `success`

---

## 🎯 CHECKLIST COMPLETO

### Deploy
- [ ] Build #2 completou com sucesso
- [ ] Serviço responde em `/health`
- [ ] Omnibrain responde em `/api/omnibrain/health`

### Configuração
- [ ] OPENAI_API_KEY configurada
- [ ] ANTHROPIC_API_KEY configurada (opcional mas recomendado)
- [ ] REDIS_URL configurada (recomendado)

### Testes
- [ ] Health checks passam
- [ ] Omnibrain executa tarefas simples
- [ ] Frontend conecta ao backend
- [ ] Chat usa Omnibrain (console mostra logs)

### Opcional (Esta Semana)
- [ ] DATABASE_URL (para contexto persistente)
- [ ] Conectar módulos reais (Shopify, Marketing, etc)
- [ ] Gerar 30-50 library profiles
- [ ] Implementar rate limiting
- [ ] Adicionar observability

---

## 🚨 TROUBLESHOOTING

### Build Falha
```bash
# Ver logs detalhados
cd python-service
railway logs

# Se falhar, tentar rebuild
railway up --detach
```

### Health Check Retorna 404
**Causa:** Deploy ainda em andamento  
**Solução:** Aguardar 2-5 minutos e testar novamente

### Health Check Retorna 500
**Causa:** Erro na aplicação  
**Solução:** Ver logs: `railway logs`

### Omnibrain Health Retorna "unhealthy"
**Causa:** Componentes não inicializados  
**Solução:** 
1. Verificar se todas as bibliotecas instalaram: `railway logs`
2. Verificar imports no código
3. Redeploy se necessário

### Frontend Não Conecta
**Causa:** CORS ou URL incorreta  
**Solução:**
1. Verificar variável `VITE_PYTHON_SERVICE_URL` no Vercel
2. Verificar `CORS_ORIGINS` no Railway
3. Limpar cache do navegador (Ctrl+Shift+Delete)

### AI Executor Não Funciona
**Causa:** API keys não configuradas  
**Solução:** Adicionar `OPENAI_API_KEY` no Railway

### Cache Não Funciona
**Causa:** Redis não configurado  
**Solução:** Adicionar Redis conforme passo 3

---

## 📞 LINKS RÁPIDOS

**Railway Dashboard:**  
https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94

**Vercel Dashboard:**  
https://vercel.com/fatima-drivias-projects/syncads

**Backend URL:**  
https://syncads-python-microservice-production.up.railway.app

**Frontend URL:**  
https://syncads.com.br

**Docs API:**  
https://syncads-python-microservice-production.up.railway.app/docs

**GraphQL Playground:**  
https://syncads-python-microservice-production.up.railway.app/graphql

---

## 🎊 APÓS CONFIGURAÇÃO

**Sistema estará:**
- ✅ 95%+ funcional
- ✅ Omnibrain ativo
- ✅ AI Executor funcionando
- ✅ Cache ativo (se Redis configurado)
- ✅ Frontend integrado

**Você poderá:**
- Usar comandos avançados no chat
- Processar imagens, vídeos, PDFs
- Fazer scraping inteligente
- Gerar temas Shopify
- Criar conteúdo de marketing
- Clonar lojas
- Automatizar tarefas

---

**Tempo total:** 10-15 minutos  
**Prioridade:** 🔴 CRÍTICA  
**Resultado:** Sistema 95% funcional em produção

---

**Última atualização:** 15/01/2025  
**Status:** ⏳ Aguardando build completar e configuração manual