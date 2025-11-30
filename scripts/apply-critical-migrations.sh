#!/bin/bash

# ============================================================================
# SCRIPT: APLICAR MIGRATIONS CRÍTICAS
# ============================================================================
# Aplica todas as migrations críticas identificadas na auditoria
# - Índices para performance
# - AI Cache + Soft Deletes
# - Audit Logs
# ============================================================================

set -e  # Exit on error

echo "🚀 Iniciando aplicação de migrations críticas..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"
MIGRATIONS_DIR="./supabase/migrations"

# Verificar variáveis de ambiente
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}❌ ERRO: Variáveis de ambiente não configuradas${NC}"
  echo ""
  echo "Configure as seguintes variáveis:"
  echo "  export SUPABASE_URL='https://seu-projeto.supabase.co'"
  echo "  export SUPABASE_SERVICE_KEY='sua-service-key'"
  echo ""
  exit 1
fi

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

apply_migration() {
  local migration_file=$1
  local migration_name=$(basename "$migration_file" .sql)

  echo -e "${BLUE}📦 Aplicando: ${migration_name}${NC}"

  # Ler conteúdo do arquivo
  local sql_content=$(cat "$migration_file")

  # Aplicar migration via API
  local response=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$sql_content" | jq -Rs .)}")

  # Verificar sucesso
  if echo "$response" | grep -q "error"; then
    echo -e "${RED}❌ Erro ao aplicar ${migration_name}${NC}"
    echo "$response" | jq '.'
    return 1
  else
    echo -e "${GREEN}✅ ${migration_name} aplicada com sucesso${NC}"
    return 0
  fi
}

apply_migration_psql() {
  local migration_file=$1
  local migration_name=$(basename "$migration_file" .sql)

  echo -e "${BLUE}📦 Aplicando via psql: ${migration_name}${NC}"

  # Extrair DATABASE_URL se disponível
  if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -f "$migration_file"

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ ${migration_name} aplicada com sucesso${NC}"
      return 0
    else
      echo -e "${RED}❌ Erro ao aplicar ${migration_name}${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️ DATABASE_URL não configurada, pulando psql${NC}"
    return 1
  fi
}

# ============================================================================
# VERIFICAR DEPENDÊNCIAS
# ============================================================================

echo -e "${BLUE}🔍 Verificando dependências...${NC}"

if ! command -v curl &> /dev/null; then
  echo -e "${RED}❌ curl não encontrado. Instale: apt-get install curl${NC}"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️ jq não encontrado. Tentando instalar...${NC}"
  # Tentar instalar jq
  if command -v apt-get &> /dev/null; then
    sudo apt-get install -y jq
  elif command -v brew &> /dev/null; then
    brew install jq
  else
    echo -e "${RED}❌ Não foi possível instalar jq automaticamente${NC}"
    echo "Instale manualmente: https://stedolan.github.io/jq/download/"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Dependências verificadas${NC}"
echo ""

# ============================================================================
# LISTAR MIGRATIONS
# ============================================================================

echo -e "${BLUE}📋 Migrations disponíveis:${NC}"
echo ""

migrations=(
  "20240124_critical_indexes.sql"
  "20240124_ai_cache_and_soft_deletes.sql"
)

for migration in "${migrations[@]}"; do
  migration_path="${MIGRATIONS_DIR}/${migration}"
  if [ -f "$migration_path" ]; then
    echo -e "  ${GREEN}✓${NC} ${migration}"
  else
    echo -e "  ${RED}✗${NC} ${migration} (não encontrada)"
  fi
done

echo ""

# ============================================================================
# CONFIRMAR APLICAÇÃO
# ============================================================================

echo -e "${YELLOW}⚠️  ATENÇÃO:${NC}"
echo "Isso irá aplicar migrations no banco de dados de PRODUÇÃO."
echo "As seguintes alterações serão feitas:"
echo ""
echo "  1. Criação de ~30 índices críticos para performance"
echo "  2. Tabela ai_cache para cache de respostas da IA"
echo "  3. Colunas deleted_at para soft deletes"
echo "  4. Tabela audit_logs para auditoria"
echo ""
read -p "Deseja continuar? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}❌ Operação cancelada${NC}"
  exit 0
fi

# ============================================================================
# APLICAR MIGRATIONS
# ============================================================================

echo ""
echo -e "${BLUE}🚀 Aplicando migrations...${NC}"
echo ""

success_count=0
fail_count=0

for migration in "${migrations[@]}"; do
  migration_path="${MIGRATIONS_DIR}/${migration}"

  if [ ! -f "$migration_path" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: ${migration}${NC}"
    ((fail_count++))
    continue
  fi

  # Tentar aplicar via psql primeiro (mais rápido)
  if apply_migration_psql "$migration_path"; then
    ((success_count++))
  else
    # Fallback para API REST
    if apply_migration "$migration_path"; then
      ((success_count++))
    else
      ((fail_count++))
    fi
  fi

  echo ""
done

# ============================================================================
# RESUMO
# ============================================================================

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}           RESUMO DA APLICAÇÃO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}✅ Sucesso:${NC} ${success_count} migration(s)"
echo -e "  ${RED}❌ Falhas:${NC}  ${fail_count} migration(s)"
echo ""

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}🎉 Todas as migrations foram aplicadas com sucesso!${NC}"
  echo ""
  echo "Próximos passos:"
  echo "  1. Verificar logs do Supabase"
  echo "  2. Testar queries críticas"
  echo "  3. Monitorar performance"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  Algumas migrations falharam${NC}"
  echo ""
  echo "Verifique os erros acima e tente novamente."
  echo ""
  exit 1
fi
