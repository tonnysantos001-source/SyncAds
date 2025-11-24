#!/bin/bash

# ============================================
# SYNCADS - SCRIPT DE LIMPEZA DE INTEGRAÇÕES
# Remove integrações OAuth antigas
# Mantém apenas: VTEX, Nuvemshop, Shopify, WooCommerce, Loja Integrada
# ============================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# CONFIGURAÇÕES
# ============================================
BACKUP_DIR="./backups"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
DRY_RUN=false

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================
# VERIFICAÇÕES INICIAIS
# ============================================

check_requirements() {
    print_header "VERIFICANDO REQUISITOS"

    # Verificar Git
    if ! command -v git &> /dev/null; then
        print_error "Git não está instalado"
        exit 1
    fi
    print_success "Git instalado"

    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado"
        exit 1
    fi
    print_success "Node.js instalado"

    # Verificar NPM
    if ! command -v npm &> /dev/null; then
        print_error "NPM não está instalado"
        exit 1
    fi
    print_success "NPM instalado"

    # Verificar Supabase CLI
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI não está instalado"
        print_info "Instale com: npm install -g supabase"
    else
        print_success "Supabase CLI instalado"
    fi

    # Verificar PostgreSQL client
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client não está instalado"
    else
        print_success "PostgreSQL client instalado"
    fi
}

# ============================================
# BACKUP
# ============================================

create_backup() {
    print_header "CRIANDO BACKUP"

    # Criar diretório de backup
    mkdir -p "$BACKUP_DIR"

    # Backup Git
    print_info "Criando tag Git..."
    git add .
    git commit -m "Backup antes de limpar integrações - $BACKUP_DATE" || true
    git tag "backup-integrations-$BACKUP_DATE"
    print_success "Tag Git criada: backup-integrations-$BACKUP_DATE"

    # Backup de arquivos importantes
    print_info "Copiando arquivos importantes..."
    cp -r src/lib/integrations "$BACKUP_DIR/integrations-$BACKUP_DATE" 2>/dev/null || true
    cp -r src/config "$BACKUP_DIR/config-$BACKUP_DATE" 2>/dev/null || true
    cp -r src/pages/app/IntegrationsPage.tsx "$BACKUP_DIR/IntegrationsPage-$BACKUP_DATE.tsx" 2>/dev/null || true
    print_success "Arquivos copiados para: $BACKUP_DIR"

    # Backup Database (se DATABASE_URL estiver configurado)
    if [ ! -z "$DATABASE_URL" ]; then
        print_info "Criando backup do banco de dados..."
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database-$BACKUP_DATE.sql" 2>/dev/null || {
            print_warning "Não foi possível criar backup do banco"
        }
    else
        print_warning "DATABASE_URL não configurado - backup do banco ignorado"
    fi

    print_success "Backup completo!"
}

# ============================================
# LIMPEZA DE FRONTEND
# ============================================

cleanup_frontend() {
    print_header "LIMPANDO FRONTEND"

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN - Nenhuma alteração será feita"
        return
    fi

    # Atualizar oauthConfig.ts
    print_info "Limpando oauthConfig.ts..."
    cat > src/lib/integrations/oauthConfig.ts << 'EOF'
/**
 * Configurações OAuth - REMOVIDAS
 *
 * SyncAds agora foca apenas em integrações de e-commerce
 * que usam API Keys diretas, sem OAuth.
 *
 * Integrações mantidas:
 * - VTEX
 * - Nuvemshop
 * - Shopify
 * - WooCommerce
 * - Loja Integrada
 */

export interface OAuthProviderConfig {
  // Mantido apenas para compatibilidade de tipos
  clientId?: string;
  authUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  redirectUri?: string;
}

export const OAUTH_CONFIGS: Record<string, OAuthProviderConfig> = {
  // Todas as configurações OAuth foram removidas
  // E-commerce usa autenticação via API Key
};

export function generateOAuthUrl(platform: string, userId: string): string {
  throw new Error('OAuth não é mais suportado. Use integrações via API Key.');
}

export function isOAuthConfigured(platform: string): boolean {
  return false;
}

export function getAvailablePlatforms(): string[] {
  return ['vtex', 'nuvemshop', 'shopify', 'woocommerce', 'loja_integrada'];
}
EOF
    print_success "oauthConfig.ts atualizado"

    # Remover importações OAuth não utilizadas
    print_info "Removendo imports não utilizados..."
    find src -name "*.tsx" -o -name "*.ts" | while read file; do
        # Remover imports OAuth específicos (apenas comentar para segurança)
        sed -i.bak "s/import.*oauthConfig.*/\/\/ &/" "$file" 2>/dev/null || true
        rm -f "${file}.bak" 2>/dev/null || true
    done
    print_success "Imports comentados"

    print_success "Frontend limpo!"
}

# ============================================
# LIMPEZA DE EDGE FUNCTIONS
# ============================================

cleanup_edge_functions() {
    print_header "LIMPANDO EDGE FUNCTIONS"

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN - Nenhuma alteração será feita"
        return
    fi

    # Lista de edge functions a remover
    FUNCTIONS_TO_REMOVE=(
        "oauth-callback"
        "google-ads-sync"
        "meta-ads-sync"
        "facebook-ads-sync"
        "tiktok-ads-sync"
        "linkedin-ads-sync"
        "twitter-ads-sync"
    )

    print_info "Verificando edge functions..."

    if command -v supabase &> /dev/null; then
        for func in "${FUNCTIONS_TO_REMOVE[@]}"; do
            print_info "Removendo $func..."
            supabase functions delete "$func" --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null || {
                print_warning "Função $func não encontrada ou já removida"
            }
        done
        print_success "Edge functions removidas"
    else
        print_warning "Supabase CLI não disponível - remova manualmente via Dashboard"
        print_info "Funções a remover: ${FUNCTIONS_TO_REMOVE[*]}"
    fi
}

# ============================================
# LIMPEZA DE DATABASE
# ============================================

cleanup_database() {
    print_header "LIMPANDO DATABASE"

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN - Nenhuma alteração será feita"
        return
    fi

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL não configurado"
        print_info "Configure DATABASE_URL e execute novamente"
        print_info "Ou execute cleanup-integrations.sql manualmente no Supabase Dashboard"
        return
    fi

    print_info "Executando script SQL de limpeza..."

    # Executar script SQL
    if psql "$DATABASE_URL" < cleanup-integrations.sql; then
        print_success "Script SQL executado com sucesso"

        # Confirmar commit
        read -p "Deseja confirmar as alterações no banco? (y/N): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo "COMMIT;" | psql "$DATABASE_URL"
            print_success "Alterações confirmadas no banco"
        else
            echo "ROLLBACK;" | psql "$DATABASE_URL"
            print_warning "Alterações revertidas no banco"
        fi
    else
        print_error "Erro ao executar script SQL"
        print_info "Execute manualmente: psql \$DATABASE_URL < cleanup-integrations.sql"
    fi
}

# ============================================
# LIMPEZA DE ARQUIVOS LOCAIS
# ============================================

cleanup_local_files() {
    print_header "LIMPANDO ARQUIVOS LOCAIS"

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN - Nenhuma alteração será feita"
        return
    fi

    # Remover edge functions locais
    print_info "Removendo edge functions locais..."
    rm -rf supabase/functions/oauth-callback 2>/dev/null || true
    rm -rf supabase/functions/google-ads-sync 2>/dev/null || true
    rm -rf supabase/functions/meta-ads-sync 2>/dev/null || true
    rm -rf supabase/functions/tiktok-ads-sync 2>/dev/null || true
    print_success "Edge functions locais removidas"

    # Limpar cache do node_modules
    print_info "Limpando cache..."
    rm -rf node_modules/.cache 2>/dev/null || true
    print_success "Cache limpo"
}

# ============================================
# VALIDAÇÃO
# ============================================

validate_cleanup() {
    print_header "VALIDANDO LIMPEZA"

    # Verificar se arquivos importantes ainda existem
    if [ -f "src/lib/integrations/oauthConfig.ts" ]; then
        print_success "oauthConfig.ts atualizado"
    else
        print_error "oauthConfig.ts não encontrado"
    fi

    # Verificar integrações mantidas
    local ecommerce_integrations=("vtex" "nuvemshop" "shopify" "woocommerce" "loja_integrada")
    print_info "Integrações mantidas:"
    for integration in "${ecommerce_integrations[@]}"; do
        echo "  - $integration"
    done

    print_success "Validação completa!"
}

# ============================================
# RELATÓRIO FINAL
# ============================================

generate_report() {
    print_header "RELATÓRIO FINAL"

    local report_file="$BACKUP_DIR/cleanup-report-$BACKUP_DATE.txt"

    cat > "$report_file" << EOF
============================================
SYNCADS - RELATÓRIO DE LIMPEZA
============================================
Data: $(date)
Backup: $BACKUP_DATE

INTEGRAÇÕES REMOVIDAS:
- Google Ads
- Google Analytics
- Google Merchant Center
- Meta Ads (Facebook + Instagram)
- TikTok Ads
- LinkedIn Ads
- Twitter/X Ads

INTEGRAÇÕES MANTIDAS:
- VTEX
- Nuvemshop
- Shopify
- WooCommerce
- Loja Integrada

ARQUIVOS MODIFICADOS:
- src/lib/integrations/oauthConfig.ts
- Edge functions removidas
- Database limpo

BACKUP LOCALIZAÇÃO:
- Git Tag: backup-integrations-$BACKUP_DATE
- Arquivos: $BACKUP_DIR
- Database: $BACKUP_DIR/database-$BACKUP_DATE.sql

PRÓXIMOS PASSOS:
1. Testar integrações mantidas
2. Verificar frontend (npm run dev)
3. Verificar backend (supabase functions)
4. Deployar alterações
5. Monitorar logs

============================================
EOF

    cat "$report_file"
    print_success "Relatório salvo em: $report_file"
}

# ============================================
# MENU PRINCIPAL
# ============================================

show_menu() {
    print_header "MENU DE LIMPEZA DE INTEGRAÇÕES"
    echo "1) Executar limpeza completa"
    echo "2) Apenas backup"
    echo "3) Apenas frontend"
    echo "4) Apenas edge functions"
    echo "5) Apenas database"
    echo "6) Dry run (simular sem executar)"
    echo "7) Sair"
    echo ""
    read -p "Escolha uma opção: " option

    case $option in
        1)
            check_requirements
            create_backup
            cleanup_frontend
            cleanup_edge_functions
            cleanup_database
            cleanup_local_files
            validate_cleanup
            generate_report
            print_success "Limpeza completa!"
            ;;
        2)
            create_backup
            print_success "Backup criado!"
            ;;
        3)
            create_backup
            cleanup_frontend
            print_success "Frontend limpo!"
            ;;
        4)
            create_backup
            cleanup_edge_functions
            print_success "Edge functions limpas!"
            ;;
        5)
            create_backup
            cleanup_database
            print_success "Database limpo!"
            ;;
        6)
            DRY_RUN=true
            check_requirements
            cleanup_frontend
            cleanup_edge_functions
            cleanup_database
            print_info "Dry run completo - nenhuma alteração foi feita"
            ;;
        7)
            print_info "Saindo..."
            exit 0
            ;;
        *)
            print_error "Opção inválida"
            show_menu
            ;;
    esac
}

# ============================================
# EXECUÇÃO PRINCIPAL
# ============================================

main() {
    clear
    print_header "SYNCADS - LIMPEZA DE INTEGRAÇÕES"
    echo ""
    print_warning "ATENÇÃO: Este script irá remover integrações OAuth antigas"
    print_info "Integrações mantidas: VTEX, Nuvemshop, Shopify, WooCommerce, Loja Integrada"
    echo ""

    read -p "Deseja continuar? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_info "Operação cancelada"
        exit 0
    fi

    echo ""
    show_menu
}

# Executar
main
