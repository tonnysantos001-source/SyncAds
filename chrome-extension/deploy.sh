#!/bin/bash

# ==========================================
# SYNCADS EXTENSION - DEPLOY AUTOMATIZADO
# ==========================================

set -e

echo "🚀 Iniciando deploy da extensão SyncAds..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variáveis
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SERVICE_DIR="$(dirname "$EXTENSION_DIR")/python-service"
BACKUP_DIR="$EXTENSION_DIR/backups/$(date +%Y%m%d-%H%M%S)"

# ==========================================
# FUNÇÃO: Verificar dependências
# ==========================================
check_dependencies() {
    echo "🔍 Verificando dependências..."

    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI não encontrado${NC}"
        echo "   Instale com: npm install -g @railway/cli"
        exit 1
    fi

    if ! command -v zip &> /dev/null; then
        echo -e "${YELLOW}⚠️  zip não encontrado - instalando...${NC}"
        # Detectar SO e instalar
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install zip
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get install -y zip
        fi
    fi

    echo -e "${GREEN}✅ Dependências OK${NC}"
}

# ==========================================
# FUNÇÃO: Fazer backup
# ==========================================
backup_extension() {
    echo ""
    echo "💾 Fazendo backup da extensão..."

    mkdir -p "$BACKUP_DIR"

    # Copiar arquivos importantes
    cp "$EXTENSION_DIR/manifest.json" "$BACKUP_DIR/"
    cp "$EXTENSION_DIR/background.js" "$BACKUP_DIR/"
    cp "$EXTENSION_DIR/content-script.js" "$BACKUP_DIR/"
    cp "$EXTENSION_DIR/popup.js" "$BACKUP_DIR/"
    cp "$EXTENSION_DIR/popup.html" "$BACKUP_DIR/"

    echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"
}

# ==========================================
# FUNÇÃO: Deploy Railway
# ==========================================
deploy_railway() {
    echo ""
    echo "🚂 Deploy do backend no Railway..."

    cd "$PYTHON_SERVICE_DIR"

    # Verificar se está logado
    if ! railway whoami &> /dev/null; then
        echo -e "${YELLOW}⚠️  Não está logado no Railway${NC}"
        echo "   Fazendo login..."
        railway login
    fi

    # Deploy
    echo "   Enviando código..."
    railway up

    echo -e "${GREEN}✅ Backend deployed no Railway${NC}"

    cd "$EXTENSION_DIR"
}

# ==========================================
# FUNÇÃO: Testar API
# ==========================================
test_api() {
    echo ""
    echo "🧪 Testando API..."

    API_URL="https://syncads-python-microservice-production.up.railway.app/api/extension/health"

    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")

    if [ "$response" -eq 200 ]; then
        echo -e "${GREEN}✅ API está respondendo (HTTP $response)${NC}"
    else
        echo -e "${RED}❌ API retornou erro (HTTP $response)${NC}"
        echo "   Verifique os logs do Railway"
        exit 1
    fi
}

# ==========================================
# FUNÇÃO: Criar pacote ZIP
# ==========================================
create_zip() {
    echo ""
    echo "📦 Criando pacote ZIP da extensão..."

    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    ZIP_NAME="syncads-extension-$TIMESTAMP.zip"

    cd "$EXTENSION_DIR"
    zip -r "../$ZIP_NAME" . \
        -x "*.git*" \
        -x "node_modules/*" \
        -x "backups/*" \
        -x "*.sh" \
        -x "*.md" \
        -x "test-*.js"

    echo -e "${GREEN}✅ ZIP criado: $ZIP_NAME${NC}"
    echo "   Localização: $(dirname "$EXTENSION_DIR")/$ZIP_NAME"
}

# ==========================================
# FUNÇÃO: Mostrar instruções
# ==========================================
show_instructions() {
    echo ""
    echo "================================================"
    echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
    echo "================================================"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo ""
    echo "1️⃣  RECARREGAR A EXTENSÃO NO CHROME:"
    echo "   - Abra: chrome://extensions/"
    echo "   - Clique no ícone de refresh da extensão SyncAds"
    echo ""
    echo "2️⃣  TESTAR A CONEXÃO:"
    echo "   - Acesse: https://syncads.com.br/app"
    echo "   - Faça login"
    echo "   - Clique no ícone da extensão"
    echo "   - Verifique se aparece 'Conectado'"
    echo ""
    echo "3️⃣  MONITORAR LOGS:"
    echo "   - Extension: chrome://extensions/ > SyncAds > service worker"
    echo "   - Backend: railway logs"
    echo ""
    echo "4️⃣  VERIFICAR TABELAS SUPABASE:"
    echo "   - Acesse: https://supabase.com/dashboard"
    echo "   - SQL Editor: SELECT * FROM extension_devices;"
    echo ""
    echo "================================================"
    echo ""
    echo "🔗 Links Úteis:"
    echo "   Railway: https://railway.app"
    echo "   Supabase: https://supabase.com/dashboard"
    echo "   API Health: https://syncads-python-microservice-production.up.railway.app/api/extension/health"
    echo ""
}

# ==========================================
# FUNÇÃO: Rollback
# ==========================================
rollback() {
    echo ""
    echo "🔄 Fazendo rollback..."

    if [ -d "$BACKUP_DIR" ]; then
        cp "$BACKUP_DIR"/* "$EXTENSION_DIR/"
        echo -e "${GREEN}✅ Rollback concluído${NC}"
    else
        echo -e "${RED}❌ Backup não encontrado${NC}"
        exit 1
    fi
}

# ==========================================
# MENU PRINCIPAL
# ==========================================
main() {
    echo "================================================"
    echo "   SYNCADS EXTENSION - DEPLOY TOOL"
    echo "================================================"
    echo ""
    echo "Escolha uma opção:"
    echo "1) Deploy Completo (Backend + Extensão)"
    echo "2) Deploy apenas Backend (Railway)"
    echo "3) Criar ZIP da Extensão"
    echo "4) Testar API"
    echo "5) Rollback (restaurar backup)"
    echo "0) Sair"
    echo ""
    read -p "Opção: " option

    case $option in
        1)
            check_dependencies
            backup_extension
            deploy_railway
            test_api
            create_zip
            show_instructions
            ;;
        2)
            check_dependencies
            deploy_railway
            test_api
            ;;
        3)
            create_zip
            ;;
        4)
            test_api
            ;;
        5)
            rollback
            ;;
        0)
            echo "👋 Saindo..."
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Opção inválida${NC}"
            exit 1
            ;;
    esac
}

# Executar menu principal
main
