# 🚀 PROMPT DE CONTINUAÇÃO - MICROSERVIÇO PYTHON SYNCADS

## 📋 CONTEXTO COMPLETO

Estou desenvolvendo o **SyncAds V2**, um SaaS de marketing com IA em TypeScript/React + Supabase.

**O QUE JÁ ESTÁ FUNCIONANDO:**
- ✅ Sistema de chat com IA (OpenAI + Groq)
- ✅ Geração de imagens (DALL-E 3)
- ✅ Geração de vídeos (Runway + Pika Labs)
- ✅ Web Search real (Serper.dev)
- ✅ 100+ integrações de APIs
- ✅ Deploy na Vercel: https://syncads.com.br

**O QUE ACABAMOS DE CRIAR:**
- ✅ Microserviço Python completo com FastAPI
- ✅ 217 bibliotecas Python instaladas
- ✅ 3 routers implementados: Scraping, PDF, Images
- ✅ 6 routers com stubs: Shopify, ML, NLP, Data Analysis, Python Executor, Automation
- ✅ Dockerfile + docker-compose.yml
- ✅ Arquivo de integração TypeScript completo
- ✅ Railway CLI conectado (tonnysantos001@gmail.com)

**LOCALIZAÇÃO:**
```
C:\Users\dinho\Documents\GitHub\SyncAds\python-service\
```

---

## 🎯 O QUE FALTA FAZER (EM ORDEM)

### 1️⃣ DEPLOY NO RAILWAY (URGENTE)

**Comandos:**
```bash
cd C:\Users\dinho\Documents\GitHub\SyncAds\python-service

# Inicializar projeto
railway init

# Quando perguntar:
# - Nome do projeto: syncads-python-microservice
# - Empty service ou GitHub: Empty service

# Fazer deploy
railway up

# Adicionar variáveis de ambiente (mínimas para funcionar)
railway variables set PORT=8000
railway variables set ENVIRONMENT=production
railway variables set DEBUG=false
railway variables set WORKERS=4

# Opcional mas recomendado:
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_KEY=your-key

# Obter URL pública
railway domain

# Testar
curl https://syncads-python-microservice.railway.app/health
```

**URL esperada:** `https://syncads-python-microservice.railway.app`

---

### 2️⃣ INTEGRAR COM TYPESCRIPT

**Arquivo:** `src/lib/api/pythonService.ts`

**Copiar de:**
```bash
cp python-service/INTEGRATION_EXAMPLE.ts src/lib/api/pythonService.ts
```

**Adicionar ao .env:**
```bash
# .env
VITE_PYTHON_SERVICE_URL=https://syncads-python-microservice.railway.app
```

**Testar integração:**
```typescript
// src/test-python-service.ts
import { scrapeWebsite, generatePDF, optimizeImage } from './lib/api/pythonService';

async function test() {
  // Teste 1: Scraping
  const scrape = await scrapeWebsite('https://example.com');
  console.log('✅ Scraping:', scrape.success);

  // Teste 2: PDF
  const pdf = await generatePDF('Teste', 'Conteúdo de teste');
  console.log('✅ PDF:', pdf.success);
}

test();
```

---

### 3️⃣ ADICIONAR AO CHAT IA

**Arquivo:** `src/lib/ai/chatHandlers.ts`

**Adicionar no final do arquivo:**

```typescript
import { scrapeWebsite, generatePDF } from '@/lib/api/pythonService';

// Handler para scraping via Python
async function handlePythonScraping(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const url = params.url || context.userMessage;

    if (onProgress) {
      onProgress('🕷️ Fazendo scraping com Python...', 30);
    }

    const result = await scrapeWebsite(url, {
      javascript: true,
      extractImages: true,
      extractLinks: true,
    });

    if (!result.success) {
      return {
        success: false,
        content: `Falhou: ${result.error}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress('✅ Scraping concluído!', 100);
    }

    return {
      success: true,
      content: `✅ Scraping concluído!\n\n**URL:** ${result.url}\n**Método:** ${result.method}\n**Tempo:** ${result.execution_time.toFixed(2)}s\n\n${result.text?.substring(0, 500)}...`,
      attachments: result.images?.slice(0, 5).map(img => ({
        type: 'image',
        url: img,
        title: 'Imagem extraída',
      })),
      metadata: {
        type: 'python-scraping',
        url: result.url,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      content: `Erro: ${error.message}`,
      error: error.message,
    };
  }
}

// Adicionar ao switch case do processUserMessage:
case 'scrape-python':
  return await handlePythonScraping(context, intent.params, onProgress);
```

**E adicionar detecção de intenção em `advancedFeatures.ts`:**

```typescript
// Em detectAdvancedIntent()
if (lowerMessage.includes('scrape') || lowerMessage.includes('extrair dados')) {
  return {
    type: 'scrape-python',
    confidence: 0.9,
    params: { url: message },
  };
}
```

---

### 4️⃣ TESTAR NO CHAT

**No chat do SyncAds, testar:**

```
1. "Faça scraping de https://example.com"
2. "Gere um PDF com relatório da campanha"
3. "Otimize esta imagem" (após upload)
```

---

## 📦 ARQUIVOS IMPORTANTES

**Microserviço Python:**
```
python-service/
├── app/
│   ├── main.py                    # FastAPI principal
│   └── routers/
│       ├── scraping.py            # ✅ Implementado
│       ├── pdf.py                 # ✅ Implementado
│       ├── images.py              # ✅ Implementado
│       ├── shopify.py             # ⏸️ Stub
│       ├── ml.py                  # ⏸️ Stub
│       ├── nlp.py                 # ⏸️ Stub
│       ├── data_analysis.py       # ⏸️ Stub
│       ├── python_executor.py     # ⏸️ Stub
│       └── automation.py          # ⏸️ Stub
├── Dockerfile                     # ✅ Pronto
├── docker-compose.yml             # ✅ Pronto
├── requirements.txt               # ✅ 217 bibliotecas
├── .env.example                  # ✅ Todas variáveis
├── railway.json                   # ✅ Config Railway
├── INTEGRATION_EXAMPLE.ts        # ✅ Exemplos TS
└── DEPLOY_INSTRUCTIONS.txt       # ✅ Guia completo
```

---

## 🔑 VARIÁVEIS DE AMBIENTE ESSENCIAIS

**No Railway (mínimo para funcionar):**
```bash
PORT=8000
ENVIRONMENT=production
DEBUG=false
WORKERS=4
ALLOWED_ORIGINS=https://syncads.com.br,https://www.syncads.com.br
```

**Opcionais (mas recomendadas):**
```bash
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://...
SUPABASE_KEY=...
SERPER_API_KEY=...
```

---

## ✅ CHECKLIST FINAL

- [ ] Deploy no Railway concluído
- [ ] URL pública funcionando (testar /health)
- [ ] Variáveis de ambiente configuradas
- [ ] pythonService.ts copiado para src/lib/api/
- [ ] VITE_PYTHON_SERVICE_URL adicionado ao .env
- [ ] Handler adicionado ao chatHandlers.ts
- [ ] Detecção de intenção atualizada
- [ ] Build local sem erros (npm run build)
- [ ] Deploy Vercel com nova integração
- [ ] Testar no chat em produção

---

## 🎯 COMANDOS COMPLETOS PARA EXECUTAR

```bash
# 1. Deploy Railway
cd C:\Users\dinho\Documents\GitHub\SyncAds\python-service
railway init
railway up
railway variables set PORT=8000 ENVIRONMENT=production DEBUG=false WORKERS=4
railway domain

# 2. Copiar integração
cd C:\Users\dinho\Documents\GitHub\SyncAds
cp python-service/INTEGRATION_EXAMPLE.ts src/lib/api/pythonService.ts

# 3. Adicionar ao .env
echo "VITE_PYTHON_SERVICE_URL=https://[URL-DO-RAILWAY]" >> .env

# 4. Build e deploy
npm run build
vercel --prod

# 5. Testar
curl https://syncads.com.br/
```

---

## 💡 SE DER ERRO NO RAILWAY

**Erro comum:** Build timeout

**Solução:**
1. Aumentar timeout: `railway variables set RAILWAY_BUILD_TIMEOUT=600`
2. Ou deploy via Docker Hub (mais rápido)

**Logs:**
```bash
railway logs
```

---

## 🚨 IMPORTANTE

1. **Não mexer no código existente do chat** - apenas adicionar novos handlers
2. **Testar local primeiro** se possível: `cd python-service && ./start.sh`
3. **Railway vai cobrar $5/mês** após período trial
4. **Documentar URL do Railway** para não perder

---

## 📞 ENDPOINTS DISPONÍVEIS

Após deploy, testar:

```bash
# Health check
GET https://[URL]/health

# Docs interativos
GET https://[URL]/docs

# Scraping
POST https://[URL]/api/scraping/scrape
Body: {"url": "https://example.com"}

# PDF
POST https://[URL]/api/pdf/generate
Body: {"title": "Teste", "content": "Conteúdo"}

# Imagem
POST https://[URL]/api/images/optimize
Body: {"image_base64": "..."}
```

---

## 🎉 RESULTADO ESPERADO

Após tudo implementado, o usuário poderá no chat:

```
Usuário: "Faça scraping de https://example.com/produtos"
IA: 🕷️ Fazendo scraping...
    ✅ Scraping concluído! 
    Encontrei 25 produtos.
    [Imagens dos produtos aparecem inline]

Usuário: "Gere um PDF com o relatório da campanha"
IA: 📄 Gerando PDF...
    ✅ PDF gerado!
    [Botão de download aparece]
```

---

## 📝 PRÓXIMOS PASSOS APÓS DEPLOY

1. **Expandir routers** (ML, NLP, etc) conforme demanda
2. **Adicionar cache** (Redis já está no docker-compose)
3. **Monitorar custos** no Railway
4. **Adicionar mais handlers** no chat
5. **Documentar API** para equipe

---

## ✋ PARE SE...

- Railway não estiver respondendo (verificar logs)
- Build falhar 3 vezes seguidas (revisar Dockerfile)
- URL não for gerada (verificar configuração do projeto)

**Nestes casos:** Entre em contato ou use alternativa (Render/Fly.io)

---

**RESUMO EM 1 FRASE:**
Deploy do microserviço Python no Railway, copiar integração TypeScript, adicionar handler no chat, testar em produção.

**TEMPO ESTIMADO:** 15-30 minutos
**CUSTO:** $5/mês (Railway)
**RESULTADO:** Scraping, PDFs e processamento de imagens funcionando no chat

---

FIM DO PROMPT - COPIE TUDO E COLE NO PRÓXIMO CHAT 🚀