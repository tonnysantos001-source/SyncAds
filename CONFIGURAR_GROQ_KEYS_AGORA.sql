-- ============================================
-- CONFIGURAÇÃO DAS 5 API KEYS GROQ
-- INSERTs SEPARADOS para garantir todas sejam adicionadas
-- Data: 25/01/2026
-- ============================================
-- LIMPAR KEYS ANTIGAS
DELETE FROM "GlobalAiConnection"
WHERE provider = 'GROQ';
-- ============================================
-- KEY 1: CHAT-STREAM (EXECUTOR)
-- ============================================
INSERT INTO "GlobalAiConnection" (
        id,
        name,
        provider,
        "apiKey",
        "baseUrl",
        model,
        "maxTokens",
        temperature,
        "aiRole",
        "isActive",
        "createdAt"
    )
VALUES (
        gen_random_uuid(),
        'Groq Chat-Stream - Llama 3.3 70B',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.7,
        'EXECUTOR',
        true,
        NOW()
    );
-- ============================================
-- KEY 2: NAVEGADOR (NAVIGATOR)
-- ============================================
INSERT INTO "GlobalAiConnection" (
        id,
        name,
        provider,
        "apiKey",
        "baseUrl",
        model,
        "maxTokens",
        temperature,
        "aiRole",
        "isActive",
        "createdAt"
    )
VALUES (
        gen_random_uuid(),
        'Grok Navegador - Llama 3.3 70B',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.7,
        'NAVIGATOR',
        true,
        NOW()
    );
-- ============================================
-- KEY 3: EXECUTOR
-- ============================================
INSERT INTO "GlobalAiConnection" (
        id,
        name,
        provider,
        "apiKey",
        "baseUrl",
        model,
        "maxTokens",
        temperature,
        "aiRole",
        "isActive",
        "createdAt"
    )
VALUES (
        gen_random_uuid(),
        'Grok Executor - Llama 3.3 70B',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.7,
        'EXECUTOR',
        true,
        NOW()
    );
-- ============================================
-- KEY 4: THINKER (REASONING)
-- ============================================
INSERT INTO "GlobalAiConnection" (
        id,
        name,
        provider,
        "apiKey",
        "baseUrl",
        model,
        "maxTokens",
        temperature,
        "aiRole",
        "isActive",
        "createdAt"
    )
VALUES (
        gen_random_uuid(),
        'Grok Thinker - Llama 3.3 70B',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.7,
        'REASONING',
        true,
        NOW()
    );
-- ============================================
-- KEY 5: BACKUP (EXECUTOR)
-- ============================================
INSERT INTO "GlobalAiConnection" (
        id,
        name,
        provider,
        "apiKey",
        "baseUrl",
        model,
        "maxTokens",
        temperature,
        "aiRole",
        "isActive",
        "createdAt"
    )
VALUES (
        gen_random_uuid(),
        'Grok Backup - Llama 3.3 70B',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.7,
        'EXECUTOR',
        true,
        NOW()
    );
-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT name,
    LEFT("apiKey", 15) || '...' as "key_preview",
    "aiRole",
    "maxTokens",
    temperature,
    "isActive"
FROM "GlobalAiConnection"
WHERE provider = 'GROQ'
ORDER BY "aiRole",
    name;
-- ============================================
-- RESULTADO ESPERADO:
-- Deve mostrar 5 registros:
-- 1. Grok Backup - EXECUTOR
-- 2. Grok Executor - EXECUTOR  
-- 3. Groq Chat-Stream - EXECUTOR
-- 4. Grok Navegador - NAVIGATOR
-- 5. Grok Thinker - REASONING
-- ============================================