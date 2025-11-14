#!/bin/bash
# ============================================
# SYNCADS PYTHON MICROSERVICE - START SCRIPT
# ============================================

echo "🚀 Iniciando SyncAds Python Microservice..."

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Criando a partir do .env.example..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Por favor, configure suas variáveis de ambiente."
    exit 1
fi

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale Python 3.10+ primeiro."
    exit 1
fi

# Criar venv se não existir
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar venv
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "📚 Instalando dependências..."
pip install --upgrade pip
pip install -r requirements.txt

# Instalar Playwright browsers
echo "🎭 Instalando navegadores do Playwright..."
playwright install chromium
playwright install-deps chromium

# Iniciar servidor
echo ""
echo "✅ Tudo pronto!"
echo "🚀 Iniciando FastAPI server..."
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
