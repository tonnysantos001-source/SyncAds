# 🔄 MIGRATIONS TO APPLY MANUALLY

## ⚠️ IMPORTANTE

Devido a inconsistências entre migrations locais e remotas, alguns comandos devem ser aplicados manualmente via Dashboard do Supabase.

---

## 📋 MIGRATION: Performance Indexes

**Arquivo**: `supabase/migrations/20250126000000_add_performance_indexes.sql`

**Objetivo**: Otimizar performance do banco de dados com 30+ índices

**Status**: ⏳ PENDENTE DE APLICAÇÃO

---

## 🎯 COMO APLICAR

### Método 1: Via Supabase Dashboard (RECOMENDADO)

1. **Acesse o Dashboard**
   - URL: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
   - Login com suas credenciais

2. **Navegue até SQL Editor**
   - Menu lateral → SQL Editor
   - Clique em "New Query"

3. **Cole o SQL**
   - Abra o arquivo: `supabase/migrations/20250126000000_add_performance_indexes.sql`
   - Copie TODO o conteúdo
   - Cole no editor SQL

4. **Execute**
   - Clique em "Run" ou pressione `Ctrl+Enter`
   - Aguarde conclusão (pode levar 2-5 minutos)

5. **Verifique**
   - Deve mostrar mensagens de sucesso
   - Verifique ao final: "Performance indexes created successfully!"

---

### Método 2: Via psql (Requer PostgreSQL Client)

```bash
# Windows PowerShell
$env:PGPASSWORD="SUA_SENHA_AQUI"
psql -h aws-0-us-east-1.pooler.supabase.com `
  -p 6543 `
  -U postgres.ovskepqggmxlfckxqgbr `
  -d postgres `
  -f supabase\migrations\20250126000000_add_performance_indexes.sql

# Linux/Mac
export PGPASSWORD="SUA_SENHA_AQUI"
psql -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.ovskepqggmxlfckxqgbr \
  -d postgres \
  -f supabase/migrations/20250126000000_add_performance_indexes.sql
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após aplicar a migration, execute esta query no SQL Editor para validar:

```sql
-- Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Contar índices
SELECT COUNT(*) as total_indexes
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
  AND schemaname = 'public';
```

**Resultado esperado**: 30+ índices criados

---

## 📊 IMPACTO ESPERADO

Após aplicação dos índices:

- ✅ **Queries de login**: 50-70% mais rápidas
- ✅ **Listagem de pedidos**: 60-80% mais rápidas
- ✅ **Dashboard admin**: 40-60% mais rápidas
- ✅ **Webhooks de pagamento**: 70-90% mais rápidas
- ✅ **Polling da extensão**: 80-90% mais rápidas

---

## 🚨 ATENÇÃO

- ⚠️ **CONCURRENTLY**: Os índices usam `CREATE INDEX CONCURRENTLY` para NÃO bloquear o banco
- ⚠️ **Tempo**: Pode levar 2-5 minutos dependendo do volume de dados
- ⚠️ **Backup**: Recomendado criar backup antes (veja `BACKUPS/BACKUP_INSTRUCTIONS.md`)
- ⚠️ **Monitoramento**: Acompanhe a execução no Dashboard

---

## 🔄 ROLLBACK (Se Necessário)

Se algo der errado, execute:

```sql
-- Remover todos os índices criados
DO $$
DECLARE
  idx_name TEXT;
BEGIN
  FOR idx_name IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname LIKE 'idx_%' 
      AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS ' || idx_name;
    RAISE NOTICE 'Dropped index: %', idx_name;
  END LOOP;
END $$;
```

---

## 📝 HISTÓRICO

| Data | Ação | Status | Responsável |
|------|------|--------|-------------|
| 2025-01-26 | Migration criada | ✅ Completo | DevOps |
| 2025-01-XX | Aplicação em produção | ⏳ Pendente | - |

---

## 🔗 REFERÊNCIAS

- Documentação Supabase Indexes: https://supabase.com/docs/guides/database/indexes
- PostgreSQL CONCURRENTLY: https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY
- Migration original: `supabase/migrations/20250126000000_add_performance_indexes.sql`

---

**Última atualização**: 2025-01-26  
**Prioridade**: P1 (Alta Severidade)  
**Tempo estimado**: 5 minutos