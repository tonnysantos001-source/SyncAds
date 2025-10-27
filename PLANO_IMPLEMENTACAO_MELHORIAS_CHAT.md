# 📋 PLANO DE IMPLEMENTAÇÃO - MELHORIAS NO CHAT

**Data:** 27/10/2025

---

## 🎯 OBJETIVO

Implementar as melhorias solicitadas no chat baseado na imagem de referência:
1. ✅ Substituir placeholder 🦔 por Sonic 3D real
2. ✅ Melhorar design dos botões OAuth
3. ✅ Adicionar status visual de conexão
4. ✅ Adicionar gravação de áudio (microfone)
5. ✅ Adicionar upload de imagens e arquivos
6. ✅ Modificar menu + para mostrar apenas 2 opções
7. ✅ Criar imagem via IA (text-to-image)

---

## 📊 ESTRUTURA ATUAL

### **Arquivos Identificados:**

1. **Frontend:**
   - `src/pages/app/ChatPage.tsx` - Chat principal do usuário
   - `src/pages/super-admin/AdminChatPage.tsx` - Chat admin
   - `src/components/ai/AiThinkingIndicator.tsx` - Indicador de pensamento

2. **Backend:**
   - `supabase/functions/chat-enhanced/index.ts` - IA híbrida
   - `supabase/functions/super-ai-tools/index.ts` - Ferramentas
   - `supabase/functions/ai-tools/index.ts` - Web search

3. **Componentes:**
   - Chat tem botão de clip para anexar arquivos
   - Funcionalidade básica de upload já existe mas só mostra toast

---

## 🔍 ANÁLISE DA ESTRUTURA DE TABELAS

### **Tabelas Relevantes:**

```sql
-- Armazenar mensagens
ChatMessage (
  id UUID,
  conversationId UUID,
  role TEXT, -- 'USER', 'ASSISTANT', 'SYSTEM'
  content TEXT,
  metadata JSONB, -- Para anexos
  userId UUID,
  createdAt TIMESTAMP
)

-- Armazenar anexos
FileAttachment (
  id UUID,
  messageId UUID REFERENCES ChatMessage(id),
  fileName TEXT,
  fileType TEXT,
  fileUrl TEXT,
  fileSize INTEGER,
  uploadedAt TIMESTAMP
)

-- Armazenar status de conexões OAuth
Integration (
  id UUID,
  userId UUID,
  platform TEXT,
  isConnected BOOLEAN,
  credentials JSONB
)
```

---

## 🚀 IMPLEMENTAÇÃO PASSO A PASSO

### **Fase 1: Ícone Sonic e Visual (Prioridade Alta)**

**Passo 1.1:** Criar componente Sonic
- Substituir emoji 🦔 por SVG/imagem real
- Arquivo: `src/components/ai/SonicIcon.tsx`

**Passo 1.2:** Melhorar badges OAuth
- Adicionar gradientes
- Adicionar logos das plataformas
- Arquivo: Modificar `IntegrationConnectionCard.tsx`

**Passo 1.3:** Status visual de conexão
- Indicador verde/vermelho ao lado da IA
- Mostrar "Conectado" / "Não conectado"
- Arquivo: Adicionar ao `AiThinkingIndicator.tsx`

---

### **Fase 2: Upload de Imagens e Arquivos (Prioridade Alta)**

**Passo 2.1:** Criar tabela FileAttachment
```sql
CREATE TABLE FileAttachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  messageId UUID REFERENCES ChatMessage(id),
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  fileSize INTEGER,
  uploadedAt TIMESTAMP DEFAULT NOW()
);
```

**Passo 2.2:** Modificar menu +
- Remover opções extras
- Deixar apenas: "Adicionar fotos e ficheiros" e "Criar imagem"
- Arquivo: `ChatPage.tsx`

**Passo 2.3:** Implementar upload real
- Usar Supabase Storage
- Salvar URL na mensagem
- Enviar URL para IA processar
- Arquivo: `ChatPage.tsx`, criar `uploadFile` function

---

### **Fase 3: Gravação de Áudio (Prioridade Média)**

**Passo 3.1:** Adicionar botão de microfone
- Adicionar ao lado do clip
- Estado: recording/not recording

**Passo 3.2:** Implementar MediaRecorder API
```typescript
const startRecording = () => {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const recorder = new MediaRecorder(stream);
      recorder.start();
      // ...
    });
};
```

**Passo 3.3:** Converter áudio para texto
- Enviar áudio para Supabase Storage
- Chamar Edge Function para transcrever
- Usar Whisper API ou Google Speech-to-Text

---

### **Fase 4: Geração de Imagem (Prioridade Média)**

**Passo 4.1:** Criar Edge Function para geração
- Arquivo: `supabase/functions/generate-image/index.ts`
- Integrar com DALL-E, Stable Diffusion, ou similar

**Passo 4.2:** Adicionar botão "Criar imagem"
- No menu +
- Modal com input de prompt
- Mostrar preview da imagem gerada

---

### **Fase 5: Auditoria Completa (Prioridade Baixa)**

**Passo 5.1:** Auditar frontend
- Performance
- Melhorias de UX
- Acessibilidade

**Passo 5.2:** Auditar backend
- Estrutura de Edge Functions
- Otimizações de queries
- Rate limiting

---

## 📝 ORDEM DE IMPLEMENTAÇÃO

1. ✅ **Ícone Sonic** (rápido, visual)
2. ✅ **Upload de arquivos** (importante, já tem estrutura básica)
3. ✅ **Gravação de áudio** (depende do upload estar pronto)
4. ✅ **Status de conexão** (visual)
5. ⏳ **Geração de imagem** (novo recurso)
6. ⏳ **Auditoria** (depois de tudo)

---

**Próximo passo:** Começar pela substituição do ícone Sonic e implementação do upload real de arquivos.

