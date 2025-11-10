# 🔄 BACKUP AUTOMÁTICO - SYNCADS

Guia completo para configurar backup automático do banco de dados Supabase.

---

## 📋 ÍNDICE

1. [Estratégia de Backup](#estratégia-de-backup)
2. [Configuração no Supabase](#configuração-no-supabase)
3. [Backup via CLI (Local/CI)](#backup-via-cli)
4. [Backup Remoto (S3/Cloud)](#backup-remoto)
5. [Restauração](#restauração)
6. [Monitoramento](#monitoramento)
7. [Checklist de Segurança](#checklist)

---

## 🎯 ESTRATÉGIA DE BACKUP

### Política de Retenção

| Tipo | Frequência | Retenção | Armazenamento |
|------|-----------|----------|---------------|
| **Diário** | 1x/dia (3h da manhã) | 7 dias | Local + S3 |
| **Semanal** | Domingo 3h | 4 semanas | S3 |
| **Mensal** | 1º dia do mês | 12 meses | S3 Glacier |
| **Antes Deploy** | Manual/CI | 30 dias | S3 |

### O que fazer Backup

✅ **Incluir:**
- Todos os schemas (public, auth, storage)
- Dados completos de todas as tabelas
- Sequences e serials
- Functions e triggers
- Policies de RLS

❌ **Excluir:**
- Logs temporários (> 90 dias)
- Cache (tabelas temp_*)
- Dados de teste (test_*)

---

## 🔧 CONFIGURAÇÃO NO SUPABASE

### 1. Backup Nativo do Supabase (Point-in-Time Recovery)

O Supabase oferece backups automáticos no plano Pro e acima:

**Características:**
- Backup contínuo (PITR)
- Retenção: 7 dias (Pro), 30 dias (Enterprise)
- Restauração point-in-time até o segundo

**Como ativar:**

1. Acesse: https://app.supabase.com/project/ovskepqggmxlfckxqgbr/settings/addons
2. Habilite "Point in Time Recovery"
3. Custo: ~$100/mês (Pro)

**Restore via Dashboard:**
```bash
# 1. Vá em Settings > Database > Backups
# 2. Escolha data/hora
# 3. Clique em "Restore"
# 4. Aguarde ~5-15 minutos
```

### 2. Configurar Backup Manual via Supabase CLI

**Instalação:**
```bash
npm install -g supabase
```

**Login:**
```bash
supabase login
supabase link --project-ref ovskepqggmxlfckxqgbr
```

---

## 💾 BACKUP VIA CLI

### Script de Backup Diário

Crie o arquivo `scripts/backup-database.sh`:

```bash
#!/bin/bash

# ============================================
# BACKUP AUTOMÁTICO SYNCADS
# ============================================

set -e

# Configurações
PROJECT_REF="ovskepqggmxlfckxqgbr"
BACKUP_DIR="/var/backups/syncads"
RETENTION_DAYS=7
S3_BUCKET="s3://syncads-backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="syncads-backup-${DATE}.sql.gz"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verificar dependências
command -v supabase >/dev/null 2>&1 || error "Supabase CLI não instalado"
command -v pg_dump >/dev/null 2>&1 || error "pg_dump não instalado"
command -v aws >/dev/null 2>&1 || error "AWS CLI não instalado"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

log "🔄 Iniciando backup..."

# Obter connection string
DB_URL=$(supabase db remote show --project-ref "$PROJECT_REF" | grep "Connection string" | cut -d: -f2-)

if [ -z "$DB_URL" ]; then
    error "Não foi possível obter connection string"
fi

# Fazer backup
log "📦 Criando dump do banco..."
pg_dump "$DB_URL" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --verbose \
    --format=plain \
    | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verificar tamanho
SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
log "✅ Backup criado: $BACKUP_FILE ($SIZE)"

# Upload para S3
log "☁️  Enviando para S3..."
aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "$S3_BUCKET/daily/" \
    --storage-class STANDARD \
    --metadata "date=$DATE,project=syncads"

log "✅ Upload concluído"

# Limpar backups antigos (local)
log "🧹 Limpando backups antigos (>${RETENTION_DAYS} dias)..."
find "$BACKUP_DIR" -name "syncads-backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Limpar S3 (backups diários > 7 dias)
aws s3 ls "$S3_BUCKET/daily/" | while read -r line; do
    file_date=$(echo "$line" | awk '{print $1}')
    file_name=$(echo "$line" | awk '{print $4}')
    
    if [ -n "$file_name" ]; then
        days_old=$(( ($(date +%s) - $(date -d "$file_date" +%s)) / 86400 ))
        
        if [ $days_old -gt $RETENTION_DAYS ]; then
            log "🗑️  Removendo: $file_name ($days_old dias)"
            aws s3 rm "$S3_BUCKET/daily/$file_name"
        fi
    fi
done

log "✅ Backup concluído com sucesso!"

# Notificar (opcional)
# curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
#     -H 'Content-Type: application/json' \
#     -d "{\"text\":\"✅ Backup SyncAds concluído: $SIZE\"}"
```

### Tornar Executável

```bash
chmod +x scripts/backup-database.sh
```

### Agendar com Cron

```bash
# Editar crontab
crontab -e

# Adicionar linha (todo dia às 3h da manhã)
0 3 * * * /path/to/syncads/scripts/backup-database.sh >> /var/log/syncads-backup.log 2>&1

# Backup semanal (domingo 3h) - cópia para pasta weekly
0 3 * * 0 /path/to/syncads/scripts/backup-database.sh && aws s3 cp /var/backups/syncads/$(ls -t /var/backups/syncads | head -1) s3://syncads-backups/weekly/
```

---

## ☁️ BACKUP REMOTO (S3/CLOUD)

### Configurar AWS S3

**1. Criar Bucket:**
```bash
aws s3 mb s3://syncads-backups --region us-east-1

# Configurar versionamento
aws s3api put-bucket-versioning \
    --bucket syncads-backups \
    --versioning-configuration Status=Enabled

# Configurar lifecycle (mover para Glacier após 30 dias)
cat > lifecycle.json <<EOF
{
  "Rules": [
    {
      "Id": "MoveToGlacier",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket syncads-backups \
    --lifecycle-configuration file://lifecycle.json
```

**2. Criar IAM User para Backups:**
```bash
# Criar usuário
aws iam create-user --user-name syncads-backup-user

# Criar policy
cat > backup-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::syncads-backups",
        "arn:aws:s3:::syncads-backups/*"
      ]
    }
  ]
}
EOF

# Anexar policy
aws iam put-user-policy \
    --user-name syncads-backup-user \
    --policy-name SyncAdsBackupPolicy \
    --policy-document file://backup-policy.json

# Criar access keys
aws iam create-access-key --user-name syncads-backup-user
```

**3. Configurar Credentials:**
```bash
# ~/.aws/credentials
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
region = us-east-1
```

### Backup para Google Cloud Storage (Alternativa)

```bash
# Instalar gsutil
curl https://sdk.cloud.google.com | bash

# Configurar
gcloud init

# Backup
pg_dump "$DB_URL" | gzip | gsutil cp - gs://syncads-backups/daily/backup-$(date +%Y%m%d).