-- Desativar todas as outras conexões Anthropic
UPDATE "GlobalAiConnection" SET "isActive" = false WHERE "provider" = 'ANTHROPIC';

-- Deletar configurações antigas para evitar duplicatas
DELETE FROM "GlobalAiConnection" WHERE "provider" = 'ANTHROPIC';

-- Inserir nova configuração da Anthropic com CLAUDE 3 OPUS (modelo que funcionava antes)
INSERT INTO "GlobalAiConnection" (
  id, 
  name, 
  provider, 
  "apiKey", 
  model, 
  "baseUrl", 
  "systemPrompt", 
  temperature, 
  "maxTokens", 
  "isActive", 
  "createdAt"
) VALUES (
  gen_random_uuid(), 
  'Claude 3 Opus', 
  'ANTHROPIC', 
  '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', 
  'claude-3-opus-20240229', 
  'https://api.anthropic.com/v1', 
  null, 
  0.7, 
  4096, 
  true, 
  NOW()
);

-- Verificar se foi inserido
SELECT id, name, provider, LEFT("apiKey", 20) as api_key_preview, model, "isActive" 
FROM "GlobalAiConnection" 
WHERE provider = 'ANTHROPIC' 
ORDER BY "createdAt" DESC 
LIMIT 1;
