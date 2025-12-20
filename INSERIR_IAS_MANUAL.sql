-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/editor
-- PASSO 1: Inserir as 3 IAs do Grok
-- Limpar IAs antigas do Grok (opcional)
-- DELETE FROM "GlobalAiConnection" WHERE "provider" = 'GROQ';
-- IA 1: THINKER
INSERT INTO "GlobalAiConnection" (
        "name",
        "provider",
        "apiKey",
        "baseUrl",
        "model",
        "maxTokens",
        "temperature",
        "aiRole",
        "isActive"
    )
VALUES (
        'Grok Thinker - Llama 3.3 70B',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.5,
        'REASONING',
        true
    );
-- IA 2: CRITIC
INSERT INTO "GlobalAiConnection" (
        "name",
        "provider",
        "apiKey",
        "baseUrl",
        "model",
        "maxTokens",
        "temperature",
        "aiRole",
        "isActive"
    )
VALUES (
        'Grok Critic - Llama 3.1 8B',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.1-8b-instant',
        2048,
        0.3,
        'GENERAL',
        true
    );
-- IA 3: EXECUTOR
INSERT INTO "GlobalAiConnection" (
        "name",
        "provider",
        "apiKey",
        "baseUrl",
        "model",
        "maxTokens",
        "temperature",
        "aiRole",
        "isActive"
    )
VALUES (
        'Grok Executor - Llama 3.3 70B',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.7,
        'EXECUTOR',
        true
    );
-- PASSO 2: Verificar se inseriu corretamente
SELECT "name",
    "model",
    "aiRole",
    "isActive"
FROM "GlobalAiConnection"
WHERE "provider" = 'GROQ';