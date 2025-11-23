-- Script para atualizar a API Key da Anthropic
-- IMPORTANTE: Execute este script DEPOIS de substituir pela sua chave real!

-- 1. Verificar a conexão atual
SELECT 
  id,
  name,
  provider,
  model,
  isActive,
  LENGTH(apiKey) as current_key_length,
  SUBSTRING(apiKey, 1, 10) || '...' as key_preview
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';

-- 2. ATUALIZAR API KEY (SUBSTITUA 'SUA_API_KEY_AQUI' pela chave real)
-- Descomente a linha abaixo e insira sua chave Anthropic após sk-ant-
/*
UPDATE "GlobalAiConnection"
SET 
  apiKey = 'sk-ant-COLE_SUA_CHAVE_AQUI',
  isActive = true,
  model = 'claude-3-5-sonnet-20241022'
WHERE provider = 'ANTHROPIC';
*/

-- 3. Verificar atualização
SELECT 
  id,
  name,
  provider,
  model,
  isActive,
  LENGTH(apiKey) as new_key_length,
  CASE 
    WHEN LENGTH(apiKey) > 20 THEN '✅ Key válida'
    ELSE '❌ Key inválida'
  END as validation
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';
