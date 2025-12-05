# 🚀 DEPLOY RAILWAY - BROWSER AUTOMATION

## ✅ PRÉ-REQUISITOS

- Git push realizado ✅
- Railway CLI instalado (opcional)
- Conta Railway conectada ao GitHub

---

## 📋 PASSO 1: VARIÁVEIS DE AMBIENTE

Adicionar no Railway Dashboard > Variables:

```bash
# Supabase (obrigatório)
SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI/Anthropic (opcional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...

# Playwright
PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
```

---

## 🔧 PASSO 2: CONFIGURAR BUILD

### Option A: Via Railway Dashboard

1. Abrir: https://railway.app/dashboard
2. Selecionar projeto: `syncads-python-service`
3. Settings > Deploy
4. **Build Command:**
```bash
pip install -r requirements.txt && playwright install chromium
```

5. **Start Command:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Option B: Via Railway CLI

```bash
cd python-service

# Login
railway login

# Link ao projeto
railway link

# Configurar build
railway run bash -c "pip install -r requirements.txt && playwright install chromium"

# Deploy
railway up
```

---

## 🐳 PASSO 3: DOCKERFILE (Alternativa)

Se preferir usar Docker, criar `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy app
COPY . .

# Expose port
EXPOSE 8000

# Start
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## ✅ PASSO 4: VERIFICAR DEPLOY

### 4.1 Health Check

```bash
curl https://syncads-python-service.railway.app/health

# Expected:
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-12-05T..."
}
```

### 4.2 Browser Automation Health

```bash
curl https://syncads-python-service.railway.app/api/browser-automation/health

# Expected:
{
  "status": "healthy",
  "playwright_available": true,
  "browser_use_available": true,
  "timestamp": "2025-12-05T..."
}
```

### 4.3 Capabilities

```bash
curl https://syncads-python-service.railway.app/api/browser-automation/capabilities

# Expected:
{
  "playwright": {
    "available": true,
    "browsers": ["chromium", "firefox", "webkit"]
  },
  "browser_use": {
    "available": true,
    "ai_powered": true
  },
  "actions": ["navigate", "click", "fill", "screenshot", ...],
  "features": ["headless_mode", "screenshot_capture", ...]
}
```

---

## 🧪 PASSO 5: TESTAR ENDPOINTS

### 5.1 Test Simple (Example.com)

```bash
curl -X GET "https://syncads-python-service.railway.app/api/browser-automation/test"

# Expected:
{
  "success": true,
  "message": "Browser automation is working",
  "test_url": "https://example.com",
  "page_title": "Example Domain"
}
```

### 5.2 Screenshot

```bash
curl -X POST "https://syncads-python-service.railway.app/api/browser-automation/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com", "full_page": true}'

# Expected:
{
  "success": true,
  "url": "https://google.com",
  "screenshot": "base64_encoded_image...",
  "timestamp": "2025-12-05T..."
}
```

### 5.3 Execute Automation (Estruturado)

```bash
curl -X POST "https://syncads-python-service.railway.app/api/browser-automation/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Navigate to google",
    "url": "https://google.com",
    "headless": true,
    "timeout": 30
  }'

# Expected:
{
  "success": true,
  "action": "Navigate to google",
  "result": {
    "actions_executed": 1,
    "results": [
      {
        "url": "https://google.com",
        "title": "Google"
      }
    ]
  },
  "execution_time": 2.5,
  "timestamp": "2025-12-05T..."
}
```

### 5.4 Execute with Actions

```bash
curl -X POST "https://syncads-python-service.railway.app/api/browser-automation/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Search on Google",
    "actions": [
      {
        "type": "navigate",
        "url": "https://google.com"
      },
      {
        "type": "fill",
        "selector": "input[name=q]",
        "value": "SyncAds"
      },
      {
        "type": "screenshot"
      }
    ],
    "headless": true
  }'
```

### 5.5 Scrape Page

```bash
curl -X POST "https://syncads-python-service.railway.app/api/browser-automation/scrape?url=https://example.com&selector=h1"

# Expected:
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  "content_length": 1234,
  "extracted": ["Example Domain"],
  "timestamp": "2025-12-05T..."
}
```

---

## 🔍 PASSO 6: VERIFICAR LOGS

### Via Railway Dashboard

1. Abrir: https://railway.app/dashboard
2. Selecionar projeto
3. Deployments > Latest > View Logs

### Via CLI

```bash
railway logs
```

### Logs Esperados

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
✅ Browser Automation: /api/browser-automation/* (Playwright + Browser-Use)
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Playwright not installed"

**Solução:**
```bash
# Via Railway Dashboard > Build Command:
pip install -r requirements.txt && playwright install chromium && playwright install-deps chromium
```

### Erro: "chromium executable doesn't exist"

**Solução:**
```bash
# Adicionar ao Dockerfile ou nixpacks.toml:
apt-get install -y libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 libxcb1 libxkbcommon0 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2
```

### Erro: "Browser timeout"

**Solução:**
- Aumentar timeout no request
- Verificar memória disponível no Railway (mínimo 512MB)
- Usar `headless: true`

### Erro: "Memory limit exceeded"

**Solução:**
1. Railway Dashboard > Settings > Resources
2. Aumentar memória para 1GB+
3. Usar `chromium` em vez de `firefox` ou `webkit` (mais leve)

---

## 📊 MONITORAMENTO

### Métricas Importantes

```bash
# CPU e Memória
railway metrics

# Request time
# Deve ser < 5s para navegação simples
# Deve ser < 15s para automação complexa

# Memory usage
# Chromium: ~200-400MB por instância
```

### Alertas Recomendados

- CPU > 80% por 5 minutos
- Memory > 90%
- Response time > 30s
- Error rate > 5%

---

## 🚀 INTEGRAÇÃO COM AI ROUTER

### Testar Fluxo Completo

```bash
# 1. Chamar AI Router
curl -X POST "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/ai-router" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"message": "navegue para google.com e busque SyncAds"}'

# 2. AI Router detecta e retorna:
{
  "provider": "PYTHON",
  "model": "browser-use + playwright",
  "pythonEndpoint": "https://syncads-python-service.railway.app/api/browser-automation/execute",
  "confidence": 95
}

# 3. Frontend chama Python Backend automaticamente
```

---

## ✅ CHECKLIST FINAL

- [ ] Push para GitHub realizado
- [ ] Railway detectou mudanças e iniciou build
- [ ] Build completou sem erros
- [ ] Playwright instalado (verificar logs)
- [ ] Health check retorna 200 OK
- [ ] `/api/browser-automation/health` retorna `playwright_available: true`
- [ ] `/api/browser-automation/test` funciona
- [ ] Screenshot endpoint funciona
- [ ] Execute endpoint funciona
- [ ] Logs não mostram erros críticos
- [ ] AI Router roteia corretamente para PYTHON

---

## 🎯 PRÓXIMOS PASSOS

Após deploy bem-sucedido:

1. ✅ Testar integração com AI Router
2. ✅ Implementar Browser-Use AI (natural language)
3. ✅ Adicionar cache de páginas
4. ✅ Implementar retry automático
5. ✅ Adicionar rate limiting
6. ✅ Metrics e observabilidade
7. ✅ Testes E2E automatizados

---

## 📚 DOCUMENTAÇÃO

- **API Docs:** https://syncads-python-service.railway.app/docs
- **ReDoc:** https://syncads-python-service.railway.app/redoc
- **Playwright Docs:** https://playwright.dev/python/
- **Browser-Use Docs:** https://github.com/browser-use/browser-use
- **Railway Docs:** https://docs.railway.app/

---

## 🆘 SUPORTE

Em caso de problemas:

1. Verificar logs: `railway logs`
2. Verificar variáveis: Railway Dashboard > Variables
3. Verificar build: Railway Dashboard > Deployments
4. Rollback se necessário: Railway Dashboard > Deployments > Previous > Redeploy

---

**Status:** 🚀 PRONTO PARA DEPLOY
**Tempo Estimado:** 5-10 minutos
**Dificuldade:** ⭐⭐ (Intermediário)

**Última Atualização:** 05/12/2025