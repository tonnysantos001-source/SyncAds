#!/bin/bash
# Script para verificar e instalar dependências do Playwright no Railway

echo "🔍 Verificando instalação do Playwright..."

# Verificar se playwright está instalado
python -c "import playwright" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Playwright (Python) instalado"
else
    echo "❌ Playwright (Python) NÃO instalado"
    echo "Instalando..."
    pip install playwright
fi

# Verificar se os browsers estão instalados
echo ""
echo "🌐 Verificando browsers do Playwright..."
playwright install --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ CLI do Playwright disponível"
    echo "Instalando Chromium..."
    playwright install chromium --with-deps
    echo "✅ Chromium instalado com dependências"
else
    echo "❌ CLI do Playwright não disponível"
fi

echo ""
echo "✅ Verificação concluída!"
