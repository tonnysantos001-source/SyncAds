#!/bin/bash
# Script para inserir as 3 IAs usando curl

SUPABASE_URL="https://ovskepqggmxlfckxqgbr.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgyNDg1NSwiZXhwIjoyMDc2NDAwODU1fQ.ORCz0Wm7OMfmWWGjHw2LcOz_vZ6AJRAzrqjNgqCKMNc"

echo "🚀 Inserindo IA 1: Thinker..."
curl -X POST "$SUPABASE_URL/rest/v1/GlobalAiConnection" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Grok Thinker - Llama 3.3 70B",
    "provider": "GROQ",
    "apiKey": "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",
    "baseUrl": "https://api.groq.com/openai/v1",
    "model": "llama-3.3-70b-versatile",
    "maxTokens": 4096,
    "temperature": 0.5,
    "aiRole": "REASONING",
    "isActive": true
  }'

echo -e "\n\n🚀 Inserindo IA 2: Critic..."
curl -X POST "$SUPABASE_URL/rest/v1/GlobalAiConnection" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Grok Critic - Llama 3.1 8B",
    "provider": "GROQ",
    "apiKey": "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",
    "baseUrl": "https://api.groq.com/openai/v1",
    "model": "llama-3.1-8b-instant",
    "maxTokens": 2048,
    "temperature": 0.3,
    "aiRole": "GENERAL",
    "isActive": true
  }'

echo -e "\n\n🚀 Inserindo IA 3: Executor..."
curl -X POST "$SUPABASE_URL/rest/v1/GlobalAiConnection" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Grok Executor - Llama 3.3 70B",
    "provider": "GROQ",
    "apiKey": "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",
    "baseUrl": "https://api.groq.com/openai/v1",
    "model": "llama-3.3-70b-versatile",
    "maxTokens": 4096,
    "temperature": 0.7,
    "aiRole": "EXECUTOR",
    "isActive": true
  }'

echo -e "\n\n✅ Concluído! Verifique o painel Super Admin."
