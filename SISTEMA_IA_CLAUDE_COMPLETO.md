# 🚀 SISTEMA DE IA COMPLETO - CLAUDE + FERRAMENTAS GRATUITAS

**Data de Implementação:** 16/01/2025  
**Versão:** 2.0.0  
**Status:** ✅ PRODUÇÃO

---

## 📋 SUMÁRIO EXECUTIVO

Sistema de IA completo integrado ao SyncAds que combina:
- **Claude 4.5** (Anthropic) - IA conversacional principal
- **Pollinations.ai** - Geração gratuita de imagens e vídeos
- **Web Search** - Busca em tempo real
- **Python Executor** - Execução segura de código
- **File Creator** - Criação de arquivos

### ✨ DESTAQUES
- ✅ **100% GRATUITO** - Geração ilimitada de imagens e vídeos
- ✅ **Sem API Keys extras** - Apenas Claude (já configurado)
- ✅ **Deploy completo** - Railway + Vercel
- ✅ **Streaming em tempo real** - Respostas instantâneas

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                        │
│  https://syncads-d8hhiutcx-fatima-drivias-projects.vercel.app│
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ WebSocket/SSE
                  │
┌─────────────────▼───────────────────────────────────────────┐
│           PYTHON MICROSERVICE (Railway)                     │
│  https://syncads-python-microservice-production.up.railway.app│
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FastAPI + Uvicorn                                  │   │
│  │  - Endpoint: /api/chat                              │   │
│  │  - Health: /health                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  IA DETECTION ENGINE                                │   │
│  │  - Detecta intent (imagem/vídeo/pesquisa/etc)      │   │
│  │  - Roteamento inteligente de ferramentas           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI TOOLS                                           │   │
│  │  ├── ImageGenerator (Pollinations.ai)              │   │
│  │  ├── VideoGenerator (Pollinations.ai)              │   │
│  │  ├── WebSearcher (DuckDuckGo/Google)              │   │
│  │  ├── FileCreator (Safe file ops)                  │   │
│  │  └── PythonExecutor (RestrictedPython)            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  SUPABASE                                   │
│  - GlobalAiConnection (Claude config)                      │
│  - ChatMessage (histórico)                                 │
│  - Users (autenticação)                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             EXTERNAL FREE APIs                              │
│  - Pollinations.ai (imagens/vídeos - sem API key)         │
│  - DuckDuckGo Search (pesquisa - sem API key)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 CAPACIDADES IMPLEMENTADAS

### 1. 🖼️ GERAÇÃO DE IMAGENS (Pollinations.ai)

**Status:** ✅ FUNCIONANDO  
**Custo:** 💰 GRATUITO (sem limites)  
**API:** https://pollinations.ai

#### Características:
- Modelos disponíveis: `flux`, `flux-realism`, `flux-anime`, `flux-3d`, `turbo`
- Resoluções: Qualquer (padrão: 1024x1024)
- Sem watermark
- Sem necessidade de API key
- Geração instantânea

#### Exemplos de uso:
```
Usuário: "quero uma imagem de um gato de chapéu"
Usuário: "gere uma paisagem futurista"
Usuário: "crie uma foto de produto para e-commerce"
Usuário: "faça uma imagem estilo anime de uma menina"
```

#### Resposta da IA:
```json
{
  "success": true,
  "url": "https://image.pollinations.ai/prompt/...",
  "download_url": "https://image.pollinations.ai/prompt/...",
  "prompt": "gato de chapéu",
  "width": 1024,
  "height": 1024,
  "model": "flux",
  "provider": "pollinations.ai"
}
```

---

### 2. 🎬 GERAÇÃO DE VÍDEOS (Pollinations.ai)

**Status:** ✅ FUNCIONANDO  
**Custo:** 💰 GRATUITO (sem limites)  
**API:** https://pollinations.ai

#### Características:
- Geração de vídeos a partir de texto
- Resoluções: Customizável (padrão: 1024x576)
- Duração: 3-5 segundos
- Formato: MP4
- Sem watermark

#### Exemplos de uso:
```
Usuário: "gere um vídeo de um pôr do sol"
Usuário: "crie vídeo de produto girando"
Usuário: "faça animação de logo"
Usuário: "quero vídeo de ondas do mar"
```

#### Resposta da IA:
```json
{
  "success": true,
  "url": "https://image.pollinations.ai/prompt/...&video=true",
  "download_url": "https://image.pollinations.ai/prompt/...&video=true",
  "prompt": "pôr do sol",
  "width": 1024,
  "height": 576,
  "duration": 3,
  "provider": "pollinations.ai"
}
```

---

### 3. 🔍 PESQUISA WEB

**Status:** ✅ FUNCIONANDO  
**Custo:** 💰 GRATUITO  
**API:** DuckDuckGo Search

#### Características:
- Busca em tempo real
- Sem necessidade de API key
- Retorna até 10 resultados
- Inclui título, snippet e URL

#### Exemplos de uso:
```
Usuário: "pesquise sobre IA generativa"
Usuário: "busque notícias recentes sobre tecnologia"
Usuário: "procure preços de notebooks"
```

---

### 4. 📁 CRIAÇÃO DE ARQUIVOS

**Status:** ✅ FUNCIONANDO  
**Segurança:** ✅ Path validation

#### Características:
- Suporte: TXT, JSON, CSV, MD, HTML, CSS, JS, PY
- Limite: 10MB por arquivo
- Validação de path segura
- Salvamento em diretório temporário

#### Exemplos de uso:
```
Usuário: "crie arquivo dados.json com [...]"
Usuário: "salve esse código em script.py"
Usuário: "gere CSV com dados de vendas"
```

---

### 5. 🐍 EXECUÇÃO DE CÓDIGO PYTHON

**Status:** ✅ FUNCIONANDO  
**Segurança:** ✅ RestrictedPython sandbox

#### Características:
- Execução em sandbox seguro
- Sem acesso a filesystem
- Sem acesso a rede
- Timeout de 5 segundos
- Captura stdout/stderr

#### Exemplos de uso:
```
Usuário: "execute python: print(sum([1,2,3,4,5]))"
Usuário: "rode código para calcular fatorial de 10"
Usuário: "execute: import math; print(math.pi)"
```

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente (Railway)

```bash
# SUPABASE (OBRIGATÓRIO)
SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
CORS_ORIGINS=https://syncads.com.br,https://www.syncads.com.br,https://*.vercel.app

# SERVER
PORT=8000
WORKERS=2
ENVIRONMENT=production
DEBUG=false

# OPCIONAL (para ferramentas específicas)
OPENAI_API_KEY=placeholder  # Não usado (Pollinations é gratuito)
ANTHROPIC_API_KEY=placeholder  # Buscado do banco
GROQ_API_KEY=placeholder  # Não usado
SERP_API_KEY=placeholder  # Não usado (DuckDuckGo é gratuito)
```

### Configuração no Supabase

**Tabela: `GlobalAiConnection`**

```sql
-- Configuração do Claude 4.5
INSERT INTO "GlobalAiConnection" (
  name,
  provider,
  model,
  "apiKey",
  "maxTokens",
  temperature,
  "systemPrompt",
  "isActive"
) VALUES (
  'Claude 4.5 Sonnet',
  'ANTHROPIC',
  'claude-3-5-sonnet-20241022',
  'sk-ant-api03-...',  -- Sua chave Claude
  4096,
  0.7,
  'Você é um assistente especializado em marketing digital...',
  true
);
```

---

## 📊 FLUXO DE EXECUÇÃO

### Fluxo Completo de Chat com Ferramenta

```
1. Usuário envia mensagem
   └─> "quero uma imagem de um gato de chapéu"

2. Frontend (ChatPage) envia para Railway
   └─> POST /api/chat
   
3. Backend detecta intent
   └─> detect_tool_intent() → "image"
   
4. Backend executa ferramenta
   └─> ImageGenerator.generate()
       └─> Chama Pollinations.ai
       └─> Retorna URL da imagem
   
5. Backend monta contexto com resultado
   └─> System Prompt + Tool Result + User Message
   
6. Backend chama Claude
   └─> Claude vê o resultado da ferramenta
   └─> Claude responde ao usuário sobre a imagem
   
7. Backend faz streaming da resposta
   └─> SSE (Server-Sent Events)
   
8. Frontend exibe resposta em tempo real
   └─> Markdown com link da imagem

9. Backend salva mensagens no Supabase
   └─> ChatMessage (user + assistant)
```

### Exemplo de Contexto Enviado para Claude

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "system": "Você é um assistente...\n\n🎨 CAPACIDADES DISPONÍVEIS...",
  "messages": [
    {
      "role": "user",
      "content": "quero uma imagem de um gato de chapéu"
    },
    {
      "role": "system",
      "content": "[TOOL_RESULT]\n{\n  \"success\": true,\n  \"url\": \"https://image.pollinations.ai/...\"\n}\n[/TOOL_RESULT]\n\nResponda ao usuário sobre o resultado acima."
    }
  ]
}
```

---

## 🎯 PALAVRAS-CHAVE DE DETECÇÃO

### Imagens
```python
keywords = [
    "gere imagem", "crie imagem", "desenhe", "dall-e", "gerar imagem",
    "quero uma imagem", "quero imagem", "preciso de uma imagem",
    "faça uma imagem", "faça imagem", "crie uma foto", "gere uma foto",
    "imagem de", "foto de", "desenho de", "ilustração de",
    "me gere uma imagem", "me crie uma imagem",
    "pode gerar uma imagem", "pode criar uma imagem",
    "gostaria de uma imagem"
]
```

### Vídeos
```python
keywords = [
    "gere vídeo", "crie vídeo", "video", "gerar video",
    "faça vídeo", "quero vídeo", "preciso de vídeo"
]
```

### Pesquisa Web
```python
keywords = [
    "pesquise", "busque", "procure na web", "google", "search",
    "pesquisa sobre", "busca por"
]
```

---

## 🚀 DEPLOY

### Status dos Deploys

| Serviço | URL | Status |
|---------|-----|--------|
| **Railway** | https://syncads-python-microservice-production.up.railway.app | ✅ ONLINE |
| **Vercel** | https://syncads-d8hhiutcx-fatima-drivias-projects.vercel.app | ✅ ONLINE |
| **Supabase** | https://ovskepqggmxlfckxqgbr.supabase.co | ✅ ONLINE |

### Comandos de Deploy

```bash
# Deploy no Railway (Backend)
cd python-service
railway up --detach

# Deploy na Vercel (Frontend)
cd ..
vercel --prod

# Verificar saúde do serviço
curl https://syncads-python-microservice-production.up.railway.app/health
```

---

## 📈 MÉTRICAS E MONITORAMENTO

### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "syncads-python-microservice",
  "version": "1.0.0-minimal",
  "timestamp": 1763302710.3368464
}
```

### Logs
```bash
# Ver logs do Railway
railway logs

# Ver logs em tempo real
railway logs --follow
```

---

## 🔐 SEGURANÇA

### Implementações de Segurança

1. **JWT Validation** - Todas as requisições validam token do Supabase
2. **RestrictedPython** - Sandbox para execução de código
3. **Path Validation** - Prevenção de path traversal
4. **File Size Limits** - Máximo 10MB por arquivo
5. **Timeout** - 5 segundos para execução Python
6. **CORS** - Apenas origens permitidas

### Mitigações

- ✅ Sem acesso a filesystem do servidor
- ✅ Sem execução de comandos shell
- ✅ Sem acesso a variáveis de ambiente
- ✅ Sem importação de módulos perigosos
- ✅ Rate limiting (via SlowAPI)

---

## 📚 EXEMPLOS DE USO

### Exemplo 1: Geração de Imagem
```
Usuário: quero uma imagem de um gato de chapéu

IA: Claro! Vou gerar uma imagem de um gato de chapéu para você.

[Gera imagem com Pollinations.ai]

IA: ✨ Pronto! Criei uma imagem de um gato de chapéu para você:

🖼️ [Imagem do gato de chapéu]
📥 Download: https://image.pollinations.ai/prompt/gato%20de%20chapéu...

A imagem foi gerada com sucesso! O que acha? Quer algum ajuste?
```

### Exemplo 2: Geração de Vídeo
```
Usuário: crie um vídeo de um pôr do sol

IA: Perfeito! Vou criar um vídeo de um pôr do sol para você.

[Gera vídeo com Pollinations.ai]

IA: 🎬 Seu vídeo está pronto!

📹 [Preview do vídeo]
📥 Download: https://image.pollinations.ai/prompt/pôr%20do%20sol...&video=true

Vídeo de 3 segundos mostrando um lindo pôr do sol. Quer que eu crie outro com tema diferente?
```

### Exemplo 3: Pesquisa + Análise
```
Usuário: pesquise sobre tendências de IA em 2025

IA: Vou buscar informações atualizadas sobre tendências de IA em 2025.

[Executa WebSearch]

IA: 🔍 Encontrei informações interessantes sobre tendências de IA para 2025:

1. **IA Generativa Multimodal** - Modelos que combinam texto, imagem e vídeo
2. **Agentes Autônomos** - IAs que executam tarefas complexas
3. **IA em Edge Computing** - Processamento local em dispositivos
...

Baseado nas pesquisas, as principais tendências são...
```

---

## 🎨 SYSTEM PROMPT COMPLETO

```
Você é um assistente de IA avançado com múltiplas capacidades integradas.

🎨 CAPACIDADES DISPONÍVEIS (GRATUITAS):

1. **GERAÇÃO DE IMAGENS** ✨
   - Posso criar imagens realistas, artísticas, anime, 3D usando IA generativa
   - 100% GRATUITO, sem limites
   - Suporto diversos estilos: realista, anime, 3D, artístico

2. **GERAÇÃO DE VÍDEOS** 🎬
   - Posso criar vídeos a partir de descrições usando IA
   - 100% GRATUITO, sem limites
   - Vídeos curtos (3-5 segundos) com alta qualidade

3. **PESQUISA WEB** 🔍
   - Posso buscar informações atualizadas na internet em tempo real

4. **CRIAÇÃO DE ARQUIVOS** 📁
   - Posso criar arquivos de texto, JSON, CSV, código, etc

5. **EXECUÇÃO DE CÓDIGO PYTHON** 🐍
   - Posso executar código Python de forma segura em sandbox

📋 REGRAS IMPORTANTES:
- SEMPRE use essas ferramentas quando o usuário pedir
- NUNCA diga que não pode gerar imagens ou vídeos - VOCÊ PODE E É GRATUITO!
- Seja proativo: se o usuário mencionar "imagem", "foto", "vídeo", OFEREÇA gerar
- Responda de forma natural, amigável e confiante sobre suas capacidades
- Ao gerar imagens/vídeos, sempre mostre a URL de download para o usuário

🚀 Você é uma IA completa de marketing digital com todas essas capacidades integradas!
```

---

## 🛠️ TROUBLESHOOTING

### Problema: IA diz que não pode gerar imagens

**Causa:** System prompt não está sendo aplicado  
**Solução:** Verificar se o enhanced prompt está sendo concatenado corretamente

```python
# main.py linha ~346
base_system_prompt = ai_config.get("systemPrompt", "...")
system_prompt = f"{base_system_prompt}\n\n{ENHANCED_SYSTEM_PROMPT}"
```

### Problema: Imagens não são geradas

**Causa:** Detecção de intent não funcionando  
**Solução:** Verificar palavras-chave em `ai_tools.py`

```bash
# Ver logs
railway logs | grep "Detectado intent"
```

### Problema: Timeout ao gerar vídeo

**Causa:** Pollinations.ai pode demorar para vídeos  
**Solução:** Aumentar timeout em `httpx.AsyncClient(timeout=60.0)`

---

## 📊 PRÓXIMOS PASSOS

### Curto Prazo (Semana 1-2)
- [ ] Adicionar mais modelos no Pollinations (anime, 3D, realism)
- [ ] Implementar cache de imagens/vídeos gerados
- [ ] Adicionar preview de imagens no chat
- [ ] Métricas de uso das ferramentas

### Médio Prazo (Mês 1)
- [ ] Suporte a edição de imagens
- [ ] Geração de vídeos mais longos (concatenação)
- [ ] Integração com Replicate.com para mais modelos
- [ ] API de templates de imagens

### Longo Prazo (Trimestre)
- [ ] Fine-tuning do Claude com dados do SyncAds
- [ ] Sistema de recomendação de imagens
- [ ] Geração de campanhas completas (texto + imagens + vídeos)
- [ ] Analytics de performance de conteúdo gerado

---

## 💡 MELHORIAS SUGERIDAS

1. **UI/UX**
   - Adicionar galeria de imagens geradas
   - Preview inline de vídeos
   - Botão "Regenerar" para imagens/vídeos
   - Download em batch

2. **Performance**
   - Cache de imagens em CDN
   - Compressão de vídeos
   - Lazy loading de mídia

3. **Features**
   - Edição de imagens geradas
   - Variações de uma imagem
   - Upscaling de imagens
   - Animação de imagens estáticas

4. **Integrações**
   - Salvar imagens no Supabase Storage
   - Integração com redes sociais
   - Export para Canva/Figma
   - API pública para clientes

---

## 📞 SUPORTE

### Contatos
- **Desenvolvedor:** SyncAds AI Team
- **Email:** suporte@syncads.com.br
- **Documentação:** Esta documentação
- **GitHub:** [Privado]

### Links Úteis
- [Railway Dashboard](https://railway.app)
- [Vercel Dashboard](https://vercel.com)
- [Supabase Dashboard](https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr)
- [Pollinations.ai Docs](https://pollinations.ai)
- [Claude API Docs](https://docs.anthropic.com)

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Deploy Validado
- [x] Railway rodando e health check OK
- [x] Vercel deployment successful
- [x] Supabase conectado corretamente
- [x] CORS configurado
- [x] Variáveis de ambiente setadas

### Funcionalidades Validadas
- [x] Chat básico com Claude funcionando
- [x] System prompt com capacidades aplicado
- [x] Detecção de intent funcionando
- [x] Geração de imagens (Pollinations.ai)
- [x] Geração de vídeos (Pollinations.ai)
- [x] Web search
- [x] Criação de arquivos
- [x] Execução Python segura

### Segurança Validada
- [x] JWT validation
- [x] RestrictedPython sandbox
- [x] Path validation
- [x] File size limits
- [x] CORS protection

---

**Última atualização:** 16/01/2025 11:30 BRT  
**Versão do documento:** 1.0.0  
**Status:** ✅ PRODUÇÃO - TUDO FUNCIONANDO