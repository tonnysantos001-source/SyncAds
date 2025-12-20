-- ============================================
-- CONFIGURAÇÃO DO SISTEMA MULTI-AGENTE (3 IAs)
-- Usando Grok com modelos gratuitos
-- ============================================
-- IMPORTANTE: Execute este SQL no Supabase SQL Editor
-- Ou via: supabase db execute -f este_arquivo.sql
-- 1. Limpar IAs antigas (OPCIONAL - só se quiser recomeçar do zero)
-- DELETE FROM "GlobalAiConnection" WHERE "provider" = 'GROQ';
-- ============================================
-- IA 1: THINKER (Raciocínio Avançado)
-- ============================================
INSERT INTO "GlobalAiConnection" (
        "id",
        "name",
        "provider",
        "apiKey",
        "baseUrl",
        "model",
        "maxTokens",
        "temperature",
        "aiRole",
        "isActive",
        "systemPrompt",
        "initialGreetings",
        "createdAt",
        "updatedAt"
    )
VALUES (
        gen_random_uuid(),
        'Grok Thinker - Llama 3.3 70B (Raciocínio)',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.5,
        -- Temperatura baixa para raciocínio preciso
        'REASONING',
        true,
        NULL,
        -- Prompt vem do arquivo SYSTEM_PROMPT_THINKER_V2.md
        ARRAY [
    '🧠 Olá! Sou o agente de raciocínio do SyncAds. Estou pronto para planejar e estrategizar suas tarefas!',
    '👋 Oi! Posso ajudar você a pensar em soluções criativas para automação de anúncios.',
    '🎯 Pronto para entender suas necessidades e criar o melhor plano de ação!'
  ],
        NOW(),
        NOW()
    );
-- ============================================
-- IA 2: CRITIC (Validador Rápido)
-- ============================================
INSERT INTO "GlobalAiConnection" (
        "id",
        "name",
        "provider",
        "apiKey",
        "baseUrl",
        "model",
        "maxTokens",
        "temperature",
        "aiRole",
        "isActive",
        "systemPrompt",
        "initialGreetings",
        "createdAt",
        "updatedAt"
    )
VALUES (
        gen_random_uuid(),
        'Grok Critic - Llama 3.1 8B (Validador)',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.1-8b-instant',
        2048,
        -- Menos tokens (validação é mais curta)
        0.3,
        -- Temperatura muito baixa para validação rigorosa
        'GENERAL',
        -- Usamos GENERAL porque ainda não temos role VALIDATOR
        true,
        NULL,
        -- Prompt vem do arquivo SYSTEM_PROMPT_CRITIC.md
        ARRAY [
    '🔍 Sistema de validação ativo. Garantindo qualidade em todas as operações.',
    '✅ Pronto para validar e otimizar planos de execução.'
  ],
        NOW(),
        NOW()
    );
-- ============================================
-- IA 3: EXECUTOR (Interface com Usuário)
-- ============================================
INSERT INTO "GlobalAiConnection" (
        "id",
        "name",
        "provider",
        "apiKey",
        "baseUrl",
        "model",
        "maxTokens",
        "temperature",
        "aiRole",
        "isActive",
        "systemPrompt",
        "initialGreetings",
        "createdAt",
        "updatedAt"
    )
VALUES (
        gen_random_uuid(),
        'Grok Executor - Llama 3.3 70B (Execução)',
        'GROQ',
        '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',
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        4096,
        0.7,
        -- Temperatura média para respostas criativas mas precisas
        'EXECUTOR',
        true,
        NULL,
        -- Prompt vem do arquivo SYSTEM_PROMPT_EXECUTOR_V2.md
        ARRAY [
    '⚡ Olá! Sou seu assistente de execução. Estou pronto para transformar ideias em ações!',
    '👋 Oi! Posso ajudar você a automatizar suas tarefas e gerenciar seus anúncios.',
    '🚀 Pronto para executar! Me diga o que você precisa e vou fazer acontecer.',
    '💼 Seu gerente de anúncios pessoal. Como posso ajudar hoje?'
  ],
        NOW(),
        NOW()
    );
-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Executar esta query para confirmar que as IAs foram criadas:
SELECT "name",
    "provider",
    "model",
    "aiRole",
    "temperature",
    "maxTokens",
    "isActive"
FROM "GlobalAiConnection"
WHERE "provider" = 'GROQ'
ORDER BY CASE
        "aiRole"
        WHEN 'REASONING' THEN 1
        WHEN 'GENERAL' THEN 2
        WHEN 'EXECUTOR' THEN 3
    END;
-- Resultado esperado:
-- 1. Grok Thinker - REASONING - llama-3.3-70b - temp 0.5
-- 2. Grok Critic - GENERAL - llama-3.1-8b - temp 0.3
-- 3. Grok Executor - EXECUTOR - llama-3.3-70b - temp 0.7