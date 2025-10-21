# Migrations Pendentes - Correções Críticas

## 📋 Ordem de Execução

Execute as migrations nesta ordem via Supabase MCP:

1. **01_fix_critical_security.sql** (5min)
   - Fix functions search_path
   - Create foreign key indexes

2. **02_fix_rls_performance.sql** (10min)
   - Otimiza todas RLS policies com (select auth.uid())
   - Consolida RefreshToken policies

3. **03_consolidate_duplicate_policies.sql** (5min)
   - Remove policies duplicadas
   - Melhora performance SELECT

## ⚠️ IMPORTANTE

Após aplicar as migrations:
1. Testar login de usuário normal
2. Testar login super admin
3. Verificar performance queries (EXPLAIN ANALYZE)
4. Rodar advisors novamente para confirmar correções

## 🔧 Configurações Manuais Pendentes

**Supabase Dashboard > Authentication:**
1. Enable "Leaked password protection" (HaveIBeenPwned)
2. Enable MFA (TOTP, Phone)

## 📊 Verificação Pós-Migration

```sql
-- Verificar functions search_path
SELECT 
    proname, 
    proconfig 
FROM pg_proc 
WHERE proname IN ('is_super_admin', 'encrypt_api_key', 'decrypt_api_key', 'expire_old_invites');

-- Verificar índices criados
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('Campaign', 'CartItem', 'Lead', 'Order', 'OrderItem', 'PendingInvite');

-- Verificar policies duplicadas removidas
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1;
```
