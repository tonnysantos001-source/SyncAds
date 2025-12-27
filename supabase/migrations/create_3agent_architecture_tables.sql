--
-- =====================================================
-- SUPABASE MIGRATIONS — ARQUITETURA 3-AGENT
-- =====================================================
-- 
-- Cria todas as tabelas necessárias para suportar:
-- - Action Router
-- - Logs persistentes
-- - Resultados de ações
-- - Verificações de execução
-- 
-- Execute no Supabase SQL Editor
-- =====================================================
-- =====================================================
-- 1. TABELA: action_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    message TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_action_logs_session ON public.action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON public.action_logs(created_at DESC);
COMMENT ON TABLE public.action_logs IS 'Logs persistentes de todas as ações executadas pelo Action Router';
-- =====================================================
-- 2. TABELA: action_results
-- =====================================================
CREATE TABLE IF NOT EXISTS public.action_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    result JSONB,
    error TEXT,
    execution_time INTEGER,
    -- em milissegundos
    logs JSONB,
    screenshot TEXT,
    -- base64 encoded
    verification JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_action_results_session ON public.action_results(session_id);
CREATE INDEX IF NOT EXISTS idx_action_results_user ON public.action_results(user_id);
CREATE INDEX IF NOT EXISTS idx_action_results_created ON public.action_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_results_success ON public.action_results(success);
COMMENT ON TABLE public.action_results IS 'Resultados de todas as ações executadas via Action Router';
-- =====================================================
-- 3. TABELA: planner_outputs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.planner_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    conversation_id UUID,
    user_message TEXT NOT NULL,
    plan JSONB NOT NULL,
    planner_model TEXT,
    planner_temperature FLOAT,
    planner_response_raw TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_planner_outputs_session ON public.planner_outputs(session_id);
CREATE INDEX IF NOT EXISTS idx_planner_outputs_user ON public.planner_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_outputs_conversation ON public.planner_outputs(conversation_id);
COMMENT ON TABLE public.planner_outputs IS 'Todos os planos gerados pelo Planner AI';
-- =====================================================
-- 4. TABELA: executor_outputs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.executor_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    conversation_id UUID,
    action_results JSONB NOT NULL,
    executor_response TEXT NOT NULL,
    executor_model TEXT,
    executor_temperature FLOAT,
    was_honest BOOLEAN DEFAULT true,
    honesty_score FLOAT,
    -- 0-1, se implementarmos validação
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_executor_outputs_session ON public.executor_outputs(session_id);
CREATE INDEX IF NOT EXISTS idx_executor_outputs_user ON public.executor_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_executor_outputs_conversation ON public.executor_outputs(conversation_id);
COMMENT ON TABLE public.executor_outputs IS 'Todas as respostas geradas pelo Executor AI';
-- =====================================================
-- 5. ALTERAR TABELA EXISTENTE: ChatMessage
-- =====================================================
-- Adicionar campo metadata se não existir
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ChatMessage'
        AND column_name = 'metadata'
) THEN
ALTER TABLE public."ChatMessage"
ADD COLUMN metadata JSONB;
END IF;
END $$;
COMMENT ON COLUMN public."ChatMessage".metadata IS 'Inclui plan, actionResults, sessionId da execução';
-- =====================================================
-- 6. TABELA: browser_sessions (para Playwright/Selenium)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.browser_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'closed', 'error')),
    browser_type TEXT NOT NULL CHECK (
        browser_type IN (
            'playwright',
            'selenium',
            'puppeteer',
            'extension'
        )
    ),
    playwright_session_id TEXT,
    -- ID da sessão no Hugging Face
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_session ON public.browser_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_user ON public.browser_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_status ON public.browser_sessions(status);
COMMENT ON TABLE public.browser_sessions IS 'Sessões ativas de browser automation (Playwright, Selenium, Extension)';
-- =====================================================
-- 7. VIEW: execution_audit_trail
-- =====================================================
CREATE OR REPLACE VIEW public.execution_audit_trail AS
SELECT ar.session_id,
    ar.user_id,
    po.user_message,
    po.plan,
    ar.action,
    ar.success,
    ar.result,
    ar.error,
    ar.execution_time,
    ar.verification,
    eo.executor_response,
    eo.was_honest,
    ar.created_at as executed_at
FROM public.action_results ar
    LEFT JOIN public.planner_outputs po ON ar.session_id = po.session_id
    LEFT JOIN public.executor_outputs eo ON ar.session_id = eo.session_id
ORDER BY ar.created_at DESC;
COMMENT ON VIEW public.execution_audit_trail IS 'Visão completa de todas as execuções: Planner → Action → Executor';
-- =====================================================
-- 8. FUNCTION: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger para browser_sessions
DROP TRIGGER IF EXISTS trigger_update_browser_sessions ON public.browser_sessions;
CREATE TRIGGER trigger_update_browser_sessions BEFORE
UPDATE ON public.browser_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- =====================================================
-- 9. RLS (Row Level Security)
-- =====================================================
-- Habilitar RLS
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executor_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browser_sessions ENABLE ROW LEVEL SECURITY;
-- Políticas: Usuários só veem seus próprios dados
CREATE POLICY "Users can view own action_results" ON public.action_results FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own planner_outputs" ON public.planner_outputs FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own executor_outputs" ON public.executor_outputs FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own browser_sessions" ON public.browser_sessions FOR
SELECT USING (auth.uid() = user_id);
-- Service role pode fazer tudo
CREATE POLICY "Service role full access action_logs" ON public.action_logs USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access action_results" ON public.action_results USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access planner_outputs" ON public.planner_outputs USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access executor_outputs" ON public.executor_outputs USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access browser_sessions" ON public.browser_sessions USING (auth.role() = 'service_role');
-- =====================================================
-- 10. SEED DATA (Opcional)
-- =====================================================
-- Exemplo de GlobalAiConnection para Groq (se não existir)
INSERT INTO public."GlobalAiConnection" (
        provider,
        apiKey,
        isActive,
        model,
        temperature,
        metadata
    )
VALUES (
        'groq',
        'YOUR_GROQ_API_KEY_HERE',
        -- ⚠️ SUBSTITUIR!
        true,
        'llama-3.3-70b-versatile',
        0.7,
        jsonb_build_object(
            'planner_model',
            'llama-3.3-70b-versatile',
            'executor_model',
            'llama-3.3-70b-versatile',
            'planner_temperature',
            0.3,
            'executor_temperature',
            0.7
        )
    ) ON CONFLICT (provider) DO
UPDATE
SET isActive = EXCLUDED.isActive,
    model = EXCLUDED.model,
    temperature = EXCLUDED.temperature,
    metadata = EXCLUDED.metadata;
-- =====================================================
-- ✅ MIGRATION COMPLETA
-- =====================================================
-- Verificar se tudo foi criado
SELECT 'Tables:' as type,
    tablename as name
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'action_logs',
        'action_results',
        'planner_outputs',
        'executor_outputs',
        'browser_sessions'
    )
UNION ALL
SELECT 'Views:' as type,
    viewname as name
FROM pg_views
WHERE schemaname = 'public'
    AND viewname = 'execution_audit_trail';
-- =====================================================
-- OBSERVAÇÕES
-- =====================================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Substitua YOUR_GROQ_API_KEY_HERE pela chave real
-- 3. Verifique se GlobalAiConnection já existe antes do SEED
-- 4. Logs são permanentes - considere policy de retenção
-- 5. Screenshots em base64 podem ficar grandes - migrar para storage se necessário
-- =====================================================
-- QUERIES ÚTEIS PARA DEBUG
-- =====================================================
-- Ver últimas execuções
-- SELECT * FROM execution_audit_trail ORDER BY executed_at DESC LIMIT 10;
-- Ver logs de uma sessão específica
-- SELECT * FROM action_logs WHERE session_id = 'SESSION_ID' ORDER BY created_at;
-- Ver taxa de sucesso por ação
-- SELECT 
--   action, 
--   COUNT(*) as total,
--   SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
--   ROUND(AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100, 2) as success_rate
-- FROM action_results
-- GROUP BY action;