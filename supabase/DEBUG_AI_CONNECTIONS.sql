-- Verificar IAs Groq instaladas no banco
-- Execute no Supabase SQL Editor
SELECT "id",
    "name",
    "provider",
    "aiRole",
    "isActive",
    "model"
FROM "GlobalAiConnection"
WHERE "provider" = 'GROQ'
ORDER BY "aiRole";
-- Se não retornar nada, tente:
SELECT "id",
    "name",
    "provider",
    "aiRole",
    "isActive",
    "model"
FROM "GlobalAiConnection"
WHERE "provider" ILIKE '%groq%'
ORDER BY "aiRole";
-- Ver TODAS as IAs (para debug):
SELECT "id",
    "name",
    "provider",
    "aiRole",
    "isActive"
FROM "GlobalAiConnection"
ORDER BY "provider",
    "aiRole";