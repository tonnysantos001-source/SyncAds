# 🚀 DEPLOY RAILWAY - SYNCADS PYTHON MICROSERVICE

**Data do Deploy:** 18/01/2025  
**Horário:** Agora (em andamento)  
**Status:** 🔄 BUILDING (2ª tentativa - PORT corrigido)

---

## 🔗 LINKS IMPORTANTES

### 📊 Acompanhar Build e Logs
**Link Principal dos Logs (ATUALIZADO):**
```
https://railway.com/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94/service/10fb5dd0-85c3-4018-98d1-9e4bbca36150?id=8ff2e991-2696-415c-927b-8ee318c133a4
```

**Deploy Anterior (Falhou - PORT issue):**
```
https://railway.com/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94/service/10fb5dd0-85c3-4018-98d1-9e4bbca36150?id=62edb7e9-60d5-4b78-9a23-4937aaf407d3
```

### 🌐 URL do Serviço (Quando Ativo)
```
https://syncads-python-microservice-production.up.railway.app
```

### 🏥 Health Check Endpoint
```
https://syncads-python-microservice-production.up.railway.app/health
```

### 📚 Documentação API (Quando Ativo)
```
https://syncads-python-microservice-production.up.railway.app/docs
```

---

## 📋 INFORMAÇÕES DO PROJETO

| Item | Valor |
|------|-------|
| **Project ID** | `5f47519b-0823-45aa-ab00-bc9bcaaa1c94` |
| **Service ID** | `10fb5dd0-85c3-4018-98d1-9e4bbca36150` |
| **Deployment ID** | `8ff2e991-2696-415c-927b-8ee318c133a4` (atual) |
| **Environment** | `production` |
| **Region** | `us-west2` |
| **Builder** | `DOCKERFILE` |
| **Runtime** | `V2` |

---

## ⚠️ CORREÇÃO APLICADA

**Problema Identificado:**
```
Error: Invalid value for '--port': '$PORT' is not a valid integer.
```

**Causa:**
O Dockerfile estava usando JSON array format no CMD, que não expande variáveis de ambiente.

**Solução Aplicada:**
```dockerfile
# ANTES (quebrado):
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

# DEPOIS (corrigido):
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
```

Agora usando shell form com expansão de variável `${PORT:-8000}` (fallback para 8000 se PORT não estiver definida).

---

## 🏗️ CONFIGURAÇÃO DO BUILD

### Dockerfile
- ✅ Python 3.11-slim
- ✅ Virtual environment (/opt/venv)
- ✅ 150+ bibliotecas instaladas
- ✅ FastAPI + Uvicorn
- ✅ OmniBrain modules completos

### Start Command
```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
```

### Health Check
- **Path:** `/health`
- **Timeout:** 30 segundos
- **Interval:** 30 segundos
- **Retries:** 3

---

## 📦 ESTRUTURA DEPLOYADA

```
python-service/
├── Dockerfile ✅
├── railway.json ✅ (NOVO)
├── requirements.txt ✅
├── app/
│   ├── main.py (FastAPI app)
│   ├── ai_tools.py
│   ├── omnibrain/ (6 módulos)
│   ├── routers/ (10+ routers)
│   └── services/
└── .railwayignore ✅
```

---

## 🔧 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Configure no Railway Dashboard se ainda não estiverem:

```env
# Supabase
SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# AI Providers (Opcional - usa GlobalAIConnection)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...

# Environment
PORT=8000
PYTHONUNBUFFERED=1
```

---

## 📊 COMO ACOMPANHAR O DEPLOY

### 1️⃣ Via Railway Dashboard (RECOMENDADO)
Acesse o link dos logs acima e acompanhe em tempo real:
- Build logs
- Deploy logs
- Runtime logs
- Crash reports (se houver)

### 2️⃣ Via Railway CLI
```bash
cd python-service

# Ver logs em tempo real
railway logs --follow

# Ver status
railway status

# Ver últimas builds
railway list
```

### 3️⃣ Testar Depois de Deployado
```bash
# Health check
curl https://syncads-python-microservice-production.up.railway.app/health

# Esperado:
# {
#   "status": "healthy",
#   "omnibrain": "100%",
#   "timestamp": "2025-01-18T..."
# }
```

---

## ⏱️ TEMPO ESTIMADO

| Fase | Tempo Estimado | Status |
|------|----------------|--------|
| **Upload** | 30s - 1min | ✅ Concluído |
| **Build** | 5-10 minutos | 🔄 Em andamento |
| **Deploy** | 30s - 1min | ⏳ Aguardando |
| **Health Check** | 30s - 1min | ⏳ Aguardando |
| **TOTAL** | **7-13 minutos** | 🔄 Em progresso |

---

## ✅ CHECKLIST DE SUCESSO

Quando o deploy terminar, verifique:

- [ ] Build passou sem erros
- [ ] Service está com status "RUNNING"
- [ ] Health check retorna 200 OK
- [ ] `/docs` carrega a documentação Swagger
- [ ] `/health` retorna JSON com status "healthy"
- [ ] Logs não mostram erros críticos
- [ ] Teste um endpoint simples

---

## 🚨 SE HOUVER ERRO

### Erro: Dependências não instaladas
**Causa:** requirements.txt faltando bibliotecas
**Solução:** Verificar requirements.txt e adicionar dependência faltante

### Erro: Port binding failed
**Causa:** Aplicação não está usando a variável $PORT
**Solução:** Já corrigido - usando `--port $PORT`

### Erro: Health check failed
**Causa:** App não iniciou ou rota /health não existe
**Solução:** Verificar logs e confirmar que main.py tem rota /health

### Erro: Import failed
**Causa:** Módulo Python não encontrado
**Solução:** Adicionar ao requirements.txt e re-deploy

---

## 🔄 RE-DEPLOY SE NECESSÁRIO

```bash
cd python-service

# Fazer mudanças necessárias
# vim requirements.txt

# Re-deploy
railway up --detach

# Acompanhar
railway logs --follow
```

---

## 📱 NOTIFICAÇÕES

### Via Railway CLI
```bash
# Receber notificação quando deploy terminar
railway logs --follow | grep -i "ready\|error\|crashed"
```

### Via Dashboard
- Railway envia notificações no dashboard
- Email notifications (se configurado)

---

## 🎯 ENDPOINTS DISPONÍVEIS (QUANDO ATIVO)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Root (info do serviço) |
| `/health` | GET | Health check |
| `/docs` | GET | Swagger UI |
| `/redoc` | GET | ReDoc |
| `/omnibrain/execute` | POST | Executar task OmniBrain |
| `/automation/*` | POST | Rotas de automação |
| `/scraping/*` | POST | Rotas de scraping |
| `/images/*` | POST | Geração de imagens |
| `/python/execute` | POST | Executar Python |

---

## 📞 SUPORTE

**Se o deploy falhar:**
1. Copie os logs do Railway Dashboard
2. Verifique o erro específico
3. Consulte `PADROES_ERRO_EVITAR.md`
4. Ajuste e re-deploy

**Arquivos de Referência:**
- `DEPLOY_INSTRUCTIONS.txt`
- `GUIA_DEPLOY_RAILWAY.md`
- `SYSTEM_100_PERCENT.md`
- `OMNIBRAIN_100_READY.md`

---

## 🎉 PRÓXIMOS PASSOS (APÓS DEPLOY SUCESSO)

1. ✅ Testar health check
2. ✅ Testar endpoint /docs
3. ✅ Integrar com Edge Functions do Supabase
4. ✅ Atualizar variável RAILWAY_URL no frontend
5. ✅ Testar chamada completa: Frontend → Supabase → Railway
6. ✅ Monitorar logs por algumas horas
7. ✅ Configurar alertas (opcional)

---

**🔥 ACOMPANHE O BUILD AGORA (LINK ATUALIZADO):**
👉 https://railway.com/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94/service/10fb5dd0-85c3-4018-98d1-9e4bbca36150?id=8ff2e991-2696-415c-927b-8ee318c133a4

**Status será atualizado em tempo real no link acima.**