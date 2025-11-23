-- Script 2: LIMPAR E CRIAR NOVA CONEXÃO ANTHROPIC
DELETE FROM "GlobalAiConnection" WHERE provider = 'ANTHROPIC';

INSERT INTO "GlobalAiConnection" (
  id, name, provider, "apiKey", "baseUrl", model, "maxTokens", temperature, "isActive", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Claude 3.5 Sonnet',
  'ANTHROPIC',
  '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',
  'https://api.anthropic.com/v1',
  'claude-3-5-sonnet-20241022',
  4096,
  0.7,
  true,
  NOW(),
  NOW()
);
