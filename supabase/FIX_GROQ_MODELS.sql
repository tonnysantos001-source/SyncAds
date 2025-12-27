-- =====================================================
-- ATIVAR TODAS AS IAs GROQ E ATUALIZAR MODELOS
-- Execute no Supabase SQL Editor
-- =====================================================
-- 1. Ativar TODAS as IAs Groq
UPDATE "GlobalAiConnection"
SET "isActive" = true
WHERE "provider" = 'GROQ';
-- 2. Atualizar qualquer modelo 3.1 para 3.3 (deprecado → ativo)
UPDATE "GlobalAiConnection"
SET "model" = 'llama-3.3-70b-versatile'
WHERE "provider" = 'GROQ'
    AND "model" = 'llama-3.1-70b-versatile';
-- 3. Verificar resultado
SELECT "name",
    "aiRole",
    "isActive",
    "model"
FROM "GlobalAiConnection"
WHERE "provider" = 'GROQ'
ORDER BY CASE
        "aiRole"
        WHEN 'REASONING' THEN 1
        WHEN 'EXECUTOR' THEN 2
        WHEN 'GENERAL' THEN 3
        ELSE 4
    END;
-- Resultado esperado:
-- Grok Thinker    | REASONING  | true | llama-3.3-70b-versatile
-- Grok Executor   | EXECUTOR   | true | llama-3.3-70b-versatile
-- Grok Critic     | GENERAL    | true | llama-3.1-8b-instant (OK, 8B)
-- Grok Navegador  | [role]     | true | llama-3.3-70b-versatile