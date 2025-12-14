-- ==========================================
-- AI DATABASE LOGS TABLE
-- Registra todas as operações da IA no banco
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_database_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    -- Detalhes da operação
    action TEXT NOT NULL CHECK (
        action IN ('query', 'insert', 'update', 'delete', 'schema')
    ),
    table_name TEXT,
    query TEXT,
    params JSONB,
    -- Resultado
    result JSONB,
    error TEXT,
    duration_ms INTEGER NOT NULL,
    -- Segurança
    risk_level TEXT NOT NULL CHECK (
        risk_level IN ('low', 'medium', 'high', 'critical')
    ),
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES "User"(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_db_logs_user_id ON ai_database_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_db_logs_action ON ai_database_logs(action);
CREATE INDEX IF NOT EXISTS idx_ai_db_logs_risk_level ON ai_database_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_db_logs_created_at ON ai_database_logs(created_at DESC);
-- RLS (Row Level Security)
ALTER TABLE ai_database_logs ENABLE ROW LEVEL SECURITY;
-- Policy: SUPER_ADMIN pode ver tudo
CREATE POLICY "SUPER_ADMIN can view all logs" ON ai_database_logs FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM "User"
            WHERE "User".id = auth.uid()
                AND "User".role = 'SUPER_ADMIN'
        )
    );
-- Policy: Usuarios podem ver apenas seus próprios logs
CREATE POLICY "Users can view their own logs" ON ai_database_logs FOR
SELECT TO authenticated USING (user_id = auth.uid());
-- Policy: Apenas sistema pode inserir
CREATE POLICY "System can insert logs" ON ai_database_logs FOR
INSERT TO authenticated WITH CHECK (true);
-- ==========================================
-- FUNÇÃO SQL PARA EXECUTAR QUERIES
-- Com timeout e segurança
-- ==========================================
CREATE OR REPLACE FUNCTION execute_sql_query(
        query_text TEXT,
        timeout_seconds INTEGER DEFAULT 5
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSONB;
BEGIN -- Set timeout
EXECUTE format(
    'SET LOCAL statement_timeout = %s',
    timeout_seconds * 1000
);
-- Execute query
EXECUTE query_text INTO result;
RETURN result;
EXCEPTION
WHEN OTHERS THEN RAISE EXCEPTION 'Query execution failed: %',
SQLERRM;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION execute_sql_query(TEXT, INTEGER) TO authenticated;
-- ==========================================
-- AI GENERATED GATEWAYS TABLE
-- Para gateways criados automaticamente pela IA
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_generated_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Informações básicas
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN (
            'PIX',
            'CREDIT_CARD',
            'BOLETO',
            'WALLET',
            'OTHER'
        )
    ),
    status TEXT DEFAULT 'PENDING_REVIEW' CHECK (
        status IN (
            'DRAFT',
            'PENDING_REVIEW',
            'APPROVED',
            'REJECTED',
            'ARCHIVED'
        )
    ),
    -- Código gerado pela IA
    implementation JSONB NOT NULL,
    tests JSONB,
    -- Documentação original
    documentation TEXT,
    ai_analysis TEXT,
    -- Controle de qualidade
    test_results JSONB,
    security_scan JSONB,
    -- Comunidade
    is_public BOOLEAN DEFAULT false,
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    -- Metadados
    created_by_ai BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Aprovação
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES "User"(id),
    rejection_reason TEXT,
    -- Tracking de uso
    usage_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_gateways_status ON ai_generated_gateways(status);
CREATE INDEX IF NOT EXISTS idx_ai_gateways_type ON ai_generated_gateways(type);
CREATE INDEX IF NOT EXISTS idx_ai_gateways_public ON ai_generated_gateways(
    is_public
    WHERE is_public = true
);
CREATE INDEX IF NOT EXISTS idx_ai_gateways_rating ON ai_generated_gateways(rating DESC)
WHERE is_public = true;
-- RLS
ALTER TABLE ai_generated_gateways ENABLE ROW LEVEL SECURITY;
-- Policy: Todos podem ver gateways públicos aprovados
CREATE POLICY "Public can view approved gateways" ON ai_generated_gateways FOR
SELECT TO authenticated USING (
        is_public = true
        AND status = 'APPROVED'
    );
-- Policy: SUPER_ADMIN pode ver tudo
CREATE POLICY "SUPER_ADMIN can view all gateways" ON ai_generated_gateways FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM "User"
            WHERE "User".id = auth.uid()
                AND "User".role = 'SUPER_ADMIN'
        )
    );
-- Policy: SUPER_ADMIN pode inserir
CREATE POLICY "SUPER_ADMIN can insert gateways" ON ai_generated_gateways FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "User"
            WHERE "User".id = auth.uid()
                AND "User".role = 'SUPER_ADMIN'
        )
    );
-- Policy: SUPER_ADMIN pode atualizar
CREATE POLICY "SUPER_ADMIN can update gateways" ON ai_generated_gateways FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM "User"
            WHERE "User".id = auth.uid()
                AND "User".role = 'SUPER_ADMIN'
        )
    );
-- ==========================================
-- SYSTEM PROMPT VERSIONS TABLE
-- Versionamento de prompts
-- ==========================================
CREATE TABLE IF NOT EXISTS system_prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Versão (semver: 1.0.0, 1.1.0, 2.0.0)
    version TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    -- Mudanças
    changes JSONB,
    metadata JSONB,
    -- Status
    status TEXT DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'ARCHIVED')
    ),
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES "User"(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES "User"(id),
    -- Métricas de performance
    performance_score DECIMAL(3, 2),
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3, 2),
    avg_response_time_ms INTEGER
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_prompt_versions_status ON system_prompt_versions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_version ON system_prompt_versions(version);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_at ON system_prompt_versions(created_at DESC);
-- RLS
ALTER TABLE system_prompt_versions ENABLE ROW LEVEL SECURITY;
-- Policy: Todos autenticados podem ver prompts ativos
CREATE POLICY "Authenticated can view active prompts" ON system_prompt_versions FOR
SELECT TO authenticated USING (status = 'ACTIVE');
-- Policy: SUPER_ADMIN pode ver tudo
CREATE POLICY "SUPER_ADMIN can view all prompts" ON system_prompt_versions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM "User"
            WHERE "User".id = auth.uid()
                AND "User".role = 'SUPER_ADMIN'
        )
    );
-- Policy: SUPER_ADMIN pode inserir
CREATE POLICY "SUPER_ADMIN can insert prompts" ON system_prompt_versions FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "User"
            WHERE "User".id = auth.uid()
                AND "User".role = 'SUPER_ADMIN'
        )
    );
-- Policy: SUPER_ADMIN pode atualizar
CREATE POLICY "SUPER_ADMIN can update prompts" ON system_prompt_versions FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM "User"
            WHERE "User".id = auth.uid()
                AND "User".role = 'SUPER_ADMIN'
        )
    );
-- ==========================================
-- CODEBASE KNOWLEDGE TABLE
-- Conhecimento sobre o código
-- ==========================================
CREATE TABLE IF NOT EXISTS codebase_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Snapshot do código
    frontend_map JSONB NOT NULL,
    backend_map JSONB NOT NULL,
    capabilities JSONB NOT NULL,
    -- Metadados
    git_commit_hash TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scan_duration_ms INTEGER,
    -- Stats
    total_files INTEGER,
    total_lines INTEGER,
    components_count INTEGER,
    functions_count INTEGER,
    tables_count INTEGER,
    -- Status
    is_current BOOLEAN DEFAULT false
);
-- Índice
CREATE INDEX IF NOT EXISTS idx_codebase_knowledge_current ON codebase_knowledge(is_current)
WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_codebase_knowledge_scanned_at ON codebase_knowledge(scanned_at DESC);
-- RLS
ALTER TABLE codebase_knowledge ENABLE ROW LEVEL SECURITY;
-- Policy: Todos autenticados podem ver
CREATE POLICY "Authenticated can view codebase knowledge" ON codebase_knowledge FOR
SELECT TO authenticated USING (is_current = true);
-- Policy: Apenas SUPER_ADMIN pode inserir
CREATE POLICY "SUPER_ADMIN can insert codebase knowledge" ON codebase_knowledge FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "User"
            WHERE "User".id = auth.uid()
                AND "User".role = 'SUPER_ADMIN'
        )
    );
-- ==========================================
-- TRIGGER para updated_at automático
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_ai_gateways_updated_at BEFORE
UPDATE ON ai_generated_gateways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();