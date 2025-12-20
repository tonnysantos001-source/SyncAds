# 🔧 Guia: Configurar 3 IAs no Grok (Gratuito)

## 📋 IAs Necessárias

Você precisa criar **3 conexões de IA** no painel Super Admin, cada uma com uma API key diferente do Grok.

---

## 🧠 IA 1: THINKER (Raciocínio)

### Configuração

| Campo | Valor |
|-------|-------|
| **Nome** | Grok Thinker (Llama 3.3 70B) |
| **Provider** | GROQ |
| **API Key** | `gsk_...1` (sua primeira chave) |
| **Model** | `llama-3.3-70b-versatile` |
| **Base URL** | `https://api.groq.com/openai/v1` |
| **Max Tokens** | 4096 |
| **Temperature** | 0.5 |
| **Função da IA** | 🧠 Raciocínio (Thinking) |

### Por que Llama 3.3 70B?
- ✅ Modelo mais capaz disponível grátis
- ✅ Melhor para raciocínio complexo e planejamento
- ✅ Boa em seguir instruções estruturadas (JSON)

---

## 🔍 IA 2: CRITIC (Validação)

### Configuração

| Campo | Valor |
|-------|-------|
| **Nome** | Grok Critic (Llama 3.1 8B) |
| **Provider** | GROQ |
| **API Key** | `gsk_...2` (sua segunda chave) |
| **Model** | `llama-3.1-8b-instant` |
| **Base URL** | `https://api.groq.com/openai/v1` |
| **Max Tokens** | 2048 |
| **Temperature** | 0.3 |
| **Função da IA** | ✨ Geral (Multipurpose) |

### Por que Llama 3.1 8B?
- ✅ Mais rápido (reduce latência)
- ✅ Validação é tarefa mais simples que planejamento
- ✅ Econômico em tokens

**Nota**: Use role "Geral" porque não temos role específica "Validator" ainda. O sistema vai buscar por REASONING primeiro, depois EXECUTOR, então "Geral" será pego como Critic.

---

## ⚡ IA 3: EXECUTOR (Execução)

### Configuração

| Campo | Valor |
|-------|-------|
| **Nome** | Grok Executor (Llama 3.3 70B) |
| **Provider** | GROQ |
| **API Key** | `gsk_...3` (sua terceira chave) |
| **Model** | `llama-3.3-70b-versatile` |
| **Base URL** | `https://api.groq.com/openai/v1` |
| **Max Tokens** | 4096 |
| **Temperature** | 0.7 |
| **Função da IA** | ⚡ Executora (Actions) |

### Por que Llama 3.3 70B?
- ✅ Precisa ser capaz de comunicar bem (user-facing)
- ✅ Melhor formatação de respostas
- ✅ Boa em seguir templates Markdown

---

## 🔑 Como Obter 3 API Keys do Grok

### Opção A: 3 Emails Diferentes
1. Criar conta Grok com email1@gmail.com
2. Gerar API key → `gsk_...1`
3. Repetir com email2@gmail.com → `gsk_...2`
4. Repetir com email3@gmail.com → `gsk_...3`

### Opção B: 1 Email (se Grok permitir múltiplas keys)
1. Login em console.groq.com
2. Ir em API Keys
3. Criar 3 keys diferentes
4. Nomear: "SyncAds-Thinker", "SyncAds-Critic", "SyncAds-Executor"

---

## 📊 Modelos Gratuitos Disponíveis no Grok

| Model | Velocidade | Capacidade | Uso Recomendado |
|-------|-----------|------------|-----------------|
| `llama-3.3-70b-versatile` | Médio | Alta | Thinker, Executor |
| `llama-3.1-8b-instant` | Rápido | Média | Critic, validação |
| `mixtral-8x7b-32768` | Rápido | Alta | Alternativa (32k context!) |

**Nota**: Se quiser mais contexto, pode trocar Thinker para `mixtral-8x7b-32768` (suporta até 32k tokens de histórico).

---

## ⚙️ Configuração Atual do Sistema (ANTES de você configurar)

O sistema vai buscar IAs nesta ordem:

1. **Thinker**: Busca `aiRole = "REASONING"`
2. **Executor**: Busca `aiRole = "EXECUTOR"` ou `"GENERAL"`
3. **Critic**: ⚠️ AINDA NÃO IMPLEMENTADO! (próximo passo)

---

## 🚀 Próximos Passos

Depois de configurar as 3 IAs:

1. ✅ Você configura as IAs no painel
2. ⏳ Eu refatoro `chat-stream/index.ts` para usar 3 agentes
3. ⏳ Eu faço deploy do Supabase
4. ✅ Você testa o sistema

---

## 📝 Exemplo de Teste

**User**: "quanto tá o iPhone 15?"

**Esperado**:
```
🧠 Thinker pensa: {
  "tool": "web_search",
  "params": {"query": "iPhone 15 preço Brasil"},
  "reasoning": "Info rápida, web_search ideal"
}

🔍 Critic valida: {
  "status": "approved",
  "estimated_success_rate": 0.95
}

⚡ Executor responde:
"🔎 Pesquisei os preços do iPhone 15:
- Amazon: R$ 7.199
- Americanas: R$ 7.299"
```

---

## ⚠️ Importante

> [!WARNING]
> **Rate Limits do Grok Gratuito**
> 
> Cada key tem limite de:
> - ~30 requests/minuto
> - ~14,400 tokens/minuto
> 
> Com 3 keys, você tem 3x mais capacidade!

> [!TIP]
> **Otimização Futura**
> 
> Se precisar reduzir custos/latência:
> - Thinker: `mixtral-8x7b` (mais rápido)
> - Critic: `llama-3.1-8b` (já otimizado)
> - Executor: `llama-3.3-70b` (melhor UX)

---

**Aguardo você configurar as 3 IAs para eu continuar com a implementação! 🚀**
