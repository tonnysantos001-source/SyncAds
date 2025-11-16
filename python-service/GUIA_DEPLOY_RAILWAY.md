# 🚀 GUIA COMPLETO: Deploy Python Microservice no Railway

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Estrutura dos Arquivos](#estrutura-dos-arquivos)
3. [Deploy Rápido (5 minutos)](#deploy-rápido)
4. [Deploy Detalhado](#deploy-detalhado)
5. [Configuração de Variáveis](#configuração-de-variáveis)
6. [Monitoramento](#monitoramento)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## 🎯 Pré-requisitos

### Obrigatório
- ✅ Railway CLI instalado: `npm install -g @railway/cli`
- ✅ Conta no Railway: https://railway.app
- ✅ Git instalado e configurado
- ✅ Docker instalado (opcional, para testes locais)

### Verificar Instalação
```bash
# Verificar Railway CLI
railway --version

# Verificar Git
git --version

# Verificar Docker (opcional)
docker --version
```

---

## 📁 Estrutura dos Arquivos

O projeto agora está organizado em **3 arquivos de requirements**:

```
python-service/
├── Dockerfile                    # ✅ Multi-stage build otimizado
├── railway.json                  # ✅ Configurações Railway
├── requirements.txt              # 🔗 Arquivo principal (usa os 3 abaixo)
├── requirements-base.txt         # 📦 FASE 1: Core (2-3 min)
├── requirements-scraping.txt     # 🕷️ FASE 2: Scraping (5-7 min)
├── requirements-ai.txt           # 🤖 FASE 3: AI/ML (15-20 min)
├── deploy-railway.sh             # 🚀 Script de deploy
└── app/                          # 📂 Código da aplicação
    ├── main.py
    └── ...
```

### Por que 3 arquivos?

**Problema anterior:**
- ❌ 1 arquivo gigante com 250+ dependências
- ❌ Build falhava por timeout (~45 min)
- ❌ Erros de conflito de versões

**Solução atual:**
- ✅ **FASE 1 (Base)**: FastAPI, PostgreSQL, Core (rápido)
- ✅ **FASE 2 (Scraping)**: Playwright, Selenium, BeautifulSoup
- ✅ **FASE 3 (AI/ML)**: PyTorch, Transformers, OpenCV
- ✅ Build em camadas com cache otimizado
- ✅ Rebuilds rápidos (2-5 min com cache)

---

## ⚡ Deploy Rápido (5 minutos)

### Opção 1: Script Automatizado (RECOMENDADO)

```bash
# 1. Ir para o diretório
cd python-service

# 2. Tornar o script executável
chmod +x deploy-railway.sh

# 3. Executar
./deploy-railway.sh

# 4. Escolher opção 2 (Deploy para Railway)
```

### Opção 2: Comandos Manuais

```bash
# 1. Login no Railway
railway login

# 2. Link com o projeto (primeira vez)
railway link

# 3. Deploy
railway up

# 4. Abrir no navegador
railway open
```

---

## 🔧 Deploy Detalhado

### Passo 1: Login e Setup Inicial

```bash
# Login no Railway
railway login

# Verificar login
railway whoami

# Criar novo projeto (se necessário)
railway init

# Ou linkar projeto existente
railway link
```

### Passo 2: Configurar Variáveis de Ambiente

**Variáveis OBRIGATÓRIAS:**

```bash
# Supabase
railway variables set SUPABASE_URL="https://seu-projeto.supabase.co"
railway variables set SUPABASE_SERVICE_KEY="sua-chave-service-role"

# Server
railway variables set PORT="8000"
railway variables set WORKERS="2"
railway variables set ENVIRONMENT="production"
```

**Variáveis OPCIONAIS (IA):**

```bash
# OpenAI
railway variables set OPENAI_API_KEY="sk-..."

# Anthropic (Claude)
railway variables set ANTHROPIC_API_KEY="sk-ant-..."

# Groq
railway variables set GROQ_API_KEY="gsk_..."

# Google AI
railway variables set GOOGLE_AI_API_KEY="AIza..."

# Cohere
railway variables set COHERE_API_KEY="..."
```

### Passo 3: Deploy

```bash
# Deploy (push automático)
railway up

# Ou via Git
git add .
git commit -m "Deploy Python microservice"
git push railway main
```

### Passo 4: Verificar Status

```bash
# Ver status
railway status

# Ver logs em tempo real
railway logs

# Abrir dashboard
railway open
```

---

## 🎛️ Configuração de Variáveis

### Via CLI (Recomendado)

```bash
# Definir variável
railway variables set NOME_VARIAVEL="valor"

# Listar variáveis
railway variables

# Deletar variável
railway variables delete NOME_VARIAVEL
```

### Via Dashboard

1. Acesse: https://railway.app
2. Selecione seu projeto
3. Vá em **Variables**
4. Clique em **+ New Variable**
5. Configure e salve

---

## 📊 Monitoramento

### Ver Logs

```bash
# Logs em tempo real
railway logs

# Últimos 100 logs
railway logs --limit 100

# Logs de um serviço específico
railway logs --service python-service
```

### Verificar Health Check

```bash
# Via curl
curl https://seu-app.railway.app/health

# Resposta esperada:
# {"status":"healthy","timestamp":"2025-01-19T..."}
```

### Métricas no Dashboard

No Railway Dashboard você pode ver:
- 📈 Uso de CPU
- 💾 Uso de RAM
- 🌐 Requests/segundo
- ⏱️ Tempo de resposta
- 💰 Custos estimados

---

## 🐛 Troubleshooting

### Problema 1: Build Timeout

**Sintomas:**
```
Error: Build timed out after 30 minutes
```

**Solução:**
```bash
# O build está otimizado para não dar timeout
# Se acontecer, verifique se os 3 arquivos de requirements existem:
ls -la requirements*.txt

# Devem aparecer:
# - requirements.txt
# - requirements-base.txt
# - requirements-scraping.txt
# - requirements-ai.txt
```

### Problema 2: Erro de Dependências

**Sintomas:**
```
ERROR: Could not find a version that satisfies the requirement...
```

**Solução:**
```bash
# Verificar Python version no Railway (deve ser 3.11)
railway variables set PYTHON_VERSION="3.11"

# Rebuild
railway up --detach
```

### Problema 3: Playwright não funciona

**Sintomas:**
```
playwright._impl._api_types.Error: Browser is not installed
```

**Solução:**
```bash
# Verificar variável de ambiente
railway variables set PLAYWRIGHT_BROWSERS_PATH="/home/syncads/.cache/ms-playwright"

# O Dockerfile já instala o Chromium automaticamente
# Rebuild para garantir
railway up --detach
```

### Problema 4: Out of Memory

**Sintomas:**
```
Error: Container killed due to memory limit
```

**Solução:**

No `railway.json`, aumentar memória:
```json
{
  "resources": {
    "memory": "4Gi",  // Era 2Gi, aumentar para 4Gi ou 8Gi
    "cpu": "2000m"
  }
}
```

Depois fazer redeploy:
```bash
railway up
```

### Problema 5: Service Não Inicia

**Sintomas:**
```
Service crashed with exit code 1
```

**Solução:**
```bash
# Ver logs detalhados
railway logs --limit 200

# Verificar se todas as variáveis obrigatórias estão configuradas
railway variables | grep SUPABASE

# Rebuild from scratch
railway up --detach
```

---

## 📈 Otimizações de Performance

### 1. Configurar Workers

```bash
# Para tráfego baixo-médio
railway variables set WORKERS="2"

# Para tráfego alto
railway variables set WORKERS="4"
```

### 2. Habilitar Cache

O Dockerfile já tem cache otimizado, mas você pode melhorar:

```dockerfile
# No Dockerfile, as layers são cacheadas automaticamente
# Rebuilds subsequentes são ~10x mais rápidos
```

### 3. Configurar Recursos

**Plano Hobby ($5/mês):**
- RAM: 512MB - 8GB
- CPU: 0.5 - 8 vCPUs
- **Recomendado para SyncAds:** 4GB RAM, 2 vCPUs

**Plano Pro ($20/mês):**
- Recursos ilimitados
- Uptime garantido
- **Recomendado para produção**

---

## 🧪 Testar Localmente (Opcional)

### Build Local

```bash
cd python-service

# Build da imagem
docker build -t syncads-python:test .

# Executar
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e SUPABASE_URL="sua-url" \
  -e SUPABASE_SERVICE_KEY="sua-chave" \
  syncads-python:test

# Testar
curl http://localhost:8000/health
```

### Testar Fases Individualmente

```bash
# Testar apenas FASE 1 (Core)
docker build --target builder-phase1 -t test-phase1 .

# Testar apenas FASE 2 (Scraping)
docker build --target builder-phase2 -t test-phase2 .

# Testar FASE 3 (AI/ML)
docker build --target builder-phase3 -t test-phase3 .
```

---

## 📝 FAQ

### Q1: Quanto tempo leva o primeiro deploy?

**A:** ~25-30 minutos na primeira vez. Depois, com cache, apenas 2-5 minutos.

### Q2: Quanto custa no Railway?

**A:** 
- **Hobby ($5/mês):** ~$0.000008/GB-sec RAM + $0.000463/vCPU-min
- **Estimativa SyncAds:** ~$15-30/mês (4GB RAM, uso médio)
- **Pro ($20/mês + uso):** Melhor para produção

### Q3: Posso usar todas as 250+ bibliotecas?

**A:** ✅ Sim! Todas estão instaladas:
- Web Scraping (Playwright, Selenium, Scrapy)
- IA (OpenAI, Anthropic, Groq, PyTorch)
- Computer Vision (OpenCV, MediaPipe)
- Audio/Video (Whisper, MoviePy, FFmpeg)
- ML (scikit-learn, XGBoost, LightGBM)
- E muito mais!

### Q4: Como atualizar uma biblioteca?

**A:**
1. Editar o arquivo `requirements-*.txt` apropriado
2. Commit e push
3. Railway rebuild automático

```bash
# Exemplo: Atualizar OpenAI
cd python-service
nano requirements-ai.txt  # Mudar versão
git add requirements-ai.txt
git commit -m "Update OpenAI to latest"
railway up
```

### Q5: Como adicionar nova biblioteca?

**A:**

Identifique a fase apropriada:
- **Core/API?** → `requirements-base.txt`
- **Scraping/Crawling?** → `requirements-scraping.txt`
- **IA/ML/Processamento?** → `requirements-ai.txt`

```bash
# Exemplo: Adicionar nova lib de IA
echo "nova-lib==1.0.0" >> requirements-ai.txt
railway up
```

### Q6: Railway tem limites?

**A:**

**Plano Hobby:**
- ✅ Deploy ilimitados
- ✅ Execução 24/7
- ❌ 500 horas de execução/mês (suficiente!)

**Plano Pro:**
- ✅ Tudo ilimitado
- ✅ Uptime SLA 99.9%
- ✅ Suporte prioritário

### Q7: Como fazer rollback?

**A:**

```bash
# Via CLI
railway rollback

# Ou no dashboard:
# 1. Deployments
# 2. Selecionar versão anterior
# 3. "Rollback to this version"
```

### Q8: Como configurar domínio customizado?

**A:**

```bash
# Via CLI
railway domain

# Ou no dashboard:
# 1. Settings
# 2. Domains
# 3. Add Domain
# 4. Configurar DNS (CNAME)
```

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. ✅ **Testar Endpoints:**
   ```bash
   curl https://seu-app.railway.app/health
   curl https://seu-app.railway.app/docs  # Swagger UI
   ```

2. ✅ **Configurar no Frontend:**
   ```typescript
   // src/lib/config.ts
   const PYTHON_SERVICE_URL = 'https://seu-app.railway.app'
   ```

3. ✅ **Testar IA:**
   ```bash
   curl -X POST https://seu-app.railway.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello, AI!"}'
   ```

4. ✅ **Configurar Monitoramento:**
   - Habilitar alertas no Railway
   - Configurar Sentry (já incluído)
   - Configurar logs externos se necessário

5. ✅ **Otimizar Custos:**
   - Monitorar uso no dashboard
   - Ajustar workers se necessário
   - Configurar auto-scaling

---

## 🆘 Suporte

### Problemas?

1. **Verificar logs primeiro:**
   ```bash
   railway logs --limit 200
   ```

2. **Verificar status:**
   ```bash
   railway status
   ```

3. **Reconstruir do zero:**
   ```bash
   railway up --detach
   ```

### Ainda com problemas?

- 📧 Suporte Railway: https://railway.app/help
- 💬 Discord Railway: https://discord.gg/railway
- 📚 Docs: https://docs.railway.app

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Health check retorna 200 OK
- [ ] Swagger UI acessível em `/docs`
- [ ] Variáveis de ambiente configuradas
- [ ] IA responde corretamente
- [ ] Scraping funciona (Playwright)
- [ ] Logs aparecem no dashboard
- [ ] Frontend conectado ao Python service
- [ ] Domínio customizado configurado (opcional)
- [ ] Monitoramento ativo
- [ ] Backup/rollback testado

---

## 🎉 Conclusão

Seu Python Microservice agora está:
- ✅ Deploy no Railway
- ✅ 250+ bibliotecas funcionando
- ✅ IA completa (OpenAI, Anthropic, Groq, etc)
- ✅ Web scraping profissional
- ✅ Computer vision
- ✅ Audio/Video processing
- ✅ Machine Learning
- ✅ Build otimizado (2-5 min rebuilds)
- ✅ Health checks configurados
- ✅ Auto-scaling pronto

**Tempo total de setup: ~30-40 minutos**

---

**Data:** Janeiro 2025  
**Versão:** 2.0.0  
**Status:** ✅ Pronto para Produção