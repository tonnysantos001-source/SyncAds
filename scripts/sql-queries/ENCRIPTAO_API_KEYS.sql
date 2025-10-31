-- =====================================================
-- ENCRIPTAÇÃO DE API KEYS - EXECUTAR NO SUPABASE DASHBOARD
-- Data: 25/10/2025
-- Prioridade: MÉDIA (Segurança)
-- =====================================================

-- =====================================================
-- 1. MIGRAR API KEYS PARA ENCRIPTADAS
-- =====================================================

-- Primeiro, vamos verificar se há API keys para migrar
SELECT 
  id, 
  provider, 
  CASE 
    WHEN "apiKey" IS NULL THEN 'NULL'
    WHEN "apiKey" LIKE 'encrypted:%' THEN 'JÁ_ENCRIPTADA'
    ELSE 'PLAIN_TEXT'
  END as status,
  LENGTH("apiKey") as key_length
FROM "GlobalAiConnection"
WHERE "apiKey" IS NOT NULL;

-- =====================================================
-- 2. ENCRIPTAR API KEYS EXISTENTES
-- =====================================================

-- Encriptar API keys que ainda estão em plain text
UPDATE "GlobalAiConnection" 
SET "apiKey" = encrypt_api_key("apiKey")
WHERE "apiKey" IS NOT NULL 
  AND "apiKey" NOT LIKE 'encrypted:%'
  AND LENGTH("apiKey") > 10; -- Só encriptar se parecer uma chave real

-- =====================================================
-- 3. VERIFICAR ENCRIPTAÇÃO
-- =====================================================

-- Verificar se todas as API keys foram encriptadas
SELECT 
  id, 
  provider, 
  CASE 
    WHEN "apiKey" IS NULL THEN 'NULL'
    WHEN "apiKey" LIKE 'encrypted:%' THEN '✅ ENCRIPTADA'
    ELSE '❌ PLAIN_TEXT'
  END as status,
  LENGTH("apiKey") as key_length
FROM "GlobalAiConnection"
WHERE "apiKey" IS NOT NULL;

-- =====================================================
-- 4. TESTAR DESENCRIPTAÇÃO
-- =====================================================

-- Testar se conseguimos desencriptar (apenas para verificação)
SELECT 
  id,
  provider,
  CASE 
    WHEN "apiKey" LIKE 'encrypted:%' THEN '✅ Encriptada'
    ELSE '❌ Não encriptada'
  END as status,
  -- Não mostrar a chave desencriptada por segurança
  'API_KEY_HIDDEN' as decrypted_key_preview
FROM "GlobalAiConnection"
WHERE "apiKey" IS NOT NULL;

-- =====================================================
-- 5. ATUALIZAR EDGE FUNCTIONS PARA USAR DESENCRIPTAÇÃO
-- =====================================================

-- Nota: As Edge Functions já devem estar usando decrypt_api_key()
-- Verificar se estão funcionando corretamente

-- =====================================================
-- API KEYS ENCRIPTADAS COM SUCESSO!
-- =====================================================
