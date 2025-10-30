# 🚀 GUIA DE EXECUÇÃO DA MIGRATION

**Data:** 30 de Outubro de 2025  
**Migration:** Remoção Completa de Organizações

---

## ⚠️ IMPORTANTE ANTES DE COMEÇAR

### 1. BACKUP MANUAL (OBRIGATÓRIO!)

**No Supabase Dashboard:**
1. Ir em: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
2. Clicar em **Settings** (⚙️) no menu esquerdo
3. Clicar em **Database**
4. Rolar até **Backups**
5. Clicar em **Create Backup** ou **Download latest backup**
6. ✅ Confirmar que o backup foi criado!

**⚠️ NÃO PROSSIGA SEM BACKUP!**

---

## 📋 PASSO A PASSO

### PASSO 1: Abrir SQL Editor

1. No Dashboard do Supabase: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
2. Clicar em **SQL Editor** (📝) no menu esquerdo
3. Clicar em **New Query**

### PASSO 2: Copiar Migration SQL

1. Abrir o arquivo: `supabase/migrations/20251030100000_remove_organization_complete.sql`
2. **Selecionar TUDO** (Ctrl+A)
3. **Copiar** (Ctrl+C)

### PASSO 3: Colar e Executar

1. No SQL Editor do Supabase, **colar** o código (Ctrl+V)
2. Revisar rapidamente (deve ter ~600 linhas)
3. Clicar em **RUN** (▶️) no canto inferior direito
4. ⏳ **Aguardar** (pode levar 1-2 minutos)

### PASSO 4: Verificar Resultado

✅ **SE DER SUCESSO:**
```
Success. No rows returned

// Ou mensagens de NOTICE sobre policies/índices
// Isso é NORMAL
```

Você verá várias mensagens NOTICE, isso é normal!

O importante é **NÃO ter mensagens de ERROR**.

❌ **SE DER ERRO:**
- Copie a mensagem de erro completa
- Me mostre o erro
- Não execute mais nada
- Use o backup se necessário

---

## ✅ APÓS EXECUÇÃO BEM-SUCEDIDA

### Próximos passos automáticos:

1. ✅ Regenerar Types do TypeScript
2. ✅ Verificar se tudo funciona
3. ✅ Testar checkout
4. ✅ Voltar ao desenvolvimento!

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Erro: "relation already exists"
- ✅ IGNORAR - Significa que a tabela já existe
- Continue verificando próximos erros

### Erro: "column does not exist"
- ⚠️ PARAR - Pode indicar problema
- Me mostre o erro completo

### Erro: "permission denied"
- ⚠️ VERIFICAR - Pode ser problema de permissões
- Confirme que está logado como admin

### Erro de timeout
- ⏳ AGUARDAR - Banco pode estar processando
- Recarregue a página e verifique se funcionou

---

## 📊 COMO VERIFICAR SE FUNCIONOU

Após executar, rode esta query no SQL Editor:

```sql
-- Verificar se organizationId foi removido
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name = 'organizationId';
```

**Resultado esperado:** **Nenhuma linha** (vazio)

Se retornar vazio = ✅ Sucesso!  
Se retornar uma linha = ❌ Não funcionou

---

## 🎯 CHECKLIST

Antes de executar:
- [ ] ✅ Backup criado e confirmado
- [ ] ✅ SQL Editor aberto
- [ ] ✅ Migration SQL copiada

Durante execução:
- [ ] ✅ SQL colado no editor
- [ ] ✅ Revisado (parece correto)
- [ ] ✅ Click em RUN

Após execução:
- [ ] ✅ Sem erros (apenas NOTICE é ok)
- [ ] ✅ Verificação com query passou
- [ ] ✅ Pronto para próximos passos!

---

## 💡 DICA

A migration tem BEGIN/COMMIT, então:
- ✅ Se der erro, faz ROLLBACK automático
- ✅ Nada é alterado até o COMMIT final
- ✅ É uma operação "tudo ou nada"

**Isso torna a execução mais segura!**

---

## 🚨 EM CASO DE ERRO GRAVE

1. ❌ **NÃO EXECUTE MAIS NADA**
2. 📸 Tire screenshot do erro
3. 💬 Me mostre o erro
4. 🔄 Podemos usar o backup para reverter
5. 🔍 Investigaremos o problema

---

## ✅ QUANDO ESTIVER PRONTO

1. Execute a migration
2. Me confirme se foi sucesso
3. Vou regenerar os types automaticamente
4. Vamos testar o sistema!

**BOA SORTE! 🚀**


