-- ==========================================
-- SYNCADS EXTENSION - DATABASE SCHEMA
-- Script simplificado para criar tabelas
-- Execute no SQL Editor do Supabase
-- Data: 17/01/2025
-- ==========================================

-- ==========================================
-- LIMPEZA (opcional - comentar em produção)
-- ==========================================
-- DROP TABLE IF EXISTS extension_logs CASCADE;
-- DROP TABLE IF EXISTS extension_commands CASCADE;
-- DROP TABLE IF EXISTS extension_devices CASCADE;

-- ==========================================
-- TABELA 1: extension_devices
-- Dispositivos com extensão Chrome instalada
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_info JSONB DEFAULT '{}',
  version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_devices_user_id ON extension_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_devices_device_id ON extension_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_extension_devices_status ON extension_devices(status);
CREATE INDEX IF NOT EXISTS idx_extension_devices_last_seen ON extension_devices(last_seen DESC);

-- RLS (Row Level Security)
ALTER TABLE extension_devices ENABLE ROW LEVEL SECURITY;

-- Política: Service role tem acesso total
DROP POLICY IF EXISTS "Service role full access on devices" ON extension_devices;
CREATE POLICY "Service role full access on devices"
  ON extension_devices FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- TABELA 2: extension_commands
-- Comandos para execução na extensão
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_commands_device_id ON extension_commands(device_id);
CREATE INDEX IF NOT EXISTS idx_extension_commands_user_id ON extension_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_commands_status ON extension_commands(status);
CREATE INDEX IF NOT EXISTS idx_extension_commands_created_at ON extension_commands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extension_commands_priority ON extension_commands(priority DESC);

-- Índice composto para busca de comandos pendentes
CREATE INDEX IF NOT EXISTS idx_extension_commands_pending
  ON extension_commands(device_id, status, priority DESC)
  WHERE status = 'pending';

-- RLS (Row Level Security)
ALTER TABLE extension_commands ENABLE ROW LEVEL SECURITY;

-- Política: Service role tem acesso total
DROP POLICY IF EXISTS "Service role full access on commands" ON extension_commands;
CREATE POLICY "Service role full access on commands"
  ON extension_commands FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- TABELA 3: extension_logs
-- Logs de atividade da extensão
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_logs_device_id ON extension_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_extension_logs_user_id ON extension_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_logs_level ON extension_logs(level);
CREATE INDEX IF NOT EXISTS idx_extension_logs_created_at ON extension_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extension_logs_recent ON extension_logs(user_id, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE extension_logs ENABLE ROW LEVEL SECURITY;

-- Política: Service role tem acesso total
DROP POLICY IF EXISTS "Service role full access on logs" ON extension_logs;
CREATE POLICY "Service role full access on logs"
  ON extension_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_extension_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_extension_devices_updated_at ON extension_devices;
CREATE TRIGGER trigger_update_extension_devices_updated_at
  BEFORE UPDATE ON extension_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_extension_devices_updated_at();

-- ==========================================
-- FUNÇÕES ÚTEIS
-- ==========================================

-- Função para limpar logs antigos (executar manualmente ou via cron)
CREATE OR REPLACE FUNCTION cleanup_old_extension_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  deleted BIGINT;
BEGIN
  DELETE FROM extension_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted = ROW_COUNT;

  RETURN QUERY SELECT deleted;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de dispositivo
CREATE OR REPLACE FUNCTION get_device_stats(p_device_id TEXT)
RETURNS TABLE(
  total_commands BIGINT,
  pending_commands BIGINT,
  completed_commands BIGINT,
  failed_commands BIGINT,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_commands,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_commands,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_commands,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_commands,
    MAX(created_at) as last_activity
  FROM extension_commands
  WHERE device_id = p_device_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================
DO $$
DECLARE
  v_devices_exists BOOLEAN;
  v_commands_exists BOOLEAN;
  v_logs_exists BOOLEAN;
BEGIN
  -- Verificar se as tabelas existem
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'extension_devices'
  ) INTO v_devices_exists;

  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'extension_commands'
  ) INTO v_commands_exists;

  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'extension_logs'
  ) INTO v_logs_exists;

  -- Exibir resultados
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ VERIFICAÇÃO DE TABELAS';
  RAISE NOTICE '==========================================';

  IF v_devices_exists THEN
    RAISE NOTICE '  ✓ extension_devices criada';
  ELSE
    RAISE NOTICE '  ✗ extension_devices NÃO CRIADA';
  END IF;

  IF v_commands_exists THEN
    RAISE NOTICE '  ✓ extension_commands criada';
  ELSE
    RAISE NOTICE '  ✗ extension_commands NÃO CRIADA';
  END IF;

  IF v_logs_exists THEN
    RAISE NOTICE '  ✓ extension_logs criada';
  ELSE
    RAISE NOTICE '  ✗ extension_logs NÃO CRIADA';
  END IF;

  RAISE NOTICE '==========================================';
  RAISE NOTICE '';

  IF v_devices_exists AND v_commands_exists AND v_logs_exists THEN
    RAISE NOTICE '🎉 Todas as tabelas foram criadas com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Verifique as variáveis de ambiente no Railway';
    RAISE NOTICE '2. Faça deploy do backend Python';
    RAISE NOTICE '3. Recarregue a extensão Chrome';
    RAISE NOTICE '4. Teste a conexão';
  ELSE
    RAISE NOTICE '⚠️ Algumas tabelas não foram criadas. Verifique os erros acima.';
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- COMANDOS ÚTEIS PARA TESTE
-- ==========================================

-- Ver dispositivos registrados:
-- SELECT * FROM extension_devices ORDER BY last_seen DESC;

-- Ver comandos pendentes:
-- SELECT * FROM extension_commands WHERE status = 'pending' ORDER BY priority DESC, created_at ASC;

-- Ver logs recentes:
-- SELECT * FROM extension_logs ORDER BY created_at DESC LIMIT 20;

-- Ver estatísticas de um dispositivo:
-- SELECT * FROM get_device_stats('seu-device-id-aqui');

-- Limpar logs antigos (mais de 30 dias):
-- SELECT * FROM cleanup_old_extension_logs(30);
