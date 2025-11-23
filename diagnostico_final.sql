-- DIAGNÓSTICO FINAL - Ver todos os campos da GlobalAiConnection ativa

SELECT 
  id,
  name,
  provider,
  "apiKey" IS NOT NULL as tem_apikey,
  "baseUrl",
  model,
  "maxTokens",
  temperature,
  "isActive",
  "systemPrompt" IS NOT NULL as tem_systemprompt,
  "createdAt",
  "updatedAt"
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC' AND "isActive" = true;
