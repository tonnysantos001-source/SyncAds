#!/bin/bash

# Script de teste para GROQ Tool Calling
# Teste de raspagem de produtos

echo "🧪 Testando GROQ Tool Calling..."
echo ""

# Configuração
PROJECT_URL="https://ovskepqggmxlfckxqgbr.supabase.co"
# Substitua pelo seu token de autenticação
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 

echo "📝 Teste 1: Raspagem de produtos"
echo "URL: https://www.kinei.com.br/produtos/tenis-masculino"
echo ""

curl -X POST "${PROJECT_URL}/functions/v1/chat-stream-groq" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "preciso que faça uma raspagem dos produtos nesse site https://www.kinei.com.br/produtos/tenis-masculino, depois crie um arquivo .csv",
    "conversationId": "test-123",
    "chatHistory": []
  }' | jq '.'

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📊 Verifique os logs no Supabase Dashboard:"
echo "${PROJECT_URL}/project/_/logs/edge-functions?functionId=chat-stream-groq"

