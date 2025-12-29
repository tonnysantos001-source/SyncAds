-- =====================================================
-- MIGRATION: Adicionar Campos de Evidência Playwright
-- Data: 2025-12-29
-- Objetivo: Provar execução real com dados técnicos
-- =====================================================
-- 1. Adicionar campos de evidência ao action_results
ALTER TABLE public.action_results
ADD COLUMN IF NOT EXISTS executor_type TEXT DEFAULT 'playwright',
    ADD COLUMN IF NOT EXISTS playwright_url TEXT,
    ADD COLUMN IF NOT EXISTS playwright_title TEXT,
    ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
-- 2. Índice para filtrar por executor
CREATE INDEX IF NOT EXISTS idx_action_results_executor ON public.action_results(executor_type);
-- 3. Comentários descritivos
COMMENT ON COLUMN public.action_results.executor_type IS 'Tipo de executor: playwright (único válido após 2025-12-29)';
COMMENT ON COLUMN public.action_results.playwright_url IS 'URL final após execução Playwright (evidência)';
COMMENT ON COLUMN public.action_results.playwright_title IS 'Título da página após execução (evidência)';
COMMENT ON COLUMN public.action_results.screenshot_url IS 'URL do screenshot de prova no Supabase Storage (se disponível)';
-- 4. Verificação
DO $$ BEGIN RAISE NOTICE '✅ Migration completa: Campos de evidência Playwright adicionados';
RAISE NOTICE '   - executor_type (DEFAULT: playwright)';
RAISE NOTICE '   - playwright_url';
RAISE NOTICE '   - playwright_title';
RAISE NOTICE '   - screenshot_url';
END $$;