# 🗄️ CRIAR TABELAS DA EXTENSÃO - MANUAL

**Por que:** Script automático precisa de SERVICE_ROLE_KEY  
**Solução:** Executar SQL manualmente no Dashboard do Supabase  
**Tempo:** ~2 minutos

---

## 📋 PASSO A PASSO

### 1️⃣ Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto: **SyncAds**

---

### 2️⃣ Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New query**

---

### 3️⃣ Copiar o SQL

**Arquivo:** `supabase_migrations/create_extension_tables.sql`

**OU copie abaixo:**

```sql
-- ============================================
-- TABELAS DA EXTENSÃO SYNCADS
-- ============================================

-- 1. EXTENSIONDEVICE
CREATE TABLE IF NOT EXISTS "ExtensionDevice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "isOnline" BOOLEAN DEFAULT true,
  "lastSeen" TIMESTAMPTZ DEFAULT NOW(),
  "userAgent" TEXT,
  "browserName" TEXT,
  "browserVersion" TEXT,
  "osName" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXTENSIONCOMMAND
CREATE TABLE IF NOT EXISTS "ExtensionCommand" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  params JSONB DEFAULT '{}',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  result JSONB,
  error TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "executedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ
);

-- 3. EXTENSIONLOG
CREATE TABLE IF NOT EXISTS "ExtensionLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT NOT NULL,
  "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'SUCCESS')),
  message TEXT NOT NULL,
  data JSONB,
  url TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_extension_device_user_id ON "ExtensionDevice"("userId");
CREATE INDEX IF NOT EXISTS idx_extension_device_online ON "ExtensionDevice"("isOnline");
CREATE INDEX IF NOT EXISTS idx_extension_command_device_id ON "ExtensionCommand"("deviceId");
CREATE INDEX IF NOT EXISTS idx_extension_command_status ON "ExtensionCommand"(status);
CREATE INDEX IF NOT EXISTS idx_extension_log_device_id ON "ExtensionLog"("deviceId");

-- RLS
ALTER TABLE "ExtensionDevice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExtensionCommand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExtensionLog" ENABLE ROW LEVEL SECURITY;

-- POLICIES - EXTENSIONDEVICE
CREATE POLICY "Users can view their own devices" ON "ExtensionDevice" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own devices" ON "ExtensionDevice" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own devices" ON "ExtensionDevice" FOR UPDATE USING (auth.uid() = "userId");

-- POLICIES - EXTENSIONCOMMAND
CREATE POLICY "Users can view their own commands" ON "ExtensionCommand" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own commands" ON "ExtensionCommand" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own commands" ON "ExtensionCommand" FOR UPDATE USING (auth.uid() = "userId");

-- POLICIES - EXTENSIONLOG
CREATE POLICY "Users can view their own logs" ON "ExtensionLog" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own logs" ON "ExtensionLog" FOR INSERT WITH CHECK (auth.uid() = "userId");
```

---

### 4️⃣ Colar e Executar

1. **Cole o SQL** no editor
2. Clique em **Run** (ou pressione `Ctrl + Enter`)
3. Aguarde executar (~5 segundos)

---

### 5️⃣ Verificar

**Sucesso esperado:**
```
Success. No rows returned
```

**OU ver as 3 tabelas criadas:**
- ExtensionDevice
- ExtensionCommand
- ExtensionLog

---

## ✅ VERIFICAÇÃO

### Verificar no Table Editor

1. Vá em **Table Editor** (menu lateral)
2. Procure pelas tabelas:
   - ✅ ExtensionDevice
   - ✅ ExtensionCommand
   - ✅ ExtensionLog

### Verificar RLS

1. Clique em cada tabela
2. Vá na aba **Policies**
3. Deve ter 2-3 policies cada

---

## 🐛 SE DER ERRO

### Erro: "relation User does not exist"

**Causa:** Tabela User não existe  
**Solução:** Seu schema usa outro nome? Tente:
- Substituir `"User"` por `users`
- Ou `"public"."User"`

### Erro: "already exists"

**Causa:** Tabelas já foram criadas  
**Solução:** Tudo certo! Ignore o erro

### Erro: "permission denied"

**Causa:** Sem permissão para criar tabelas  
**Solução:** Use conta de admin/owner do projeto

---

## 🎯 PRÓXIMO PASSO

Depois de criar as tabelas:

1. ✅ Limpe o cache do navegador (`Ctrl + Shift + R`)
2. ✅ Acesse o chat: https://syncads.com.br/chat
3. ✅ Instale a extensão SyncAds AI
4. ✅ Faça login na extensão
5. ✅ Veja o badge mudar para "Extensão Ativa" 🟢

---

## 📞 SUPORTE

**Dashboard Supabase:** https://supabase.com/dashboard  
**SQL Editor:** Project → SQL Editor → New query

**Arquivo SQL completo:** `supabase_migrations/create_extension_tables.sql`

---

**🚀 BOA SORTE!**

Depois me confirme se as tabelas foram criadas com sucesso!