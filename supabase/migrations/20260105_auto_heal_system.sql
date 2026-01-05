-- Migration: Tabelas para Sistema de Auto-Diagnóstico e Auto-Correção
-- Criado em: 2026-01-05
-- =============================================================================
-- TABELA: error_diagnoses
-- Armazena diagnósticos de erros para aprendizado contínuo
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.error_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_message TEXT NOT NULL,
    error_type TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    suggested_fix TEXT NOT NULL,
    auto_fixable BOOLEAN DEFAULT false,
    severity TEXT CHECK (
        severity IN ('low', 'medium', 'high', 'critical')
    ),
    context JSONB DEFAULT '{}'::jsonb,
    diagnosed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Índices para busca rápida
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_error_diagnoses_error_type ON public.error_diagnoses(error_type);
CREATE INDEX IF NOT EXISTS idx_error_diagnoses_severity ON public.error_diagnoses(severity);
CREATE INDEX IF NOT EXISTS idx_error_diagnoses_diagnosed_at ON public.error_diagnoses(diagnosed_at DESC);
-- =============================================================================
-- TABELA: healing_actions
-- Registra ações de correção aplicadas automaticamente
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.healing_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type TEXT NOT NULL,
    command_id UUID REFERENCES public.extension_commands(id) ON DELETE CASCADE,
    device_id TEXT,
    action TEXT NOT NULL,
    success BOOLEAN DEFAULT false,
    context JSONB DEFAULT '{}'::jsonb,
    healed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_healing_actions_error_type ON public.healing_actions(error_type);
CREATE INDEX IF NOT EXISTS idx_healing_actions_command_id ON public.healing_actions(command_id);
CREATE INDEX IF NOT EXISTS idx_healing_actions_healed_at ON public.healing_actions(healed_at DESC);
CREATE INDEX IF NOT EXISTS idx_healing_actions_success ON public.healing_actions(success);
-- =============================================================================
-- TABELA: auto_heal_stats
-- Estatísticas agregadas do sistema de auto-correção
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.auto_heal_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type TEXT NOT NULL UNIQUE,
    total_occurrences INTEGER DEFAULT 0,
    total_healed INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN total_occurrences > 0 THEN (
                total_healed::DECIMAL / total_occurrences::DECIMAL
            ) * 100
            ELSE 0
        END
    ) STORED,
    last_occurrence TIMESTAMP WITH TIME ZONE,
    last_successful_heal TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índice
CREATE INDEX IF NOT EXISTS idx_auto_heal_stats_success_rate ON public.auto_heal_stats(success_rate DESC);
-- =============================================================================
-- FUNCTION: Atualizar estatísticas automaticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION update_auto_heal_stats() RETURNS TRIGGER AS $$ BEGIN -- Inserir ou atualizar estatísticas
INSERT INTO public.auto_heal_stats (
        error_type,
        total_occurrences,
        total_healed,
        total_failed,
        last_occurrence,
        last_successful_heal
    )
VALUES (
        NEW.error_type,
        1,
        CASE
            WHEN NEW.success THEN 1
            ELSE 0
        END,
        CASE
            WHEN NOT NEW.success THEN 1
            ELSE 0
        END,
        NEW.healed_at,
        CASE
            WHEN NEW.success THEN NEW.healed_at
            ELSE NULL
        END
    ) ON CONFLICT (error_type) DO
UPDATE
SET total_occurrences = auto_heal_stats.total_occurrences + 1,
    total_healed = auto_heal_stats.total_healed + CASE
        WHEN NEW.success THEN 1
        ELSE 0
    END,
    total_failed = auto_heal_stats.total_failed + CASE
        WHEN NOT NEW.success THEN 1
        ELSE 0
    END,
    last_occurrence = NEW.healed_at,
    last_successful_heal = CASE
        WHEN NEW.success THEN NEW.healed_at
        ELSE auto_heal_stats.last_successful_heal
    END,
    updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger para atualizar stats automaticamente
DROP TRIGGER IF EXISTS trigger_update_auto_heal_stats ON public.healing_actions;
CREATE TRIGGER trigger_update_auto_heal_stats
AFTER
INSERT ON public.healing_actions FOR EACH ROW EXECUTE FUNCTION update_auto_heal_stats();
-- =============================================================================
-- RLS POLICIES
-- =============================================================================
-- error_diagnoses: público para leitura (para análise), service_role para escrita
ALTER TABLE public.error_diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service_role to insert error_diagnoses" ON public.error_diagnoses FOR
INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow authenticated users to read error_diagnoses" ON public.error_diagnoses FOR
SELECT TO authenticated USING (true);
-- healing_actions: público para leitura, service_role para escrita
ALTER TABLE public.healing_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service_role to insert healing_actions" ON public.healing_actions FOR
INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow authenticated users to read healing_actions" ON public.healing_actions FOR
SELECT TO authenticated USING (true);
-- auto_heal_stats: público para leitura
ALTER TABLE public.auto_heal_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read auto_heal_stats" ON public.auto_heal_stats FOR
SELECT TO authenticated USING (true);
-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================
COMMENT ON TABLE public.error_diagnoses IS 'Armazena diagnósticos de erros para aprendizado contínuo do sistema';
COMMENT ON TABLE public.healing_actions IS 'Registra ações de correção automática aplicadas';
COMMENT ON TABLE public.auto_heal_stats IS 'Estatísticas agregadas do sistema de auto-correção';