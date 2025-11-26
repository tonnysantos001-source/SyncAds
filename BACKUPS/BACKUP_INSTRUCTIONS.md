# 📦 BACKUP INSTRUCTIONS - Supabase Database

## ⚠️ IMPORTANTE: Execute Backup ANTES de Mudanças Críticas

---

## 🎯 Método 1: Via Supabase Dashboard (RECOMENDADO)

### Passo a Passo:

1. **Acesse o Dashboard Supabase**
   - URL: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
   - Login com suas credenciais

2. **Navegue até Database > Backups**
   - Menu lateral esquerdo → Database
   - Aba "Backups"

3. **Criar Backup Manual**
   - Clique em "Create backup"
   - Adicione descrição: `Manual backup before audit corrections - $(date)`
   - Clique em "Create"

4. **Aguarde Conclusão**
   - Tempo estimado: 2-5 minutos
   - Status: "Completed" quando pronto

5. **Verificar Backup**
   - Lista de backups deve mostrar o novo backup
   - Anote o timestamp para referência

---

## 🔄 Método 2: Habilitar PITR (Point-In-Time Recovery)

### Configuração:

1. **Acesse Settings > Database**
   - Menu lateral → Settings → Database

2. **Habilitar PITR**
   - Seção "Point in Time Recovery"
   - Toggle para "Enabled"
   - Escolha período de retenção: **7 dias** (mínimo recomendado)

3. **Confirmar**
   - Clique em "Enable PITR"
   - Aguarde confirmação

### ✅ Benefícios PITR:
- Backup contínuo automático
- Restauração para qualquer ponto no tempo nos últimos 7 dias
- Proteção contra erros humanos
- Zero downtime para backups

---

## 🚨 Método 3: Via pg_dump (Requer PostgreSQL Client)

### Requisitos:
- PostgreSQL client instalado
- String de conexão do banco

### Comando:

```bash
# Windows (PowerShell)
$env:PGPASSWORD="SUA_SENHA_AQUI"
pg_dump -h aws-0-us-east-1.pooler.supabase.com `
  -p 6543 `
  -U postgres.ovskepqggmxlfckxqgbr `
  -d postgres `
  --data-only `
  --no-owner `
  --no-privileges `
  -f "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# Linux/Mac
export PGPASSWORD="SUA_SENHA_AQUI"
pg_dump -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.ovskepqggmxlfckxqgbr \
  -d postgres \
  --data-only \
  --no-owner \
  --no-privileges \
  -f "backup_$(date +%Y%m%d_%H%M%S).sql"
```

### Comprimir Backup:

```bash
# Windows
Compress-Archive -Path backup_*.sql -DestinationPath backup_$(Get-Date -Format 'yyyyMMdd').zip

# Linux/Mac
gzip backup_*.sql
```

---

## 📊 Verificar Backup

### Teste de Integridade:

```sql
-- Conectar ao banco e verificar contagem de registros
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = schemaname AND table_name = tablename) as exists
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

---

## 🔄 Como Restaurar (Em Caso de Emergência)

### Via Dashboard:

1. Database > Backups
2. Selecione o backup desejado
3. Clique em "Restore"
4. Confirme a operação
5. **⚠️ ATENÇÃO: Isso substituirá TODOS os dados atuais!**

### Via PITR:

1. Database > Backups > Point in Time Recovery
2. Selecione data e hora específica
3. Clique em "Restore to this point"
4. Aguarde conclusão (5-15 minutos)

---

## 📁 Localização dos Backups

### Backups Manuais Locais:
- Pasta: `C:\Users\dinho\Documents\GitHub\SyncAds\BACKUPS\`
- Nomenclatura: `backup_YYYYMMDD_HHMMSS.sql`

### Backups no Supabase:
- Retidos por **7 dias** (plano free)
- Retidos por **30 dias** (plano pro)
- PITR: **7 dias** de histórico contínuo

---

## ✅ Checklist Pré-Mudanças Críticas

Antes de aplicar correções em produção:

- [ ] Backup manual criado via Dashboard
- [ ] PITR habilitado (se ainda não estiver)
- [ ] Backup verificado (aparece na lista)
- [ ] Timestamp anotado para referência
- [ ] Time estimado de rollback: ~10 minutos
- [ ] Acesso ao Dashboard confirmado

---

## 🎯 Status Atual

**Data da Última Verificação**: $(date)

**Backups Configurados**:
- [ ] Backup manual criado (pré-audit)
- [ ] PITR habilitado
- [ ] Backup local salvo

**Ações Necessárias**:
1. Criar backup manual AGORA via Dashboard
2. Habilitar PITR se ainda não estiver
3. Verificar que backup foi completado com sucesso

---

## 📞 Em Caso de Problemas

**Rollback Rápido**:
```bash
# Via Supabase CLI (se Docker disponível)
supabase db reset --linked

# Ou via Dashboard:
# Database > Backups > [Select Backup] > Restore
```

**Suporte**:
- Supabase Support: https://supabase.com/support
- Discord: https://discord.supabase.com
- Docs: https://supabase.com/docs/guides/database/backups

---

## 🔐 Segurança

**⚠️ NUNCA commite backups com dados reais no Git!**

Adicione ao `.gitignore`:
```
BACKUPS/*.sql
BACKUPS/*.sql.gz
BACKUPS/*.zip
```

---

## 📝 Histórico de Backups

| Data | Tipo | Descrição | Status |
|------|------|-----------|--------|
| 2025-01-XX | Manual | Pre-audit corrections | ✅ Pending |
| - | PITR | Automated | 🔄 To Configure |

---

**Última Atualização**: 2025-01-XX
**Responsável**: DevOps Team
**Projeto**: SyncAds - Audit Corrections