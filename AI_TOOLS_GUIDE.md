# 🤖 GUIA DE AI TOOLS - SYNCADS

**Versão:** 2.0  
**Data:** 16/01/2025  
**Status:** ✅ Implementado no Railway

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Ferramentas Disponíveis](#ferramentas-disponíveis)
3. [Como Usar](#como-usar)
4. [Testes](#testes)
5. [Configuração](#configuração)
6. [Limitações](#limitações)
7. [FAQ](#faq)

---

## 🎯 VISÃO GERAL

O sistema SyncAds agora possui **5 AI Tools** integradas que são ativadas automaticamente quando o usuário faz uma solicitação específica no chat:

### ✅ **Ferramentas Implementadas:**

| Ferramenta | Status | Detecção Automática | API Necessária |
|------------|--------|---------------------|----------------|
| 🎨 **Geração de Imagens** | ✅ Ativo | "gere imagem", "crie imagem" | OpenAI (DALL-E 3) |
| 🎬 **Geração de Vídeos** | ✅ Ativo | "gere vídeo", "crie vídeo" | Nenhuma (MoviePy) |
| 🔍 **Web Search** | ✅ Ativo | "pesquise", "busque" | SerpAPI (opcional) |
| 📁 **Criar Arquivos** | ✅ Ativo | "crie arquivo", "salve em arquivo" | Nenhuma |
| 🐍 **Executar Python** | ✅ Ativo | "execute python", "rode python" | Nenhuma (Sandbox) |

---

## 🛠️ FERRAMENTAS DISPONÍVEIS

### 1. 🎨 **GERAÇÃO DE IMAGENS (DALL-E 3)**

**Capacidade:** Gera imagens realistas e artísticas usando DALL-E 3 da OpenAI.

**Detecção Automática:**
```
✅ "Gere uma imagem de um gato no espaço"
✅ "Crie uma imagem de um logo moderno para SyncAds"
✅ "Desenhe uma paisagem futurista"
```

**Parâmetros Suportados:**
- **Size:** 1024x1024, 1792x1024, 1024x1792
- **Quality:** standard, hd
- **Style:** vivid (vibrante), natural (realista)

**Resposta:**
```json
{
  "success": true,
  "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "prompt": "um gato no espaço",
  "revised_prompt": "A fluffy orange cat floating in outer space...",
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid"
}
```

**Custo:** ~$0.040 por imagem (standard) | ~$0.080 (hd)

---

### 2. 🎬 **GERAÇÃO DE VÍDEOS (MOVIEPY)**

**Capacidade:** Cria vídeos a partir de múltiplas imagens com transições.

**Detecção Automática:**
```
✅ "Crie um vídeo com estas imagens: [url1, url2, url3]"
✅ "Gere vídeo a partir das imagens"
```

**Parâmetros Suportados:**
- **Duration per image:** 3 segundos (padrão)
- **FPS:** 24 (padrão)
- **Transition:** fade, slide
- **Text overlay:** Adicionar texto sobre o vídeo

**Resposta:**
```json
{
  "success": true,
  "video_path": "/tmp/syncads_ai/video_20250116_120530.mp4",
  "duration": 9.0,
  "size": 2458624,
  "fps": 24,
  "images_count": 3
}
```

**Custo:** Gratuito (processamento local)

---

### 3. 🔍 **WEB SEARCH**

**Capacidade:** Busca informações na web usando Google (SerpAPI) ou DuckDuckGo.

**Detecção Automática:**
```
✅ "Pesquise sobre inteligência artificial em 2025"
✅ "Busque as últimas notícias sobre marketing digital"
✅ "Procure na web sobre Facebook Ads"
```

**Providers:**
1. **Google Search** (SerpAPI - pago, melhor)
2. **DuckDuckGo** (gratuito, fallback automático)

**Resposta:**
```json
{
  "success": true,
  "query": "inteligência artificial 2025",
  "results": [
    {
      "title": "IA em 2025: O que esperar",
      "link": "https://example.com/ia-2025",
      "snippet": "As principais tendências de IA...",
      "source": "TechCrunch"
    }
  ],
  "provider": "duckduckgo",
  "total": 5
}
```

**Custo:** 
- Google: $5/mês por 5000 buscas (SerpAPI)
- DuckDuckGo: Gratuito

---

### 4. 📁 **CRIAR ARQUIVOS**

**Capacidade:** Cria arquivos de texto de forma segura (txt, json, csv, md, html, css, js, py).

**Detecção Automática:**
```
✅ "Crie arquivo dados.txt com conteúdo: Hello World"
✅ "Salve em arquivo config.json os dados: {nome: teste}"
✅ "Gere arquivo lista.csv com: nome,email"
```

**Extensões Permitidas:**
- `.txt` `.json` `.csv` `.md`
- `.html` `.css` `.js` `.py`

**Validações de Segurança:**
- ✅ Validação de nome de arquivo
- ✅ Limite de tamanho: 10MB
- ✅ Não sobrescreve arquivos existentes
- ✅ Salva em diretório temporário seguro

**Resposta:**
```json
{
  "success": true,
  "filepath": "/tmp/syncads_ai/dados.txt",
  "filename": "dados.txt",
  "size": 256,
  "encoding": "utf-8",
  "created_at": "2025-01-16T12:05:30"
}
```

**Custo:** Gratuito

---

### 5. 🐍 **EXECUTAR PYTHON (SANDBOX)**

**Capacidade:** Executa código Python de forma segura usando RestrictedPython.

**Detecção Automática:**
```
✅ "Execute python: print('Hello World')"
✅ "Rode python: result = sum([1,2,3,4,5])"
✅ "Executar código: for i in range(5): print(i)"
```

**Funções Permitidas (Whitelist):**
```python
print, len, range, str, int, float, list, dict, tuple, set,
sum, max, min, abs, round, sorted, enumerate, zip, map, filter
```

**Restrições de Segurança:**
- ❌ Sem acesso a arquivos do sistema
- ❌ Sem imports externos
- ❌ Sem acesso à rede
- ❌ Sem eval/exec direto
- ✅ Timeout de 5 segundos
- ✅ Sandbox isolado

**Resposta:**
```json
{
  "success": true,
  "result": 15,
  "output": "1\n2\n3\n4\n5\n",
  "code": "result = sum([1,2,3,4,5])",
  "executed_at": "2025-01-16T12:05:30"
}
```

**Custo:** Gratuito

---

## 🚀 COMO USAR

### **No Chat:**

1. **Digite naturalmente** - O sistema detecta automaticamente:
   ```
   Usuário: "Gere uma imagem de um cachorro correndo na praia"
   IA: [Gera imagem com DALL-E 3]
   ```

2. **Veja o resultado** - A IA responde com:
   - Link da imagem gerada
   - Descrição revisada
   - Informações técnicas

3. **Continue a conversa** - O contexto é mantido:
   ```
   Usuário: "Agora faça ela em estilo cartoon"
   IA: [Edita a imagem anterior]
   ```

---

## 🧪 TESTES

### **Teste 1: Geração de Imagem** ⏱️ 10-15s

**Comando:**
```
Gere uma imagem de um robot futurista trabalhando em um computador
```

**Resultado Esperado:**
- ✅ Imagem gerada
- ✅ URL retornada
- ✅ Prompt revisado pelo DALL-E
- ✅ Sem erros

**Verificar:**
- [ ] URL da imagem funciona
- [ ] Imagem corresponde ao prompt
- [ ] Qualidade adequada

---

### **Teste 2: Web Search** ⏱️ 2-5s

**Comando:**
```
Pesquise sobre as melhores práticas de Facebook Ads em 2025
```

**Resultado Esperado:**
- ✅ 5 resultados retornados
- ✅ Títulos relevantes
- ✅ Links funcionais
- ✅ Snippets informativos

**Verificar:**
- [ ] Resultados relevantes à busca
- [ ] Links não quebrados
- [ ] Provider usado (Google ou DuckDuckGo)

---

### **Teste 3: Executar Python** ⏱️ 1-2s

**Comando:**
```
Execute python: result = sum([x**2 for x in range(10)])
```

**Resultado Esperado:**
- ✅ Código executado com sucesso
- ✅ Resultado: 285
- ✅ Sem erros de segurança

**Verificar:**
- [ ] Resultado correto (285)
- [ ] Sem erros
- [ ] Execução em sandbox

---

### **Teste 4: Criar Arquivo** ⏱️ 1s

**Comando:**
```
Crie arquivo teste.txt com conteúdo: Este é um teste de criação de arquivo
```

**Resultado Esperado:**
- ✅ Arquivo criado
- ✅ Path retornado
- ✅ Tamanho correto

**Verificar:**
- [ ] Arquivo existe no path
- [ ] Conteúdo correto
- [ ] Encoding UTF-8

---

### **Teste 5: Gerar Vídeo** ⏱️ 15-30s

**Comando:**
```
Primeiro: Gere 3 imagens de paisagens diferentes
Depois: Crie um vídeo com estas imagens
```

**Resultado Esperado:**
- ✅ 3 imagens geradas
- ✅ Vídeo criado com transições
- ✅ Duração ~9 segundos (3s cada)

**Verificar:**
- [ ] Vídeo reproduz corretamente
- [ ] Transições suaves
- [ ] Qualidade adequada

---

## ⚙️ CONFIGURAÇÃO

### **Variáveis de Ambiente (Railway):**

```bash
# Obrigatórias
OPENAI_API_KEY=sk-...                    # Para DALL-E 3
ANTHROPIC_API_KEY=sk-ant-...            # Para Claude
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...

# Opcionais
SERPAPI_KEY=xxx...                       # Para Google Search (opcional)
GROQ_API_KEY=gsk_...                    # Para Groq (opcional)
GOOGLE_API_KEY=AIza...                  # Para Gemini (opcional)
```

### **Como Configurar no Railway:**

```bash
railway variables set OPENAI_API_KEY=sk-...
railway variables set SERPAPI_KEY=xxx...
```

**Ou via Dashboard:**
1. Acesse: https://railway.app/project/xxxxx
2. Variables → Add Variable
3. Salvar e reiniciar serviço

---

## ⚠️ LIMITAÇÕES

### **1. Geração de Imagens**
- ❌ Máximo 1 imagem por request
- ❌ Custo por imagem (~$0.04-0.08)
- ❌ Sem edição avançada (apenas DALL-E 3)
- ✅ Suporta apenas texto → imagem

### **2. Geração de Vídeos**
- ❌ Requer URLs de imagens (não gera automaticamente)
- ❌ Máximo 10 imagens por vídeo
- ❌ Sem áudio (apenas imagens + transições)
- ⚠️ Processamento pode levar 30+ segundos

### **3. Web Search**
- ❌ SerpAPI requer API key paga (fallback DuckDuckGo gratuito)
- ❌ Máximo 5 resultados por busca
- ❌ Sem scraping de conteúdo completo
- ✅ Apenas títulos e snippets

### **4. Criar Arquivos**
- ❌ Apenas arquivos de texto
- ❌ Máximo 10MB por arquivo
- ❌ Salva em temp (não permanente)
- ❌ Extensões limitadas (segurança)

### **5. Executar Python**
- ❌ Sandbox restrito (sem imports externos)
- ❌ Timeout de 5 segundos
- ❌ Sem acesso a filesystem
- ❌ Sem acesso à rede
- ✅ Apenas operações matemáticas/lógicas

---

## 💡 FAQ

### **P: Como sei se a ferramenta foi ativada?**
R: A IA responderá mencionando a ferramenta usada. Ex: "Gerando imagem com DALL-E 3..."

### **P: Posso usar múltiplas ferramentas em uma mensagem?**
R: Não no momento. Use uma ferramenta por mensagem.

### **P: O que acontece se a ferramenta falhar?**
R: A IA continua funcionando normalmente e responde sem a ferramenta.

### **P: As ferramentas têm custo?**
R: 
- **Grátis:** Vídeo, Arquivos, Python, Web Search (DuckDuckGo)
- **Pago:** Imagens ($0.04/img), Web Search (SerpAPI $5/mês)

### **P: Como desabilitar uma ferramenta?**
R: Remova a API key correspondente das variáveis de ambiente do Railway.

### **P: Os arquivos criados são permanentes?**
R: Não. Arquivos são salvos em `/tmp` e deletados após ~24h.

### **P: O Python executor é seguro?**
R: Sim! Usa RestrictedPython com sandbox isolado. Sem acesso a sistema.

### **P: Posso gerar imagens NSFW?**
R: Não. DALL-E 3 possui filtros de segurança da OpenAI.

---

## 📊 MONITORAMENTO

### **Verificar Status das Ferramentas:**

```bash
# Health check geral
curl https://syncads-python-microservice-production.up.railway.app/health

# Logs do Railway
railway logs --tail 50

# Verificar se AI Tools estão carregadas
railway logs | grep "AI Tools"
```

### **Métricas Importantes:**
- **Latência Imagem:** 10-15s
- **Latência Vídeo:** 15-30s
- **Latência Search:** 2-5s
- **Latência Python:** <1s
- **Latência Arquivo:** <1s

---

## 🎯 ROADMAP FUTURO

### **Em Desenvolvimento:**
- [ ] Edição avançada de imagens
- [ ] Geração de áudio/narração
- [ ] Web scraping completo
- [ ] Múltiplas ferramentas em uma request
- [ ] Cache de resultados
- [ ] Upload de arquivos do usuário

### **Planejado:**
- [ ] Geração de apresentações (PowerPoint)
- [ ] Análise de dados (CSV/Excel)
- [ ] OCR (extrair texto de imagens)
- [ ] Tradução automática
- [ ] Sumarização de artigos

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Antes de considerar as AI Tools funcionais, verificar:

- [ ] OPENAI_API_KEY configurada no Railway
- [ ] Railway com bibliotecas instaladas (moviepy, duckduckgo-search, RestrictedPython)
- [ ] Endpoint /api/chat retorna tool_result no JSON
- [ ] Logs mostram "AI Tools: Image, Video, Search, Files, Python"
- [ ] Teste de cada ferramenta executado com sucesso
- [ ] Frontend exibe resultados corretamente
- [ ] Sem erros 500 nos logs

---

## 📞 SUPORTE

**Problemas Comuns:**

1. **"OPENAI_API_KEY não configurada"**
   → Adicionar variável no Railway

2. **"Module not found: moviepy"**
   → Rebuild Railway com requirements.txt atualizado

3. **"SerpAPI key not found, using fallback"**
   → Normal! DuckDuckGo é usado como fallback gratuito

4. **"Timeout na execução Python"**
   → Código muito complexo ou loop infinito

5. **"Extensão não permitida"**
   → Apenas: .txt, .json, .csv, .md, .html, .css, .js, .py

---

**Última Atualização:** 16/01/2025  
**Versão:** 2.0 - AI Tools Complete  
**Autor:** SyncAds AI Team