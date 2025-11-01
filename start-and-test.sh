#!/bin/bash

# ========================================
# SCRIPT DE INICIALIZAÇÃO E TESTE DO CHAT
# ========================================
# Este script inicia a aplicação e fornece
# instruções para testar o sistema de chat
# ========================================

echo ""
echo "🚀 =========================================="
echo "🚀  INICIANDO SYNCADS - SISTEMA DE CHAT"
echo "🚀 =========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto SyncAds${NC}"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules não encontrado. Instalando dependências...${NC}"
    npm install
fi

echo -e "${BLUE}✅ Dependências verificadas${NC}"
echo ""

# Verificar variáveis de ambiente
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo -e "${RED}⚠️  Arquivo .env não encontrado!${NC}"
    echo "   Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
    echo ""
fi

# Limpar terminal
clear

# Mostrar instruções antes de iniciar
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    SYNCADS - CHAT TESTE                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 INSTRUÇÕES DE TESTE:${NC}"
echo ""
echo "1. Aguarde a aplicação iniciar (pode levar 10-30 segundos)"
echo "2. O navegador abrirá automaticamente em http://localhost:5173"
echo "3. Faça login na aplicação"
echo "4. Navegue até o Chat (/app/chat)"
echo ""
echo -e "${YELLOW}5. ABRA O CONSOLE DO NAVEGADOR (F12)${NC}"
echo ""
echo "6. Envie uma mensagem de teste: 'Olá, você está funcionando?'"
echo ""
echo -e "${GREEN}✅ O QUE VOCÊ DEVE VER:${NC}"
echo "   - Sua mensagem aparece imediatamente (azul, direita)"
echo "   - Resposta da IA aparece com efeito de digitação (cinza, esquerda)"
echo "   - Console mostra logs: [ChatStore] Adicionando mensagem"
echo "   - SEM erros vermelhos no console"
echo "   - SEM mensagens duplicadas"
echo ""
echo -e "${BLUE}🔍 DIAGNÓSTICO AVANÇADO:${NC}"
echo "   No console do navegador, execute:"
echo "   ${YELLOW}diagnosticChatFlow()${NC}"
echo ""
echo -e "${RED}🐛 SE ALGO DER ERRADO:${NC}"
echo "   1. Verifique o console do navegador (F12)"
echo "   2. Leia TESTE_RAPIDO_CHAT.md"
echo "   3. Execute diagnosticChatFlow() no console"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}Pressione ENTER para iniciar o servidor...${NC}"
read

# Iniciar servidor
echo ""
echo -e "${GREEN}🚀 Iniciando servidor de desenvolvimento...${NC}"
echo ""

# Abrir navegador após 5 segundos (em background)
(
    sleep 5
    echo ""
    echo -e "${GREEN}🌐 Abrindo navegador...${NC}"

    # Detectar sistema operacional e abrir navegador
    case "$(uname -s)" in
        Linux*)     xdg-open http://localhost:5173 2>/dev/null || echo "Abra manualmente: http://localhost:5173" ;;
        Darwin*)    open http://localhost:5173 ;;
        MINGW*|MSYS*|CYGWIN*) start http://localhost:5173 ;;
        *)          echo -e "${YELLOW}Abra manualmente: http://localhost:5173${NC}" ;;
    esac
) &

# Iniciar Vite
npm run dev

# Se o servidor for interrompido
echo ""
echo -e "${BLUE}✅ Servidor encerrado.${NC}"
echo ""
