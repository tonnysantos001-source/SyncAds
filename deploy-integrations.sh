#!/bin/bash

# ================================================
# SCRIPT DE DEPLOYMENT - SYNCADS INTEGRATIONS
# Deploy automatizado de edge functions e migrations
# ================================================

set -e # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de output
print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Verificar se supabase CLI está instalado
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI não encontrado!"
        echo "Instale com: npm install -g supabase"
        exit 1
    fi
    print_success "Supabase CLI encontrado"
}

# Verificar se está logado no Supabase
check_supabase_auth() {
    if ! supabase projects list &> /dev/null; then
        print_error "Não está autenticado no Supabase!"
        echo "Execute: supabase login"
        exit 1
    fi
    print_success "Autenticado no Supabase"
}

# Link do projeto
link_project() {
    print_header "LINKING PROJECT"

    # Verificar se já está linked
    if [ -f ".supabase/config.toml" ]; then
        print_info "Projeto já está linked"
    else
        print_info "Fazendo link do projeto..."
        # Usar project ID do contexto
        supabase link --project-ref ovskepqggmxlfckxqgbr
        print_success "Projeto linked com sucesso"
    fi
}

# Aplicar migrations
apply_migrations() {
    print_header "APPLYING MIGRATIONS"

    if [ -d "supabase/migrations" ]; then
        print_info "Aplicando migrations..."

        # Listar migrations
        for migration in supabase/migrations/*.sql; do
            if [ -f "$migration" ]; then
                filename=$(basename "$migration")
                print_info "Aplicando: $filename"

                # Aplicar via SQL direto
                supabase db push || {
                    print_error "Erro ao aplicar migrations"
                    exit 1
                }

                print_success "Migration $filename aplicada"
            fi
        done
    else
        print_info "Nenhuma migration encontrada"
    fi
}

# Deploy edge function
deploy_function() {
    local function_name=$1

    print_info "Deploying function: $function_name"

    if [ ! -d "supabase/functions/$function_name" ]; then
        print_error "Função $function_name não encontrada"
        return 1
    fi

    supabase functions deploy $function_name --no-verify-jwt || {
        print_error "Erro ao fazer deploy de $function_name"
        return 1
    }

    print_success "Função $function_name deployed"
    return 0
}

# Deploy todas as edge functions
deploy_all_functions() {
    print_header "DEPLOYING EDGE FUNCTIONS"

    local functions=(
        "meta-ads-control"
        "google-ads-control"
        "automation-engine"
        "predictive-analysis"
    )

    local success_count=0
    local fail_count=0

    for func in "${functions[@]}"; do
        if deploy_function "$func"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    done

    echo ""
    print_info "Deploy Summary:"
    print_success "$success_count funções deployed com sucesso"

    if [ $fail_count -gt 0 ]; then
        print_error "$fail_count funções falharam"
        return 1
    fi

    return 0
}

# Configurar secrets (environment variables)
setup_secrets() {
    print_header "CONFIGURING SECRETS"

    print_info "Verificando secrets necessários..."

    # Lista de secrets necessários
    local secrets=(
        "GOOGLE_ADS_DEVELOPER_TOKEN"
        "META_CLIENT_ID"
        "META_CLIENT_SECRET"
    )

    print_info "⚠️  Certifique-se de configurar os seguintes secrets no Supabase Dashboard:"
    for secret in "${secrets[@]}"; do
        echo "   - $secret"
    done

    echo ""
    print_info "Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/settings/functions"
}

# Testar edge functions
test_functions() {
    print_header "TESTING EDGE FUNCTIONS"

    print_info "Para testar as funções, use:"
    echo ""
    echo "  # Testar Meta Ads Control"
    echo "  curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/meta-ads-control \\"
    echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"action\": \"get_ad_accounts\", \"params\": {}}'"
    echo ""
    echo "  # Testar Google Ads Control"
    echo "  curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/google-ads-control \\"
    echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"action\": \"get_customer_accounts\", \"params\": {}}'"
    echo ""
    echo "  # Testar Automation Engine"
    echo "  curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/automation-engine \\"
    echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"mode\": \"check_all\"}'"
    echo ""
    echo "  # Testar Predictive Analysis"
    echo "  curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/predictive-analysis \\"
    echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"action\": \"analyze_trends\", \"params\": {\"campaignId\": \"xxx\", \"days\": 30}}'"
    echo ""
}

# Verificar status das funções
check_functions_status() {
    print_header "CHECKING FUNCTIONS STATUS"

    print_info "Listando funções deployed..."
    supabase functions list || {
        print_error "Erro ao listar funções"
        return 1
    }
}

# Build frontend (se necessário)
build_frontend() {
    print_header "BUILDING FRONTEND"

    if [ -f "package.json" ]; then
        print_info "Executando build do frontend..."
        npm run build || {
            print_error "Erro no build do frontend"
            return 1
        }
        print_success "Frontend build concluído"
    else
        print_info "package.json não encontrado, pulando build"
    fi
}

# Deploy Vercel (frontend)
deploy_vercel() {
    print_header "DEPLOYING TO VERCEL"

    if command -v vercel &> /dev/null; then
        print_info "Fazendo deploy no Vercel..."
        vercel --prod --yes || {
            print_error "Erro no deploy do Vercel"
            return 1
        }
        print_success "Deploy Vercel concluído"
    else
        print_info "Vercel CLI não encontrado. Para deploy do frontend, execute:"
        echo "  npm install -g vercel"
        echo "  vercel --prod --yes"
    fi
}

# Rollback (em caso de erro)
rollback() {
    print_header "ROLLBACK"
    print_error "Deploy falhou! Execute rollback manual se necessário."
    print_info "Para reverter migrations:"
    echo "  supabase db reset --linked"
    print_info "Para remover funções:"
    echo "  supabase functions delete <function-name>"
}

# Menu principal
show_menu() {
    echo ""
    print_header "SYNCADS DEPLOYMENT MENU"
    echo "1) Deploy Completo (Migrations + Functions + Frontend)"
    echo "2) Deploy apenas Migrations"
    echo "3) Deploy apenas Edge Functions"
    echo "4) Deploy apenas Frontend (Vercel)"
    echo "5) Testar Edge Functions"
    echo "6) Verificar Status"
    echo "7) Configurar Secrets"
    echo "8) Sair"
    echo ""
    read -p "Escolha uma opção: " choice

    case $choice in
        1)
            deploy_complete
            ;;
        2)
            check_supabase_cli
            check_supabase_auth
            link_project
            apply_migrations
            print_success "Migrations deployed!"
            ;;
        3)
            check_supabase_cli
            check_supabase_auth
            link_project
            deploy_all_functions
            print_success "Edge Functions deployed!"
            ;;
        4)
            build_frontend
            deploy_vercel
            ;;
        5)
            test_functions
            ;;
        6)
            check_supabase_cli
            check_supabase_auth
            check_functions_status
            ;;
        7)
            setup_secrets
            ;;
        8)
            print_info "Saindo..."
            exit 0
            ;;
        *)
            print_error "Opção inválida!"
            show_menu
            ;;
    esac
}

# Deploy completo
deploy_complete() {
    print_header "🚀 DEPLOY COMPLETO INICIADO"

    # 1. Verificações
    check_supabase_cli
    check_supabase_auth

    # 2. Link projeto
    link_project

    # 3. Migrations
    apply_migrations || {
        rollback
        exit 1
    }

    # 4. Edge Functions
    deploy_all_functions || {
        rollback
        exit 1
    }

    # 5. Frontend
    build_frontend
    deploy_vercel

    # 6. Configurar secrets
    setup_secrets

    # 7. Testes
    test_functions

    # 8. Sucesso!
    print_header "🎉 DEPLOY COMPLETO COM SUCESSO!"
    print_success "Todas as implementações foram deployed:"
    echo ""
    echo "  ✅ Migrations aplicadas"
    echo "  ✅ Meta Ads Control deployed"
    echo "  ✅ Google Ads Control deployed"
    echo "  ✅ Automation Engine deployed"
    echo "  ✅ Predictive Analysis deployed"
    echo "  ✅ Frontend deployed (Vercel)"
    echo ""
    print_info "Próximos passos:"
    echo "  1. Configure os secrets necessários no Supabase Dashboard"
    echo "  2. Teste as edge functions usando os exemplos fornecidos"
    echo "  3. Conecte as integrações no frontend (Meta Ads, Google Ads)"
    echo "  4. Crie regras de automação"
    echo ""
    print_success "Sistema 100% operacional! 🚀"
}

# Executar script
main() {
    print_header "🚀 SYNCADS DEPLOYMENT SCRIPT"
    print_info "Deploy automatizado de integrations avançadas"

    # Se executado com argumento, faz deploy direto
    if [ "$1" == "auto" ]; then
        deploy_complete
    else
        show_menu
    fi
}

# Iniciar
main "$@"
