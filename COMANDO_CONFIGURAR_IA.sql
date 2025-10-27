-- ========================================
-- CONFIGURAR IA GLOBAL NO SYNCADS
-- ========================================

-- Opção 1: OpenAI (Recomendado)
INSERT INTO "GlobalAiConnection" (
  id,
  name,
  provider,
  "apiKey",
  "baseUrl",
  model,
  "maxTokens",
  temperature,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'OpenAI GPT-4 Turbo',
  'OPENAI',
  'sk-SUA-API-KEY-AQUI',  -- ⚠️ SUBSTITUA POR SUA API KEY REAL!
  'https://api.openai.com/v1',
  'gpt-4-turbo',
  4096,
  0.7,
  true,
  now(),
  now()
);

-- ========================================
-- VERIFICAR SE IA FOI CONFIGURADA:
-- ========================================

SELECT 
  id, 
  name, 
  provider, 
  model, 
  "isActive",
  CASE 
    WHEN "apiKey" IS NULL OR "apiKey" = '' THEN '❌ SEM API KEY'
    ELSE '✅ COM API KEY'
  END as status_api_key
FROM "GlobalAiConnection" 
WHERE "isActive" = true;

-- ========================================
-- CONFIGURAR IA PARA UMA ORGANIZAÇÃO:
-- ========================================

-- Buscar organizationId do usuário
SELECT o.id as org_id, o.name
FROM "Organization" o
LIMIT 1;

-- Conectar IA Global à Organização (substitua os IDs)
INSERT INTO "OrganizationAiConnection" (
  id,
  "organizationId",
  "globalAiConnectionId",
  "isDefault",
  "customSystemPrompt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'ID-DA-SUA-ORGANIZACAO',  -- ⚠️ SUBSTITUA!
  'ID-DA-IA-GLOBAL',        -- ⚠️ SUBSTITUA!
  true,
  'Você é um assistente de IA para administradores. Responda de forma clara e objetiva.',
  now(),
  now()
);

-- ========================================
-- TODAS AS IAs CONFIGURADAS:
-- ========================================

SELECT 
  gai.id,
  gai.name,
  gai.provider,
  gai.model,
  gai."isActive",
  COUNT(oai.id) as "organizacoes_conectadas"
FROM "GlobalAiConnection" gai
LEFT JOIN "OrganizationAiConnection" oai ON oai."globalAiConnectionId" = gai.id
WHERE gai."isActive" = true
GROUP BY gai.id, gai.name, gai.provider, gai.model, gai."isActive";

