-- =====================================================
-- ATIVAR IAs GROQ NO GLOBALAICONNECTION
-- Execute no Supabase SQL Editor
-- =====================================================
-- Ativar TODAS as 3 IAs Groq
UPDATE "GlobalAiConnection"
SET "isActive" = true,
    "updatedAt" = NOW()
WHERE "provider" = 'GROQ';
-- Verificar resultado
SELECT "name",
    "provider",
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
    END;
-- Resultado esperado: Todas com isActive = true