-- Verificar GlobalAiConnection para Anthropic
SELECT 
    id, 
    name, 
    provider, 
    model, 
    "isActive",
    CASE 
        WHEN "apiKey" IS NULL THEN 'NULL'
        WHEN LENGTH("apiKey") = 0 THEN 'EMPTY'
        ELSE CONCAT('LENGTH: ', LENGTH("apiKey"))
    END as apikey_status,
    "maxTokens",
    "temperature",
    "createdAt",
    "updatedAt"
FROM "GlobalAiConnection" 
WHERE provider = 'ANTHROPIC' OR "isActive" = true
ORDER BY "isActive" DESC, "createdAt" DESC;

-- Se necessário, atualizar API Key da Anthropic (descomentar e inserir a key real):
-- UPDATE "GlobalAiConnection" 
-- SET "apiKey" = 'sk-ant-api03-...' 
-- WHERE provider = 'ANTHROPIC' AND "isActive" = true;
