# 🎯 PLANO DE IMPLEMENTAÇÃO - FERRAMENTAS IA

**Data:** 27/10/2025  
**Objetivo:** Adicionar ferramentas web search, scraping e Python execution de forma organizada

---

## 📋 NOMES CORRETOS DE TABELAS (Verificado)

### **ChatMessage**
```typescript
{
  id: string
  content: string
  conversationId: string
  role: "USER" | "ASSISTANT" | "SYSTEM"
  userId: string
  model: string | null
  tokens: number | null
  createdAt: string
}
```

### **ChatConversation**
```typescript
{
  id: string
  title: string
  userId: string
  organizationId: string | null
  createdAt: string
  updatedAt: string
}
```

### **GlobalAiConnection**
```typescript
{
  id: string
  name: string
  provider: "OPENAI" | "ANTHROPIC" | "GOOGLE" | etc
  apiKey: string
  baseUrl: string | null
  model: string | null
  maxTokens: number | null
  temperature: number | null
  isActive: boolean | null
  createdAt: string | null
}
```

### **OrganizationAiConnection**
```typescript
{
  id: string
  organizationId: string | null
  globalAiConnectionId: string
  isDefault: boolean | null
  customSystemPrompt: string | null
  createdAt: string | null
}
```

### **AiUsage**
```typescript
{
  id: string
  organizationId: string | null
  userId: string | null
  globalAiConnectionId: string | null
  messageCount: number | null
  tokensUsed: number | null
  cost: number | null
  month: string
  createdAt: string | null
}
```

---

## 🛠️ FUNÇÕES DISPONÍVEIS

### **1. super-ai-tools** ✅
- `web_scraper`
- `python_executor`
- `api_caller`
- `data_processor`
- `file_downloader`
- `scrape_products`

### **2. advanced-scraper** ✅
- Scraping avançado de sites

### **3. ai-tools** ✅
- Web search
- Ferramentas de marketing

---

## 📝 ORDEM DE IMPLEMENTAÇÃO

### **FASE 1: Preparação** ✅
1. ✅ Histórico carregando corretamente
2. ✅ Persistência funcionando
3. ✅ Personalidade ativa

### **FASE 2: Detecção de Intenção** (Próxima)
Implementar detecção inteligente de quando usar cada ferramenta:
- Pesquisa web
- Scraping de produtos
- Execução Python

### **FASE 3: Integração de Ferramentas**
Chamar funções corretas baseado na intenção

### **FASE 4: Testes e Refinamento**
Testar todas as ferramentas

---

## ✅ PRÓXIMA IMPLEMENTAÇÃO

Vou criar uma função inteligente de detecção de intenção que:
1. Analisa a mensagem do usuário
2. Detecta qual ferramenta usar
3. Chama a ferramenta correta
4. Integra resultado na resposta da IA

**COMEÇAR AGORA?** (S/N)

