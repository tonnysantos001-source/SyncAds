# 🚀 PLANO DE IMPLEMENTAÇÃO COMPLETO - GROWTH OS

**Modelo de Negócio:** Checkout 100% GRATUITO + IA Premium  
**Objetivo:** Sistema completo em 30 dias  
**Data Início:** 23/10/2025

---

## 🎯 VISÃO DO PRODUTO

### **SyncAds Growth OS**
Sistema de checkout gratuito com IA-mãe orquestrando sub-IAs especializadas para:
- 📝 **Copy**: Criação de textos, headlines, CTAs
- 🎨 **Criativos**: Geração de imagens e vídeos
- 📊 **Tráfego**: Gestão de campanhas em múltiplas plataformas
- 📧 **E-mails**: Automação de e-mail marketing
- 💰 **Checkout**: +50 gateways de pagamento integrados

**Diferencial:** Cliente usa checkout grátis → Paga apenas pela IA

---

## ✅ FASE 1 - FUNDAÇÃO (Dias 1-3) - HOJE!

### **1.1. Chat Clientes** ✅ (JÁ EXISTE!)
**Status:** Verificar funcionalidades

**Checklist:**
- [x] ChatPage existe em `/app/chat`
- [ ] Usa Edge Function `chat-stream`
- [ ] Carrega histórico de mensagens
- [ ] Quota de mensagens por plano
- [ ] Interface responsiva

**Ações Imediatas:**
1. ✅ Verificar se usa sendSecureMessage()
2. ⏳ Implementar quota por plano
3. ⏳ Testar com cliente real

---

### **1.2. Quota de Mensagens** 🔄 (Hoje - 2h)

**Migration necessária:**
```sql
-- Adicionar coluna de quota na Organization
ALTER TABLE "Organization"
ADD COLUMN "aiMessagesQuota" INTEGER DEFAULT 100,
ADD COLUMN "aiMessagesUsed" INTEGER DEFAULT 0,
ADD COLUMN "aiImagesQuota" INTEGER DEFAULT 10,
ADD COLUMN "aiImagesUsed" INTEGER DEFAULT 0,
ADD COLUMN "aiVideosQuota" INTEGER DEFAULT 0,
ADD COLUMN "aiVideosUsed" INTEGER DEFAULT 0;

-- Atualizar quotas por plano
UPDATE "Organization" SET
  "aiMessagesQuota" = CASE 
    WHEN plan = 'FREE' THEN 10
    WHEN plan = 'STARTER' THEN 100
    WHEN plan = 'PROFESSIONAL' THEN 500
    WHEN plan = 'ENTERPRISE' THEN 999999
  END,
  "aiImagesQuota" = CASE
    WHEN plan = 'FREE' THEN 0
    WHEN plan = 'STARTER' THEN 50
    WHEN plan = 'PROFESSIONAL' THEN 200
    WHEN plan = 'ENTERPRISE' THEN 1000
  END,
  "aiVideosQuota" = CASE
    WHEN plan = 'FREE' THEN 0
    WHEN plan = 'STARTER' THEN 5
    WHEN plan = 'PROFESSIONAL' THEN 20
    WHEN plan = 'ENTERPRISE' THEN 100
  END;
```

**Arquivo:** `supabase/migrations/add_ai_quotas.sql`

---

## 🌐 FASE 2 - INTEGRAÇÕES APIs (Dias 4-14)

### **2.1. Meta Ads API** 🔴 (Dias 4-6 - 24h)

**O que implementar:**

#### **A. Autenticação OAuth**
```typescript
// supabase/functions/auth/meta-oauth/index.ts
- Conectar conta Meta
- Salvar tokens (access + refresh)
- Renovar tokens automaticamente
```

#### **B. Ferramentas para IA**
```typescript
// supabase/functions/_shared/meta-ads.ts

1. createMetaCampaign()
   - Criar campanha automaticamente
   - Configurar targeting
   - Definir budget
   
2. pauseMetaCampaign()
   - Pausar/retomar campanhas
   
3. getMetaMetrics()
   - Impressões, cliques, conversões
   - CPC, CPM, ROI
   
4. updateMetaBudget()
   - Ajustar budget diário/total
   
5. createMetaAdSet()
   - Criar conjuntos de anúncios
   
6. createMetaAd()
   - Criar anúncios com criativos
```

#### **C. Comandos IA**
```
Cliente: "Crie uma campanha no Facebook para vender meu produto X com budget de R$100/dia"

IA executa:
1. Verifica se Meta Ads está conectada
2. Cria campanha automaticamente
3. Configura targeting baseado no produto
4. Define budget
5. Retorna ID e link da campanha
```

**Arquivos:**
- `supabase/functions/auth/meta-oauth/index.ts`
- `supabase/functions/_shared/meta-ads.ts`
- `src/lib/integrations/metaAds.ts`
- Migration: `meta_ads_integration.sql`

---

### **2.2. Google Ads API** 🔴 (Dias 7-9 - 24h)

**Idêntico ao Meta Ads, mas para Google:**

#### **Ferramentas:**
1. `createGoogleCampaign()`
2. `pauseGoogleCampaign()`
3. `getGoogleMetrics()`
4. `updateGoogleBudget()`
5. `createGoogleAdGroup()`
6. `createGoogleAd()`

**Arquivos:**
- `supabase/functions/auth/google-oauth/index.ts`
- `supabase/functions/_shared/google-ads.ts`
- `src/lib/integrations/googleAds.ts`
- Migration: `google_ads_integration.sql`

---

### **2.3. LinkedIn, TikTok, Twitter Ads** 🟡 (Dias 10-14 - 40h)

**Implementação Similar:**

#### **LinkedIn Ads:**
- OAuth LinkedIn
- Campanhas B2B
- Targeting profissional

#### **TikTok Ads:**
- OAuth TikTok
- Campanhas vídeo
- Targeting por interesse

#### **Twitter (X) Ads:**
- OAuth Twitter
- Campanhas tweet
- Targeting por hashtags

**Arquivos (cada plataforma):**
- `supabase/functions/auth/{platform}-oauth/index.ts`
- `supabase/functions/_shared/{platform}-ads.ts`
- `src/lib/integrations/{platform}Ads.ts`

---

## 🎨 FASE 3 - GERAÇÃO DE MÍDIA (Dias 15-21)

### **3.1. Geração de Imagens - DALL-E** 🟡 (Dias 15-17 - 24h)

**API:** OpenAI DALL-E 3

**Implementação:**

#### **A. Edge Function**
```typescript
// supabase/functions/generate-image/index.ts

export async function generateImage(params: {
  prompt: string;
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
  organizationId: string;
}) {
  // 1. Verificar quota
  // 2. Chamar DALL-E 3
  // 3. Salvar no Storage
  // 4. Registrar em MediaGeneration
  // 5. Decrementar quota
  // 6. Retornar URL
}
```

#### **B. Migration**
```sql
CREATE TABLE "MediaGeneration" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID REFERENCES "Organization"(id),
  "userId" TEXT REFERENCES "User"(id),
  type TEXT CHECK (type IN ('IMAGE', 'VIDEO')),
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL, -- DALL-E, RUNWAY, etc
  url TEXT NOT NULL,
  cost NUMERIC,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

#### **C. Comandos IA**
```
Cliente: "Gere uma imagem de um produto tecnológico moderno"
Cliente: "Crie um banner promocional para Black Friday"
Cliente: "Faça uma imagem de capa para Facebook"
```

**Custo:** ~$0.04 por imagem (1024x1024)  
**Quota Sugerida:** FREE: 0 | STARTER: 50/mês | PRO: 200/mês | ENTERPRISE: 1000/mês

---

### **3.2. Geração de Vídeos - Runway ML** 🟡 (Dias 18-21 - 32h)

**API:** Runway ML Gen-2

**Implementação:**

#### **A. Edge Function**
```typescript
// supabase/functions/generate-video/index.ts

export async function generateVideo(params: {
  prompt: string;
  duration: 4 | 8; // segundos
  style?: string;
  organizationId: string;
}) {
  // 1. Verificar quota
  // 2. Chamar Runway ML
  // 3. Aguardar processamento (webhook)
  // 4. Salvar no Storage
  // 5. Registrar em MediaGeneration
  // 6. Decrementar quota
  // 7. Retornar URL
}
```

#### **B. Comandos IA**
```
Cliente: "Gere um vídeo de 8s mostrando meu produto"
Cliente: "Crie um vídeo promocional para Instagram Reels"
```

**Custo:** ~$1-2 por vídeo de 4s  
**Quota Sugerida:** FREE: 0 | STARTER: 5/mês | PRO: 20/mês | ENTERPRISE: 100/mês

---

## 🧠 FASE 4 - INTELIGÊNCIA AVANÇADA (Dias 22-28)

### **4.1. Memória RAG** 🟡 (Dias 22-25 - 32h)

**Objetivo:** IA lembra de TUDO que o cliente já disse

**Implementação:**

#### **A. Enable pgvector**
```sql
-- Migration: enable_vector_extension.sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "ChatMessage"
ADD COLUMN embedding vector(1536);

CREATE INDEX ON "ChatMessage" USING ivfflat (embedding vector_cosine_ops);
```

#### **B. Edge Function**
```typescript
// supabase/functions/_shared/embeddings.ts

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}

export async function searchSimilarMessages(
  query: string,
  conversationId: string,
  limit: number = 5
): Promise<ChatMessage[]> {
  const queryEmbedding = await createEmbedding(query);
  
  // Buscar mensagens similares via cosine similarity
  const { data } = await supabase
    .rpc('search_messages', {
      query_embedding: queryEmbedding,
      conversation_id: conversationId,
      match_count: limit
    });
    
  return data;
}
```

#### **C. Modificar chat-stream**
```typescript
// Antes de enviar para IA, buscar contexto relevante
const relevantHistory = await searchSimilarMessages(message, conversationId);

const contextMessages = relevantHistory.map(msg => ({
  role: msg.role,
  content: msg.content
}));

// Adicionar ao contexto da IA
requestMessages = [...contextMessages, ...recentMessages, userMessage];
```

**Benefício:**
- IA lembra conversas de semanas/meses atrás
- Contexto ilimitado
- Respostas mais precisas

**Custo:** ~$0.0001 por embedding (~R$50/mês para 100k mensagens)

---

### **4.2. Analytics Avançado** 🟡 (Dias 26-28 - 24h)

**Objetivo:** IA analisa dados e faz previsões

**Implementação:**

#### **A. Dashboard Preditivo**
```typescript
// src/pages/app/AIAnalyticsPage.tsx

Features:
1. Previsão de ROI
   "Sua campanha X tem 78% de chance de atingir R$10k"
   
2. Alertas Inteligentes
   "Campanha Y está com CPC 40% acima da média"
   "Sugestão: Reduza lance de R$2 para R$1.50"
   
3. Recomendações Automáticas
   "Aumente budget da campanha Z em 20%"
   "Pause anúncio W (CTR < 0.5%)"
   
4. Insights de Público
   "Homens 25-34 convertem 3x mais"
   "Horário ideal: 20h-22h"
```

#### **B. Edge Function**
```typescript
// supabase/functions/_shared/analytics-ai.ts

export async function predictROI(campaignId: string): Promise<{
  predicted: number;
  confidence: number;
  reasoning: string;
}> {
  // Buscar histórico
  const history = await getCampaignHistory(campaignId);
  
  // Enviar para IA analisar
  const prediction = await analyzeWithAI(history);
  
  return prediction;
}

export async function generateAlerts(organizationId: string): Promise<Alert[]> {
  // Buscar todas campanhas
  // Analisar métricas
  // Identificar anomalias
  // Gerar alertas
}
```

---

## 🤖 FASE 5 - ORQUESTRAÇÃO IA-MÃE (Dias 29-30)

### **5.1. Sistema Multi-Agentes** 🟢

**Arquitetura:**

```
IA-MÃE (Orquestradora)
    ├── Agente Copy (especialista em textos)
    ├── Agente Designer (especialista em criativos)
    ├── Agente Tráfego (especialista em campanhas)
    ├── Agente Analytics (especialista em dados)
    └── Agente Email (especialista em automação)
```

**Implementação:**

#### **A. Tabela de Agentes**
```sql
CREATE TABLE "AIAgent" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  systemPrompt TEXT NOT NULL,
  capabilities TEXT[] NOT NULL,
  isActive BOOLEAN DEFAULT true
);

INSERT INTO "AIAgent" (name, role, systemPrompt, capabilities) VALUES
('Agente Copy', 'COPYWRITER', 'Você é um expert em copywriting...', ARRAY['headlines', 'ctas', 'descriptions']),
('Agente Designer', 'DESIGNER', 'Você é um expert em design...', ARRAY['images', 'videos', 'banners']),
('Agente Tráfego', 'TRAFFIC', 'Você é um expert em tráfego pago...', ARRAY['campaigns', 'targeting', 'bidding']),
('Agente Analytics', 'ANALYST', 'Você é um expert em análise de dados...', ARRAY['metrics', 'insights', 'predictions']),
('Agente Email', 'EMAIL', 'Você é um expert em email marketing...', ARRAY['sequences', 'automation', 'templates']);
```

#### **B. IA-Mãe Orquestradora**
```typescript
// supabase/functions/_shared/orchestrator.ts

export async function orchestrateTask(task: string, context: any) {
  // 1. IA-Mãe analisa a tarefa
  const analysis = await analyzeTask(task);
  
  // 2. Decide quais agentes usar
  const agents = selectAgents(analysis);
  
  // 3. Distribui subtarefas
  const subtasks = distributeSubtasks(analysis, agents);
  
  // 4. Executa em paralelo
  const results = await Promise.all(
    subtasks.map(st => executeAgentTask(st))
  );
  
  // 5. Consolida resultados
  return consolidateResults(results);
}
```

#### **C. Exemplo de Uso**
```
Cliente: "Crie uma campanha completa para meu novo produto"

IA-Mãe orquestra:
1. Agente Analytics → Analisa público-alvo e histórico
2. Agente Copy → Cria headlines e textos
3. Agente Designer → Gera criativos (imagens/vídeos)
4. Agente Tráfego → Configura e lança campanha
5. Agente Email → Cria sequência de follow-up

Resultado: Campanha 100% automatizada em minutos!
```

---

## 💰 PRECIFICAÇÃO SUGERIDA

### **Planos:**

| Plano | Preço | Mensagens IA | Imagens | Vídeos | APIs |
|-------|-------|--------------|---------|--------|------|
| **FREE** | R$ 0 | 10/dia | 0 | 0 | ❌ |
| **STARTER** | R$ 49/mês | 100/dia | 50/mês | 5/mês | 1 plataforma |
| **PROFESSIONAL** | R$ 149/mês | 500/dia | 200/mês | 20/mês | 3 plataformas |
| **ENTERPRISE** | R$ 499/mês | Ilimitado | 1000/mês | 100/mês | Todas |

### **Custos Operacionais:**

| Recurso | Custo Unitário | Custo Mensal (1000 clientes) |
|---------|----------------|-------------------------------|
| GROQ (mensagens) | R$ 0 | R$ 0 |
| DALL-E (imagens) | R$ 0.20 | R$ 10.000 |
| Runway (vídeos) | R$ 5.00 | R$ 5.000 |
| Embeddings | R$ 0.001 | R$ 100 |
| Meta Ads API | R$ 0 | R$ 0 |
| Google Ads API | R$ 0 | R$ 0 |
| Supabase Pro | R$ 125 | R$ 125 |
| **TOTAL** | - | **R$ 15.225/mês** |

### **Receita Esperada (1000 clientes):**

- 200 FREE (R$ 0)
- 500 STARTER (R$ 24.500)
- 250 PROFESSIONAL (R$ 37.250)
- 50 ENTERPRISE (R$ 24.950)

**TOTAL:** R$ 86.700/mês  
**CUSTO:** R$ 15.225/mês  
**LUCRO:** R$ 71.475/mês  
**MARGEM:** **82.4%** 🚀

---

## 📅 CRONOGRAMA DETALHADO

### **Semana 1:**
- ✅ Dia 1: Verificar ChatPage + Quotas (8h)
- 🔄 Dia 2-3: Meta Ads OAuth (16h)

### **Semana 2:**
- 🔄 Dia 4-5: Meta Ads ferramentas (16h)
- 🔄 Dia 6-7: Google Ads OAuth + ferramentas (16h)

### **Semana 3:**
- 🔄 Dia 8-10: LinkedIn, TikTok, Twitter (24h)
- 🔄 Dia 11-12: DALL-E implementação (16h)

### **Semana 4:**
- 🔄 Dia 13-15: Runway ML vídeos (24h)
- 🔄 Dia 16-18: Memória RAG (24h)

### **Semana 5:**
- 🔄 Dia 19-21: Analytics Avançado (24h)
- 🔄 Dia 22-23: Orquestração IA-Mãe (16h)

### **Semana 6:**
- 🔄 Dia 24-25: Testes integração (16h)
- 🔄 Dia 26-27: Testes com usuários (16h)
- 🔄 Dia 28-30: Ajustes + Deploy produção (24h)

**TOTAL:** ~240 horas (~30 dias úteis)

---

## 🎯 PRÓXIMO PASSO IMEDIATO

**AGORA (próximas 2 horas):**

1. ✅ Verificar se ChatPage usa `sendSecureMessage()`
2. ✅ Criar migration de quotas
3. ✅ Implementar validação de quota na Edge Function
4. ✅ Testar chat com cliente

**Depois (próximos 3 dias):**

5. 🔄 Criar app Meta Developer
6. 🔄 Implementar OAuth Meta
7. 🔄 Criar ferramentas Meta Ads para IA

---

**🚀 VAMOS COMEÇAR AGORA!**

Qual você prefere que eu faça primeiro?
A) Implementar quotas de mensagens
B) Começar Meta Ads OAuth
C) Ambos em paralelo
