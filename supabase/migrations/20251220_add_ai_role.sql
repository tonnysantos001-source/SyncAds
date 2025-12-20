-- Migration: Adicionar coluna aiRole à tabela GlobalAiConnection
-- Autor: Antigravity AI
-- Data: 2025-12-20
-- Descrição: Adiciona campo para identificar a função de cada IA no sistema multi-agente
-- Adicionar coluna aiRole com constraint CHECK
ALTER TABLE "GlobalAiConnection"
ADD COLUMN IF NOT EXISTS "aiRole" TEXT DEFAULT 'GENERAL' CHECK (
        "aiRole" IN ('REASONING', 'EXECUTOR', 'NAVIGATOR', 'GENERAL')
    );
-- Criar comentário na coluna para documentação
COMMENT ON COLUMN "GlobalAiConnection"."aiRole" IS 'Função da IA no sistema multi-agente: REASONING (raciocínio), EXECUTOR (execução de ações), NAVIGATOR (navegação/browser), GENERAL (uso geral)';
-- Atualizar IAs existentes baseado no nome/modelo
-- IAs de Raciocínio (Claude, GPT-4, etc.)
UPDATE "GlobalAiConnection"
SET "aiRole" = 'REASONING'
WHERE (
        "name" ILIKE '%raciocinio%'
        OR "name" ILIKE '%reasoning%'
        OR "name" ILIKE '%think%'
        OR "name" ILIKE '%claude%'
        OR "model" ILIKE '%claude%'
        OR "model" ILIKE '%gpt-4%'
    )
    AND "aiRole" = 'GENERAL';
-- IAs Executoras (para tool calling, ações)
UPDATE "GlobalAiConnection"
SET "aiRole" = 'EXECUTOR'
WHERE (
        "name" ILIKE '%executor%'
        OR "name" ILIKE '%action%'
        OR "name" ILIKE '%tool%'
        OR "name" ILIKE '%execut%'
    )
    AND "aiRole" = 'GENERAL';
-- IAs de Navegação (browser automation)
UPDATE "GlobalAiConnection"
SET "aiRole" = 'NAVIGATOR'
WHERE (
        "name" ILIKE '%navegador%'
        OR "name" ILIKE '%browser%'
        OR "name" ILIKE '%navigator%'
        OR "name" ILIKE '%navega%'
    )
    AND "aiRole" = 'GENERAL';
-- Criar índice para melhorar performance de queries por role
CREATE INDEX IF NOT EXISTS idx_global_ai_connection_role ON "GlobalAiConnection"("aiRole");
-- Verificar resultado
SELECT "aiRole",
    COUNT(*) as total,
    STRING_AGG("name", ', ') as ias
FROM "GlobalAiConnection"
GROUP BY "aiRole"
ORDER BY "aiRole";