# 🚀 Executar Migration SaaS

## Opção 1: Supabase Dashboard (Recomendado)

1. Acesse: https://ovskepqggmxlfckxqgbr.supabase.co
2. Login
3. Vá em: **SQL Editor** (menu lateral)
4. Clique: **New Query**
5. Cole o conteúdo de: `supabase_migrations/saas_architecture.sql`
6. Clique: **Run**
7. Aguarde conclusão

## Opção 2: CLI Supabase

```bash
npx supabase db push
```

## ✅ Verificar se funcionou

Após executar, verifique no **Table Editor**:
- ✅ Tabela `Organization` existe
- ✅ Tabela `GlobalAiConnection` existe
- ✅ Tabela `OrganizationAiConnection` existe
- ✅ Tabela `User` tem coluna `organizationId`

## 📊 O que a migration faz

1. Cria todas as tabelas SaaS
2. Pega seu usuário atual e cria uma organização para ele
3. Migra suas campanhas, conversas e integrações
4. Configura RLS (segurança)
5. Cria índices para performance

**Seus dados NÃO serão perdidos!**
