# 🤖 Sistema de Controle de IA no SaaS

## Conceito Chave

**Super Admin adiciona IA → Organizações usam IA → Usuários interagem**

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                   SUPER ADMIN PANEL                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🤖 Global AI Connections                               │
│  ┌────────────────────────────────────────────┐         │
│  │ [+] Adicionar Nova IA                      │         │
│  │                                            │         │
│  │ ✅ OpenAI GPT-4                           │         │
│  │    API Key: sk-proj-****                  │         │
│  │    Atribuída a: 5 organizações           │         │
│  │    [Editar] [Atribuir] [Remover]        │         │
│  │                                            │         │
│  │ ✅ Anthropic Claude                       │         │
│  │    API Key: sk-ant-****                   │         │
│  │    Atribuída a: 2 organizações           │         │
│  │    [Editar] [Atribuir] [Remover]        │         │
│  │                                            │         │
│  │ ✅ Google Gemini                          │         │
│  │    API Key: AIza****                      │         │
│  │    Atribuída a: 1 organização            │         │
│  │    [Editar] [Atribuir] [Remover]        │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
└─────────────────────────────────────────────────────────┘
                         ↓
                         ↓ Atribui
                         ↓
┌─────────────────────────────────────────────────────────┐
│              ORGANIZATION ADMIN PANEL                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🤖 IA Disponível (Somente Leitura)                     │
│  ┌────────────────────────────────────────────┐         │
│  │ ✅ OpenAI GPT-4 (Padrão)                  │         │
│  │    Status: Ativa                          │         │
│  │    Modelo: gpt-4-turbo                    │         │
│  │    Uso este mês: 1,250 mensagens         │         │
│  │                                            │         │
│  │ 💬 Configurar Prompt Padrão               │         │
│  │ [────────────────────────────────]        │         │
│  │ Você é um assistente especializado        │         │
│  │ em marketing digital...                   │         │
│  │ [────────────────────────────────]        │         │
│  │    [Salvar]                               │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ❌ USUÁRIOS NÃO PODEM:                                 │
│     • Adicionar novas IAs                              │
│     • Ver ou editar API keys                           │
│     • Remover IAs                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
                         ↓
                         ↓ Usa
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    USER PANEL                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  💬 Chat com IA                                         │
│  ┌────────────────────────────────────────────┐         │
│  │ 🤖 Usando: OpenAI GPT-4                   │         │
│  │                                            │         │
│  │ [────────────────────────────────]        │         │
│  │ Digite sua mensagem...                    │         │
│  │ [────────────────────────────────]        │         │
│  │                                            │         │
│  │ ✅ Apenas interage com a IA               │         │
│  │ ❌ Não vê API keys                        │         │
│  │ ❌ Não configura IA                       │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Dados

```sql
-- IA GLOBAL (gerenciada pelo Super Admin)
CREATE TABLE GlobalAiConnection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "OpenAI GPT-4"
  provider TEXT NOT NULL, -- OPENAI, ANTHROPIC, GOOGLE, COHERE
  apiKey TEXT NOT NULL, -- Encriptado
  baseUrl TEXT, -- URL customizada se necessário
  model TEXT, -- gpt-4-turbo, claude-3-opus, etc
  maxTokens INTEGER DEFAULT 4096,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- ATRIBUIÇÃO DE IA PARA ORGANIZAÇÕES
CREATE TABLE OrganizationAiConnection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  globalAiConnectionId UUID REFERENCES GlobalAiConnection(id) ON DELETE CASCADE,
  isDefault BOOLEAN DEFAULT false, -- IA padrão da org
  customSystemPrompt TEXT, -- Prompt customizado pela org
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(organizationId, globalAiConnectionId)
);

-- USO DE IA (tracking e limites)
CREATE TABLE AiUsage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  userId UUID REFERENCES User(id),
  globalAiConnectionId UUID REFERENCES GlobalAiConnection(id),
  messageCount INTEGER DEFAULT 1,
  tokensUsed INTEGER DEFAULT 0,
  cost DECIMAL(10,4) DEFAULT 0, -- custo estimado
  month TEXT NOT NULL, -- '2025-10'
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(organizationId, userId, globalAiConnectionId, month)
);
```

---

## 🔐 RLS Policies

```sql
-- Super Admin vê todas as IAs globais
CREATE POLICY "SuperAdmin can see all global AI"
ON GlobalAiConnection FOR SELECT
USING (
  auth.jwt() ->> 'is_super_admin' = 'true'
);

-- Organizações veem apenas IAs atribuídas a elas
CREATE POLICY "Orgs see only assigned AI"
ON OrganizationAiConnection FOR SELECT
USING (
  organizationId = current_setting('app.current_organization_id')::uuid
);

-- Usuários NÃO veem API keys (nunca!)
CREATE POLICY "Users never see API keys"
ON GlobalAiConnection FOR SELECT
USING (false); -- Bloqueado para users normais

-- Apenas Super Admin pode modificar
CREATE POLICY "Only SuperAdmin can modify global AI"
ON GlobalAiConnection FOR ALL
USING (
  auth.jwt() ->> 'is_super_admin' = 'true'
);
```

---

## 🎯 Implementação Frontend

### **1. Super Admin - Adicionar IA:**

```typescript
// src/pages/super-admin/GlobalAiPage.tsx

const addGlobalAi = async (data: AiFormData) => {
  const { error } = await supabase
    .from('GlobalAiConnection')
    .insert({
      name: data.name,
      provider: data.provider,
      apiKey: encryptApiKey(data.apiKey), // Encrypt!
      model: data.model,
      baseUrl: data.baseUrl,
      isActive: true
    });

  if (!error) {
    toast.success('IA adicionada com sucesso!');
  }
};

const assignAiToOrg = async (aiId: string, orgId: string) => {
  const { error } = await supabase
    .from('OrganizationAiConnection')
    .insert({
      organizationId: orgId,
      globalAiConnectionId: aiId,
      isDefault: false
    });
};
```

### **2. Organization Admin - Visualizar IA:**

```typescript
// src/pages/app/AiConnectionsPage.tsx

const loadAvailableAi = async () => {
  const orgId = currentOrganization.id;
  
  // Buscar IAs atribuídas à organização
  const { data, error } = await supabase
    .from('OrganizationAiConnection')
    .select(`
      id,
      isDefault,
      customSystemPrompt,
      globalAiConnection:GlobalAiConnection (
        id,
        name,
        provider,
        model
        -- NÃO incluir apiKey!
      )
    `)
    .eq('organizationId', orgId);

  setAvailableAi(data);
};

// Usuários SÓ podem configurar prompt
const updateCustomPrompt = async (prompt: string) => {
  const { error } = await supabase
    .from('OrganizationAiConnection')
    .update({ customSystemPrompt: prompt })
    .eq('organizationId', currentOrganization.id)
    .eq('isDefault', true);
};
```

### **3. User - Usar IA no Chat:**

```typescript
// src/pages/app/ChatPage.tsx

const sendMessage = async (message: string) => {
  // 1. Buscar IA padrão da organização
  const { data: orgAi } = await supabase
    .from('OrganizationAiConnection')
    .select('globalAiConnection:GlobalAiConnection(*), customSystemPrompt')
    .eq('organizationId', currentOrganization.id)
    .eq('isDefault', true)
    .single();

  if (!orgAi) {
    toast.error('Nenhuma IA configurada. Contate o admin.');
    return;
  }

  // 2. Chamar API usando dados da IA global
  // NOTA: API Key NUNCA vem para o frontend!
  // Chamada passa pelo backend/edge function
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      aiConnectionId: orgAi.globalAiConnection.id,
      systemPrompt: orgAi.customSystemPrompt
    })
  });

  // 3. Registrar uso
  await trackAiUsage(orgAi.globalAiConnection.id, tokensUsed);
};
```

---

## 🔒 Backend/Edge Function (Segurança)

```typescript
// supabase/functions/chat/index.ts

Deno.serve(async (req) => {
  const { message, aiConnectionId, systemPrompt } = await req.json();
  
  // 1. Verificar se organização tem acesso a essa IA
  const { data: access } = await supabase
    .from('OrganizationAiConnection')
    .select('*')
    .eq('organizationId', userOrganizationId)
    .eq('globalAiConnectionId', aiConnectionId)
    .single();

  if (!access) {
    return new Response('Unauthorized', { status: 403 });
  }

  // 2. Buscar API Key (SOMENTE no backend!)
  const { data: aiConnection } = await supabase
    .from('GlobalAiConnection')
    .select('apiKey, provider, model')
    .eq('id', aiConnectionId)
    .single();

  const apiKey = decryptApiKey(aiConnection.apiKey);

  // 3. Chamar IA
  const response = await callAiProvider(
    aiConnection.provider,
    apiKey,
    message,
    systemPrompt
  );

  // 4. Registrar uso
  await trackUsage(userOrganizationId, aiConnectionId, response.tokensUsed);

  return new Response(JSON.stringify(response));
});
```

---

## 📱 UI Components

### **Super Admin - Form de IA:**

```tsx
<Dialog>
  <DialogTrigger>
    <Button>+ Adicionar IA</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nova Conexão de IA Global</DialogTitle>
    </DialogHeader>
    
    <Form>
      <FormField>
        <Label>Nome</Label>
        <Input placeholder="OpenAI GPT-4" />
      </FormField>

      <FormField>
        <Label>Provider</Label>
        <Select>
          <SelectOption value="OPENAI">OpenAI</SelectOption>
          <SelectOption value="ANTHROPIC">Anthropic</SelectOption>
          <SelectOption value="GOOGLE">Google</SelectOption>
        </Select>
      </FormField>

      <FormField>
        <Label>API Key</Label>
        <Input type="password" placeholder="sk-proj-..." />
      </FormField>

      <FormField>
        <Label>Modelo</Label>
        <Input placeholder="gpt-4-turbo" />
      </FormField>

      <Button type="submit">Adicionar</Button>
    </Form>
  </DialogContent>
</Dialog>
```

### **Organization Admin - View Only:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>🤖 IA Disponível</CardTitle>
    <CardDescription>
      Configurada pelo administrador do sistema
    </CardDescription>
  </CardHeader>
  <CardContent>
    {availableAi.map(ai => (
      <div key={ai.id} className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">{ai.globalAiConnection.name}</h3>
            <p className="text-sm text-gray-500">
              {ai.globalAiConnection.provider} • {ai.globalAiConnection.model}
            </p>
            {ai.isDefault && (
              <Badge variant="success">Padrão</Badge>
            )}
          </div>
          <Badge variant="outline">Ativa</Badge>
        </div>

        <Separator className="my-4" />

        <Label>Prompt Customizado (Opcional)</Label>
        <Textarea
          value={ai.customSystemPrompt}
          onChange={(e) => updatePrompt(ai.id, e.target.value)}
          placeholder="Personalize o comportamento da IA..."
        />
        <Button size="sm" onClick={savePrompt}>Salvar</Button>

        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você não pode adicionar ou remover conexões de IA.
            Contate o suporte para solicitar novas IAs.
          </AlertDescription>
        </Alert>
      </div>
    ))}
  </CardContent>
</Card>
```

---

## 🎯 Fluxo Completo

```
1. SUPER ADMIN ADICIONA IA
   ↓
2. SUPER ADMIN ATRIBUI IA À ORGANIZAÇÃO
   ↓
3. ORGANIZATION ADMIN VÊ IA DISPONÍVEL
   ↓
4. ORGANIZATION ADMIN CONFIGURA PROMPT (OPCIONAL)
   ↓
5. USUÁRIOS USAM IA NO CHAT
   ↓
6. SISTEMA REGISTRA USO
   ↓
7. SUPER ADMIN MONITORA USO GLOBAL
```

---

## ✅ Vantagens desta Arquitetura

1. **Segurança:** API keys NUNCA expostas
2. **Controle:** Admin controla custos e acesso
3. **Simplicidade:** Usuários só usam, não configuram
4. **Escalabilidade:** Fácil adicionar novos providers
5. **Monetização:** Pode cobrar por IA premium

---

## 💡 Features Futuras

- [ ] Limites de uso por organização
- [ ] IA dedicada para planos Enterprise
- [ ] Escolha de IA por usuário (se org tiver múltiplas)
- [ ] Analytics de uso de IA
- [ ] Auto-scaling baseado em demanda
- [ ] Fallback se IA principal falhar

---

**Status:** Pronto para implementação
