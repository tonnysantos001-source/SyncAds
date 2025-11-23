-- DIAGNÓSTICO DA CHAVE API ANTHROPIC
-- Execute no SQL Editor do Supabase para investigar o problema

-- 1. Ver informações da chave atual
SELECT 
  id,
  name,
  provider,
  model,
  isActive,
  LENGTH(apiKey) as comprimento_chave,
  -- Verificar primeiros e últimos caracteres (sem expor a chave completa)
  LEFT(apiKey, 7) as inicio,
  RIGHT(apiKey, 4) as final,
  -- Verificar se tem espaços ou caracteres estranhos
  LENGTH(TRIM(apiKey)) as comprimento_sem_espacos,
  CASE 
    WHEN apiKey != TRIM(apiKey) THEN '⚠️ TEM ESPAÇOS'
    ELSE '✅ Sem espaços'
  END as status_espacos,
  -- Verificar formato
  CASE 
    WHEN apiKey LIKE 'sk-ant-%' THEN '✅ Formato correto'
    ELSE '❌ Formato inválido'
  END as formato,
  createdAt,
  updatedAt
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';

-- 2. Verificar se há múltiplas conexões ANTHROPIC (pode causar conflito)
SELECT 
  COUNT(*) as total_conexoes,
  SUM(CASE WHEN isActive THEN 1 ELSE 0 END) as ativas
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';

-- 3. Ver todas as conexões de IA
SELECT 
  provider,
  name,
  isActive,
  LENGTH(apiKey) as key_length,
  model
FROM "GlobalAiConnection"
ORDER BY isActive DESC, provider;

-- 4. Verificar últimas mensagens de erro do chat
SELECT 
  id,
  role,
  LEFT(content, 100) as conteudo_inicio,
  createdAt
FROM "ChatMessage"
WHERE role = 'ASSISTANT'
  AND (content LIKE '%error%' OR content LIKE '%API%')
ORDER BY createdAt DESC
LIMIT 5;
