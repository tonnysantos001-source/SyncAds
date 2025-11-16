#!/bin/bash

# ============================================
# SYNCADS PYTHON MICROSERVICE - DEPLOY RAILWAY
# Script de build e deploy automatizado
# ============================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para printar com cores
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Verificar se estamos no diretório correto
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile não encontrado! Execute este script do diretório python-service/"
    exit 1
fi

print_header "🚀 SYNCADS PYTHON MICROSERVICE - DEPLOY RAILWAY"

# Verificar Railway CLI
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI não está instalado!"
    print_info "Instale com: npm install -g @railway/cli"
    exit 1
fi

print_success "Railway CLI encontrado!"

# Menu de opções
echo ""
echo "Escolha uma opção:"
echo "1) 🧪 Build local (testar Dockerfile)"
echo "2) 🚀 Deploy para Railway (production)"
echo "3) 📦 Build + Deploy completo"
echo "4) 🔍 Verificar status do Railway"
echo "5) 📊 Ver logs do Railway"
echo "6) 🔧 Configurar variáveis de ambiente"
echo "7) ❌ Cancelar"
echo ""
read -p "Digite sua escolha [1-7]: " choice

case $choice in
    1)
        print_header "🧪 BUILD LOCAL"

        print_info "Iniciando build local do Docker..."
        print_warning "Isso pode levar 25-30 minutos na primeira vez!"
        print_info "Builds subsequentes serão mais rápidos devido ao cache."

        docker build \
            --progress=plain \
            --tag syncads-python:latest \
            --file Dockerfile \
            .

        print_success "Build local concluído com sucesso!"
        print_info "Para testar localmente, execute:"
        echo "docker run -p 8000:8000 -e PORT=8000 syncads-python:latest"
        ;;

    2)
        print_header "🚀 DEPLOY PARA RAILWAY"

        print_info "Verificando login no Railway..."
        railway whoami || {
            print_warning "Não está logado no Railway!"
            print_info "Executando login..."
            railway login
        }

        print_info "Iniciando deploy..."
        print_warning "O build no Railway levará 25-30 minutos na primeira vez!"

        railway up

        print_success "Deploy iniciado com sucesso!"
        print_info "Acompanhe o progresso no dashboard do Railway"
        ;;

    3)
        print_header "📦 BUILD + DEPLOY COMPLETO"

        # Build local primeiro
        print_info "PASSO 1/2: Build local para verificação..."
        docker build \
            --progress=plain \
            --tag syncads-python:test \
            --target builder-phase1 \
            --file Dockerfile \
            .

        print_success "Build de verificação OK!"

        # Deploy para Railway
        print_info "PASSO 2/2: Deploy para Railway..."
        railway whoami || railway login
        railway up

        print_success "Build + Deploy completo!"
        ;;

    4)
        print_header "🔍 STATUS DO RAILWAY"

        print_info "Verificando status do serviço..."
        railway status

        print_info "Informações do projeto:"
        railway environment
        ;;

    5)
        print_header "📊 LOGS DO RAILWAY"

        print_info "Mostrando logs em tempo real (Ctrl+C para sair)..."
        railway logs
        ;;

    6)
        print_header "🔧 CONFIGURAR VARIÁVEIS DE AMBIENTE"

        print_info "Variáveis recomendadas para configurar:"
        echo ""
        echo "OBRIGATÓRIAS:"
        echo "- SUPABASE_URL"
        echo "- SUPABASE_SERVICE_KEY"
        echo ""
        echo "OPCIONAIS (IA):"
        echo "- OPENAI_API_KEY"
        echo "- ANTHROPIC_API_KEY"
        echo "- GROQ_API_KEY"
        echo "- GOOGLE_AI_API_KEY"
        echo ""

        read -p "Deseja configurar agora? [s/N]: " config_now

        if [[ $config_now =~ ^[Ss]$ ]]; then
            print_info "Abrindo configuração de variáveis..."
            railway variables
        else
            print_info "Configure manualmente no dashboard: https://railway.app"
        fi
        ;;

    7)
        print_info "Operação cancelada."
        exit 0
        ;;

    *)
        print_error "Opção inválida!"
        exit 1
        ;;
esac

# Informações finais
print_header "📋 INFORMAÇÕES IMPORTANTES"

echo "🏗️  BUILD:"
echo "   - Primeira vez: ~25-30 minutos"
echo "   - Com cache: ~2-5 minutos"
echo "   - Tamanho final: ~5-6GB"
echo ""

echo "💾 RECURSOS RAILWAY:"
echo "   - RAM mínima: 2GB"
echo "   - RAM recomendada: 4GB"
echo "   - CPU: 2 vCPUs recomendado"
echo ""

echo "📁 ESTRUTURA:"
echo "   - requirements-base.txt (Core)"
echo "   - requirements-scraping.txt (Web Scraping)"
echo "   - requirements-ai.txt (IA & ML)"
echo ""

echo "🔗 PRÓXIMOS PASSOS:"
echo "   1. Configure as variáveis de ambiente"
echo "   2. Aguarde o build completar"
echo "   3. Teste o endpoint: https://seu-app.railway.app/health"
echo "   4. Configure o domínio customizado (se necessário)"
echo ""

print_success "Script concluído!"
