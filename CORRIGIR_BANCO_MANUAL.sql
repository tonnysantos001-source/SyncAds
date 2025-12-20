-- ============================================
-- SCRIPT DE CORREÇÃO - Execute no Supabase SQL Editor
-- Link: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/editor
-- ============================================
-- PASSO 1: Adicionar coluna aiRole se não existir
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'GlobalAiConnection'
        AND column_name = 'aiRole'
) THEN
ALTER TABLE "GlobalAiConnection"
ADD COLUMN "aiRole" TEXT DEFAULT 'GENERAL' CHECK (
        "aiRole" IN ('REASONING', 'EXECUTOR', 'NAVIGATOR', 'GENERAL')
    );
-- Adicionar comentário
COMMENT ON COLUMN "GlobalAiConnection"."aiRole" IS 'Função da IA no sistema multi-agente';
-- Criar índice
CREATE INDEX IF NOT EXISTS idx_globalaiconnection_airole ON "GlobalAiConnection" ("aiRole");
RAISE NOTICE 'Coluna aiRole adicionada com sucesso!';
ELSE RAISE NOTICE 'Coluna aiRole já existe.';
END IF;
END $$;
-- PASSO 2: Limpar IAs duplicadas/antigas do Grok (se existirem)
DELETE FROM "GlobalAiConnection"
WHERE "provider" = 'GROQ';
-- PASSO 3: Verificar estrutura da tabela
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'GlobalAiConnection'
ORDER BY ordinal_position;
-- ============================================
-- RESULTADO ESPERADO:
-- ✅ Coluna aiRole adicionada
-- ✅ Índice criado
-- ✅ IAs antigas removidas
-- ✅ Tabela pronta para receber novas IAs
-- ============================================
-- DEPOIS DE EXECUTAR ESTE SCRIPT:
-- 1. Faça refresh no painel Super Admin (Ctrl+Shift+R)
-- 2. Adicione as 3 IAs manualmente usando os dados que passei