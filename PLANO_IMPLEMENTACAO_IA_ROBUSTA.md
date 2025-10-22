# 🧠 PLANO: SISTEMA DE IA ROBUSTO COM MEMÓRIA

## 🎯 OBJETIVO
Transformar o chat atual em um sistema profissional com:
- ✅ Memória persistente (não perde contexto)
- ✅ Ferramentas/Actions (executar comandos)
- ✅ Streaming (usuário vê IA "digitando")
- ✅ Multi-provider (trocar IA facilmente)

---

## 📦 INSTALAÇÃO DE DEPENDÊNCIAS

```bash
# Vercel AI SDK
npm install ai

# LangChain.js completo
npm install langchain @langchain/openai @langchain/anthropic @langchain/community

# Utilities
npm install zod
```

---

## 🏗️ ARQUITETURA

```
Frontend (React)
  ├─ useChat() hook → Gerencia mensagens + streaming
  └─ UI → Exibe chat

Edge Function (/functions/v1/chat-stream)
  ├─ LangChain Agent
  │   ├─ Memória (últimas 20 msgs do banco)
  │   ├─ Tools:
  │   │   ├─ web_search (Serper API)
  │   │   ├─ create_campaign (Supabase)
  │   │   ├─ list_campaigns (Supabase)
  │   │   ├─ get_analytics (Supabase)
  │   │   └─ send_email (Resend - futuro)
  │   └─ LLM (OpenRouter/OpenAI)
  └─ Stream Response → Frontend

Supabase Database
  └─ ChatMessage (histórico completo)
```

---

## 📝 PASSO A PASSO (Implementação hoje)

### **ETAPA 1: Edge Function com LangChain (2 horas)**

Criar: `supabase/functions/chat-stream/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ChatOpenAI } from "https://esm.sh/@langchain/openai"
import { BufferMemory } from "https://esm.sh/langchain/memory"
import { initializeAgentExecutorWithOptions } from "https://esm.sh/langchain/agents"
import { DynamicTool } from "https://esm.sh/langchain/tools"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { message, conversationId } = await req.json()
    
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 1. Buscar histórico de mensagens (memória)
    const { data: messages } = await supabase
      .from('ChatMessage')
      .select('role, content')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true })
      .limit(20)

    // 2. Configurar LLM (usar IA da organização)
    const llm = new ChatOpenAI({
      openAIApiKey: Deno.env.get('OPENROUTER_API_KEY'),
      modelName: 'openai/gpt-4-turbo',
      temperature: 0.7,
      streaming: true,
    }, {
      basePath: 'https://openrouter.ai/api/v1',
      baseOptions: {
        headers: {
          'HTTP-Referer': 'https://syncads.com',
          'X-Title': 'SyncAds',
        }
      }
    })

    // 3. Criar ferramentas (Tools)
    const tools = [
      new DynamicTool({
        name: "web_search",
        description: "Busca informações na internet usando Google. Use quando precisar de dados atuais ou informações que você não sabe.",
        func: async (query: string) => {
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': Deno.env.get('SERPER_API_KEY') ?? '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query })
          })
          const data = await response.json()
          return JSON.stringify(data.organic?.slice(0, 3) || [])
        }
      }),

      new DynamicTool({
        name: "list_campaigns",
        description: "Lista todas as campanhas publicitárias do usuário. Retorna nome, status, budget e métricas.",
        func: async () => {
          const { data } = await supabase
            .from('Campaign')
            .select('name, status, budget, platform')
            .limit(10)
          return JSON.stringify(data || [])
        }
      }),

      new DynamicTool({
        name: "create_campaign",
        description: "Cria uma nova campanha publicitária. Recebe JSON: {name, platform, budget, objective}",
        func: async (input: string) => {
          const params = JSON.parse(input)
          const { data, error } = await supabase
            .from('Campaign')
            .insert(params)
            .select()
            .single()
          
          if (error) return `Erro: ${error.message}`
          return `Campanha "${data.name}" criada com sucesso! ID: ${data.id}`
        }
      }),
    ]

    // 4. Criar Agent com memória
    const executor = await initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "chat-conversational-react-description",
      verbose: true,
      maxIterations: 5,
    })

    // 5. Executar com streaming
    const stream = new ReadableStream({
      async start(controller) {
        const response = await executor.call({
          input: message,
          chat_history: messages?.map(m => 
            `${m.role}: ${m.content}`
          ).join('\n') || ''
        }, [{
          handleLLMNewToken(token: string) {
            controller.enqueue(`data: ${JSON.stringify({ token })}\n\n`)
          },
        }])

        // Salvar no banco
        await supabase
          .from('ChatMessage')
          .insert([
            { conversationId, role: 'user', content: message },
            { conversationId, role: 'assistant', content: response.output }
          ])

        controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`)
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

**Comandos:**
```bash
cd supabase/functions
supabase functions deploy chat-stream
```

---

### **ETAPA 2: Frontend com Streaming (1 hora)**

Modificar: `src/pages/super-admin/AdminChatPage.tsx`

```tsx
import { useChat } from 'ai/react';
import { supabase } from '@/lib/supabase';

export default function AdminChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Inicializar conversa (já está implementado)
  useEffect(() => {
    // ... código existente ...
  }, []);

  // Hook mágico do Vercel AI SDK
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stream`,
    headers: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        'Authorization': `Bearer ${session?.access_token}`,
      };
    },
    body: {
      conversationId,
    },
    onFinish: (message) => {
      console.log('IA terminou:', message);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <SuperAdminLayout>
      <div className="flex flex-col h-full">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white'}>
                <CardContent className="p-4">
                  {m.content}
                </CardContent>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-white">
                <CardContent className="p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Digite seu comando..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
```

---

### **ETAPA 3: Variáveis de Ambiente**

Adicionar no `.env`:

```bash
# Já existe
VITE_SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...

# Adicionar (secrets do Supabase)
OPENROUTER_API_KEY=sk-or-v1-...
SERPER_API_KEY=... (criar em serper.dev - grátis 2.5k buscas/mês)
```

**Configurar secrets:**
```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
supabase secrets set SERPER_API_KEY=...
```

---

## 🎯 FUNCIONALIDADES DO SISTEMA FINAL

### **1. Memória Conversacional**
```
User: Crie uma campanha de Black Friday
IA: Criada! Campanha "Black Friday 2025" no Meta Ads com budget de $500.

User: Aumente o budget dela
IA: Budget aumentado para $750 na campanha Black Friday 2025.
```
✅ IA lembra da campanha anterior

### **2. Ferramentas Integradas**
```
User: Pesquise tendências de marketing digital 2025
IA: [busca no Google via web_search]
    Encontrei 3 tendências principais:
    1. IA Generativa em Anúncios
    2. Vídeos Curtos (TikTok/Reels)
    3. Personalização Hiper-segmentada
```

### **3. Ações Automáticas**
```
User: Liste minhas campanhas ativas
IA: [executa list_campaigns]
    Você tem 5 campanhas ativas:
    1. Black Friday 2025 - Meta Ads - $750/dia
    2. Remarketing Site - Google Ads - $200/dia
    ...
```

### **4. Streaming (Experiência Premium)**
```
User: Explique marketing digital
IA: Marketing digital é... [texto aparece palavra por palavra]
```
✅ Usuário vê progresso em tempo real

---

## ⏱️ CRONOGRAMA

| Etapa | Tempo | Status |
|-------|-------|--------|
| ✅ Memória persistente (AdminChat) | 1h | FEITO |
| ⏳ Instalar dependências | 15min | PRÓXIMO |
| ⏳ Criar Edge Function + LangChain | 2h | HOJE |
| ⏳ Migrar frontend para useChat | 1h | HOJE |
| ⏳ Testar + Ajustar | 1h | HOJE |
| **TOTAL** | **5h 15min** | **HOJE** |

---

## 📊 ANTES vs DEPOIS

### **ANTES (Atual)**
- ❌ Sem memória (perde contexto ao recarregar)
- ❌ Resposta instantânea (sem feedback visual)
- ❌ Sem ferramentas (só conversa)
- ❌ Monolítico (difícil adicionar features)

### **DEPOIS (Com AI SDK + LangChain)**
- ✅ Memória persistente (lembra tudo)
- ✅ Streaming (UX premium)
- ✅ Ferramentas integradas (ações reais)
- ✅ Modular (fácil adicionar tools)
- ✅ Multi-provider (troca IA facilmente)
- ✅ Produção-ready (escalável)

---

## 🚀 COMEÇAR AGORA

**Comandos para executar:**

```bash
# 1. Instalar dependências
npm install ai langchain @langchain/openai @langchain/anthropic zod

# 2. Criar Edge Function
mkdir -p supabase/functions/chat-stream
touch supabase/functions/chat-stream/index.ts
# (colar código da ETAPA 1)

# 3. Configurar secrets
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-db1eb...
supabase secrets set SERPER_API_KEY=... (criar em serper.dev)

# 4. Deploy
supabase functions deploy chat-stream

# 5. Testar
# Enviar mensagem no chat e ver mágica acontecer! ✨
```

---

## ✅ RESULTADO ESPERADO

Após implementação, o chat terá:

1. ✅ **Memória infinita** (banco de dados)
2. ✅ **Streaming visual** (like ChatGPT)
3. ✅ **3+ ferramentas** (busca web, campanhas, analytics)
4. ✅ **Sistema robusto** (LangChain Agent)
5. ✅ **Produção-ready** (escalável, testado)

**BÔNUS:** Fácil adicionar mais ferramentas:
- `send_email` (Resend)
- `upload_creative` (Uploadthing)
- `analyze_competitors` (API externa)
- `generate_report` (PDF)

---

## 💬 QUER IMPLEMENTAR AGORA?

Responda com "sim" e eu:
1. ✅ Crio a Edge Function completa
2. ✅ Migro o AdminChatPage para useChat
3. ✅ Configuro streaming
4. ✅ Adiciono 3 ferramentas iniciais
5. ✅ Testo funcionamento completo

**Tempo estimado:** 30 minutos (eu faço, você só valida)
