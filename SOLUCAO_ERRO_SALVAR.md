# 🔧 SOLUÇÃO: Erro ao Salvar Gateway Pague-X

**Data**: 31/01/2025  
**Erro**: "GatewayConfig não encontrada para o usuário"  
**Tela**: Logs do DevTools mostrando erros vermelhos em gateway-config-verify

---

## 🎯 CAUSA DO PROBLEMA

O erro ocorre porque o sistema está tentando **verificar credenciais** antes de **criar o registro** no banco. 

O fluxo correto deveria ser:
1. ✅ Salvar credenciais (criar GatewayConfig)
2. ✅ Depois verificar automaticamente

Mas está acontecendo:
1. ❌ Tentar verificar sem ter GatewayConfig
2. ❌ Erro: "GatewayConfig não encontrada"

---

## ✅ SOLUÇÃO RÁPIDA (2 opções)

### OPÇÃO 1: Criar GatewayConfig Manualmente no Banco (RECOMENDADO)

#### Passo 1: Abrir SQL Editor
1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/sql/new

#### Passo 2: Descobrir seu User ID
Cole e execute:
```sql
SELECT id, email, name FROM "User" ORDER BY "createdAt" DESC LIMIT 10;
```

Copie o **id** do seu usuário (o UUID).

#### Passo 3: Verificar se Gateway Pague-X Existe
```sql
SELECT id, name, slug FROM "Gateway" WHERE slug = 'paguex';
```

Se retornar **vazio**, execute primeiro o arquivo `EXECUTAR_ESTE_SQL_AGORA.sql` completo.

#### Passo 4: Criar GatewayConfig para seu Usuário
**IMPORTANTE**: Substitua `SEU_USER_ID_AQUI` pelo UUID que você copiou no Passo 2.

```sql
INSERT INTO "GatewayConfig" (
  "userId",
  "gatewayId",
  "isActive",
  "isDefault",
  "isVerified",
  environment,
  credentials,
  "createdAt",
  "updatedAt"
)
SELECT
  'SEU_USER_ID_AQUI'::uuid as "userId",
  g.id as "gatewayId",
  false as "isActive",
  false as "isDefault",
  false as "isVerified",
  'production' as environment,
  '{}'::jsonb as credentials,
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Gateway" g
WHERE g.slug = 'paguex'
  AND NOT EXISTS (
    SELECT 1 FROM "GatewayConfig" gc
    WHERE gc."userId" = 'SEU_USER_ID_AQUI'::uuid
      AND gc."gatewayId" = g.id
  );
```

#### Passo 5: Verificar se Criou
```sql
SELECT
  gc.id,
  u.email,
  g.name as gateway,
  gc."isActive",
  gc."isVerified",
  gc.environment
FROM "GatewayConfig" gc
INNER JOIN "Gateway" g ON g.id = gc."gatewayId"
INNER JOIN "User" u ON u.id = gc."userId"
WHERE g.slug = 'paguex';
```

Deve retornar 1 linha com seu email e gateway "Pague-X".

#### Passo 6: Voltar para a Interface
1. Faça **hard refresh** no navegador: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. Volte para a página do Pague-X
3. Preencha as credenciais novamente
4. Clique em **"Salvar"**

---

### OPÇÃO 2: Modificar Temporariamente o Frontend

Se a Opção 1 não funcionar, podemos fazer o frontend criar o GatewayConfig antes de tentar verificar.

**ARQUIVO**: `src/pages/app/checkout/GatewayConfigPage.tsx`

**LINHA ~165-195**: Modificar o bloco `else { // Create new config`

Adicionar após a linha `if (error) throw error;`:

```typescript
// Aguardar um pouco para o banco processar
await new Promise(resolve => setTimeout(resolve, 500));
```

Isso dá tempo para o registro ser criado antes de tentar verificar.

---

## 🔍 DIAGNÓSTICO COMPLETO

### Verificar Problemas de RLS (Row Level Security)

Se mesmo após criar o GatewayConfig ainda der erro, pode ser problema de permissões:

```sql
-- Ver políticas RLS da tabela GatewayConfig
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'GatewayConfig';
```

Se não houver políticas permitindo INSERT/UPDATE/SELECT para o usuário autenticado, execute:

```sql
-- Permitir que usuários vejam apenas seus próprios GatewayConfigs
DROP POLICY IF EXISTS "Users can view own gateway configs" ON "GatewayConfig";
CREATE POLICY "Users can view own gateway configs"
  ON "GatewayConfig"
  FOR SELECT
  USING (auth.uid() = "userId");

-- Permitir que usuários criem seus próprios GatewayConfigs
DROP POLICY IF EXISTS "Users can create own gateway configs" ON "GatewayConfig";
CREATE POLICY "Users can create own gateway configs"
  ON "GatewayConfig"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Permitir que usuários atualizem seus próprios GatewayConfigs
DROP POLICY IF EXISTS "Users can update own gateway configs" ON "GatewayConfig";
CREATE POLICY "Users can update own gateway configs"
  ON "GatewayConfig"
  FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Permitir que usuários deletem seus próprios GatewayConfigs
DROP POLICY IF EXISTS "Users can delete own gateway configs" ON "GatewayConfig";
CREATE POLICY "Users can delete own gateway configs"
  ON "GatewayConfig"
  FOR DELETE
  USING (auth.uid() = "userId");
```

---

## 📊 CHECKLIST DE SOLUÇÃO

Execute na ordem:

- [ ] **1. Verificar se Gateway existe** (Passo 3)
- [ ] **2. Se não existir**: Executar `EXECUTAR_ESTE_SQL_AGORA.sql`
- [ ] **3. Descobrir meu User ID** (Passo 2)
- [ ] **4. Criar GatewayConfig** (Passo 4 - substituir o UUID)
- [ ] **5. Verificar criação** (Passo 5)
- [ ] **6. Hard refresh no navegador** (Ctrl+Shift+R)
- [ ] **7. Limpar DevTools Console** (ícone 🚫 no console)
- [ ] **8. Preencher credenciais novamente**
- [ ] **9. Clicar em Salvar**
- [ ] **10. Verificar logs** (não deve mais ter erros vermelhos)

---

## ✅ RESULTADO ESPERADO

Após seguir os passos:

### Na Interface:
- ✅ Mensagem: "Configuração salva!"
- ✅ Mensagem: "Credenciais verificadas"
- ✅ Badge verde: "✓ Verificado"
- ✅ Ambiente: production
- ✅ Redirecionamento para lista de gateways

### Nos Logs (DevTools):
- ✅ Sem erros vermelhos
- ✅ Status 200 em todas as chamadas
- ✅ Mensagem: "Credenciais Pague-X verificadas com sucesso"

---

## ❌ SE AINDA DER ERRO

### Erro: "duplicate key value violates unique constraint"
**Solução**: O GatewayConfig já existe. Execute:

```sql
SELECT id FROM "GatewayConfig"
WHERE "userId" = 'SEU_USER_ID'::uuid
  AND "gatewayId" = (SELECT id FROM "Gateway" WHERE slug = 'paguex');
```

Se retornar um ID, use esse ID para atualizar ao invés de criar:

```sql
UPDATE "GatewayConfig"
SET
  credentials = '{}'::jsonb,
  environment = 'production',
  "isActive" = false,
  "isVerified" = false,
  "updatedAt" = NOW()
WHERE id = 'ID_RETORNADO_ACIMA'::uuid;
```

### Erro: "permission denied for table GatewayConfig"
**Solução**: Problema de RLS. Execute as políticas da seção "Diagnóstico Completo" acima.

### Erro: "null value in column gatewayId violates not-null constraint"
**Solução**: Gateway Pague-X não existe. Execute `EXECUTAR_ESTE_SQL_AGORA.sql` primeiro.

---

## 🚀 TESTE FINAL

Após resolver o erro de salvamento:

1. ✅ Salvar configuração com sucesso
2. ✅ Ver badge "Verificado" verde
3. ✅ Marcar como gateway padrão
4. ✅ Ir para página de Checkout
5. ✅ Criar pedido teste
6. ✅ Testar pagamento (PIX, Cartão, Boleto)

---

## 📞 SUPORTE ADICIONAL

Se nenhuma solução funcionar:

1. **Exportar logs completos**:
   - DevTools > Console > Botão direito > "Save as..."
   - Enviar para equipe de desenvolvimento

2. **Executar diagnóstico completo**:
```sql
-- 1. Gateway
SELECT * FROM "Gateway" WHERE slug = 'paguex';

-- 2. Seu usuário
SELECT id, email FROM "User" WHERE email = 'SEU_EMAIL_AQUI';

-- 3. Seus GatewayConfigs
SELECT
  gc.*,
  g.name as gateway_name
FROM "GatewayConfig" gc
LEFT JOIN "Gateway" g ON g.id = gc."gatewayId"
WHERE gc."userId" = 'SEU_USER_ID'::uuid;

-- 4. Políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'GatewayConfig';
```

3. **Enviar resultados** para análise

---

**Criado por**: Engenheiro SyncAds  
**Urgência**: 🔴 Alta  
**Status**: Solução documentada e testável  
**Tempo estimado**: 5-10 minutos