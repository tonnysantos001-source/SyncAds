# 🎨 DIA 2: DALL-E - GERAÇÃO DE IMAGENS

**Data:** 23/10/2025 16:15  
**Status:** 🚀 **INICIANDO**  
**Tempo Estimado:** 3-4 horas

---

## 🎯 OBJETIVO DO DIA 2

Implementar geração de imagens com DALL-E 3 (OpenAI), permitindo criar imagens para campanhas publicitárias diretamente no sistema.

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **1. Configuração Inicial** ⏳
- [ ] Obter API Key da OpenAI
- [ ] Criar segredo no Supabase (OPENAI_API_KEY)
- [ ] Configurar GlobalAiConnection para DALL-E
- [ ] Testar conexão

### **2. Edge Function** ⏳
- [ ] Criar `generate-image/index.ts`
- [ ] Implementar chamada DALL-E 3
- [ ] Upload automático para Supabase Storage
- [ ] Salvar metadata no banco (ImageGeneration)
- [ ] Deploy da função

### **3. Tabela no Banco** ⏳
- [ ] Migration: create_image_generation
- [ ] Campos: id, userId, prompt, imageUrl, model, createdAt
- [ ] RLS policies
- [ ] Índices

### **4. Frontend** ⏳
- [ ] Página ImageGenerationPage
- [ ] Input de prompt com sugestões
- [ ] Loading state durante geração
- [ ] Gallery de imagens geradas
- [ ] Download de imagens
- [ ] Modal de preview

### **5. Integração com Chat** ⏳
- [ ] Comando /gerar-imagem no chat
- [ ] IA sugere prompts otimizados
- [ ] Visualização inline no chat

### **6. Testes** ⏳
- [ ] Gerar imagem simples
- [ ] Gerar imagem complexa
- [ ] Verificar storage
- [ ] Verificar banco
- [ ] Testar gallery

---

## 🛠️ ARQUITETURA

### **Fluxo de Geração:**
```
1. Usuário digita prompt
2. Frontend → Edge Function generate-image
3. Edge Function → OpenAI DALL-E 3
4. OpenAI retorna URL temporária
5. Download da imagem
6. Upload para Supabase Storage
7. Salvar metadata no banco
8. Retornar URL permanente
9. Exibir na gallery
```

### **Tecnologias:**
- **IA:** DALL-E 3 (OpenAI)
- **Storage:** Supabase Storage
- **Banco:** PostgreSQL (tabela ImageGeneration)
- **Backend:** Edge Functions
- **Frontend:** React + shadcn/ui

---

## 📝 ESTRUTURA DE ARQUIVOS

```
supabase/
├── functions/
│   └── generate-image/
│       └── index.ts          # Edge Function
└── migrations/
    └── create_image_generation.sql

src/
├── pages/
│   └── ImageGenerationPage.tsx
├── components/
│   ├── ImageGenerator.tsx
│   └── ImageGallery.tsx
└── lib/
    └── api/
        └── imageGeneration.ts
```

---

## 💰 CUSTOS DALL-E 3

**Modelo:** DALL-E 3  
**Qualidade Standard (1024x1024):** $0.040 por imagem  
**Qualidade HD (1024x1024):** $0.080 por imagem

**Estimativa:**
- 100 imagens/mês = $4.00
- 500 imagens/mês = $20.00
- 1000 imagens/mês = $40.00

**Recomendação:** Começar com qualidade Standard

---

## 🎨 PROMPTS OTIMIZADOS (EXEMPLOS)

### **Para Ads de E-commerce:**
```
"Professional product photography of [produto], 
white background, studio lighting, high quality, 
modern, clean, commercial advertisement style"
```

### **Para Posts de Redes Sociais:**
```
"Eye-catching social media post design for [tema],
vibrant colors, modern aesthetic, professional,
engaging, minimalist style, 1:1 aspect ratio"
```

### **Para Banners Web:**
```
"Modern web banner design for [campanha],
professional gradient background, clean typography,
high-end brand aesthetic, web-optimized"
```

---

## 🔧 IMPLEMENTAÇÃO PASSO A PASSO

### **Passo 1: API Key da OpenAI**
1. Acesse: https://platform.openai.com/api-keys
2. Crie nova API Key
3. Copie a chave (começa com `sk-proj-...`)

### **Passo 2: Configurar no Supabase**
```bash
# Adicionar segredo
npx supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### **Passo 3: Edge Function**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { prompt } = await req.json()
  
  // Chamar DALL-E 3
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    })
  })
  
  const data = await response.json()
  const imageUrl = data.data[0].url
  
  // Download e upload para Supabase Storage
  // ... (código completo virá)
  
  return new Response(JSON.stringify({ imageUrl }))
})
```

### **Passo 4: Migration**
```sql
CREATE TABLE "ImageGeneration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  prompt TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  model TEXT DEFAULT 'dall-e-3',
  size TEXT DEFAULT '1024x1024',
  quality TEXT DEFAULT 'standard',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE "ImageGeneration" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images"
  ON "ImageGeneration" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create images"
  ON "ImageGeneration" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");
```

### **Passo 5: Frontend**
```typescript
// ImageGenerator.tsx
const [prompt, setPrompt] = useState('')
const [loading, setLoading] = useState(false)
const [imageUrl, setImageUrl] = useState('')

const handleGenerate = async () => {
  setLoading(true)
  
  const response = await fetch('/functions/v1/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  
  const { imageUrl } = await response.json()
  setImageUrl(imageUrl)
  setLoading(false)
}
```

---

## 🎯 RESULTADO ESPERADO

Ao final do Dia 2, você terá:

✅ **Geração de imagens funcionando**
- Input de prompt
- Botão "Gerar Imagem"
- Loading state
- Imagem gerada exibida

✅ **Storage configurado**
- Bucket "images" criado
- Upload automático
- URLs permanentes

✅ **Gallery básica**
- Lista de imagens geradas
- Preview
- Download

✅ **Banco atualizado**
- Tabela ImageGeneration
- Metadata salva
- Histórico de gerações

---

## 📊 MÉTRICAS DE SUCESSO

- [ ] ✅ Gerar primeira imagem
- [ ] ✅ Imagem salva no Storage
- [ ] ✅ Metadata no banco
- [ ] ✅ Gallery exibindo imagens
- [ ] ✅ Download funcionando
- [ ] ✅ Tempo de geração < 30s
- [ ] ✅ Sistema estável

---

## 🚀 COMEÇANDO AGORA

**Primeira pergunta:**
```
Você já tem uma API Key da OpenAI?
```

**Sim:** Envie a chave e vamos configurar!  
**Não:** Te ajudo a criar uma conta e gerar a chave!

**O que preciso saber:**
1. Tem conta OpenAI? (Sim/Não)
2. Tem créditos na conta? (Sim/Não)
3. Quer começar com qual qualidade? (Standard/HD)

**Me responda e vamos começar o Dia 2! 🎨**
