# 🔧 GUIA PASSO A PASSO - CORREÇÕES NO BANCO DE DADOS

## ⚡ PASSO 2 DA AUDITORIA: Banco de Dados

**Tempo estimado:** 5 minutos  
**Dificuldade:** Fácil (apenas copiar e colar)

---

## 📋 O QUE VAMOS FAZER

Vamos aplicar **correções críticas** no banco de dados que vão:

1. ✅ Adicionar campos faltantes (`systemPrompt`, `isActive`)
2. ✅ Criar função `is_service_role()` (usada em RLS)
3. ✅ Adicionar índices → **Performance 10-100x melhor!**

**⚠️ IMPORTANTE:** Estas correções **NÃO vão quebrar nada** que já funciona!

---

## 🚀 INSTRUÇÕES

### 1. Acesse o Supabase SQL Editor

Abra seu navegador e acesse:
```
https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/editor
```

### 2. Abra uma Nova Query

- No menu lateral, clique em **"SQL Editor"**
- Clique no botão **"+ New query"** (ou "+ Nova consulta")

### 3. Cole o SQL

- Abra o arquivo: **`EXECUTAR_NO_SUPABASE_SQL_EDITOR.sql`**
- Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
- Cole no SQL Editor do Supabase (Ctrl+V)

### 4. Execute

- Clique no botão **"Run"** (▶️) no canto superior direito
- Ou pressione **Ctrl+Enter**

### 5. Aguarde e Verifique

- O SQL vai executar por ~10-15 segundos
- No final, você verá uma **tabela de verificação** com ✅ OK em todos os campos
- Se aparecer ❌ FALTA em algum, copie e execute novamente

---

## ✅ RESULTADO ESPERADO

Você verá algo assim:

```
campo                           | status
--------------------------------|--------
GlobalAiConnection.systemPrompt | ✅ OK
Product.isActive                | ✅ OK
Função is_service_role()        | ✅ OK
Índice idx_campaign_user        | ✅ OK
Índice idx_cartitem_variant     | ✅ OK
Índice idx_lead_customer        | ✅ OK
Índice idx_order_cart           | ✅ OK
Índice idx_orderitem_variant    | ✅ OK
Índice idx_transaction_order    | ✅ OK
```

---

## 📊 IMPACTO DAS CORREÇÕES

### Antes:
- ❌ IA pode falhar (campo `systemPrompt` não existe)
- ❌ Queries 10-100x mais lentas (sem índices)
- ❌ RLS policies podem falhar (função `is_service_role()` não existe)

### Depois:
- ✅ IA funciona perfeitamente
- ✅ Queries 10-100x mais rápidas
- ✅ RLS policies funcionam corretamente

---

## 🆘 PROBLEMAS?

### Erro: "permission denied"
- Certifique-se de estar logado como **Owner** do projeto
- Vá em Settings > Database > Connection pooling e use a **Direct Connection**

### Erro: "relation does not exist"
- Verifique se você está conectado ao banco correto
- O projeto deve ser: `ovskepqggmxlfckxqgbr`

### Outros erros
- Copie a mensagem de erro completa
- Me envie para eu te ajudar

---

## 📞 PRÓXIMO PASSO

Após executar com sucesso:
1. ✅ Marque este passo como concluído
2. ➡️ Vamos para o **PASSO 3**: Corrigir Gateways

---

**Está pronto para executar?** Me avise quando terminar! 🚀

