-- ==========================================
-- SYNCADS EXTENSION - DATABASE SCHEMA
-- Tabelas para comunicação com Chrome Extension
-- Data: 16/01/2025
-- Versão: 1.0.0
-- ==========================================

-- ==========================================
-- TABELA 1: EXTENSION_DEVICES
-- Armazena dispositivos registrados
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_info JSONB,
  version TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_devices_user_id ON extension_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_devices_device_id ON extension_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_extension_devices_status ON extension_devices(status);
CREATE INDEX IF NOT EXISTS idx_extension_devices_last_seen ON extension_devices(last_seen DESC);

-- Comentários
COMMENT ON TABLE extension_devices IS 'Dispositivos com extensão Chrome instalada';
COMMENT ON COLUMN extension_devices.device_id IS 'ID único gerado pela extensão';
COMMENT ON COLUMN extension_devices.browser_info IS 'Informações do navegador (userAgent, etc)';
COMMENT ON COLUMN extension_devices.status IS 'Status da conexão: online, offline, error';

-- RLS (Row Level Security)
ALTER TABLE extension_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own devices" ON extension_devices;
CREATE POLICY "Users can view their own devices"
  ON extension_devices FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own devices" ON extension_devices;
CREATE POLICY "Users can insert their own devices"
  ON extension_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own devices" ON extension_devices;
CREATE POLICY "Users can update their own devices"
  ON extension_devices FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can do anything on devices" ON extension_devices;
CREATE POLICY "Service role can do anything on devices"
  ON extension_devices FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ==========================================
-- TABELA 2: EXTENSION_COMMANDS
-- Armazena comandos a serem executados
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES extension_devices(device_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('DOM_READ', 'DOM_CLICK', 'DOM_FILL', 'DOM_SCROLL', 'NAVIGATE', 'WAIT', 'SCREENSHOT', 'LOG')),
  selector TEXT,
  value TEXT,
  options JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'timeout')),
  result JSONB,
  error_message TEXT,
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_commands_device_id ON extension_commands(device_id);
CREATE INDEX IF NOT EXISTS idx_extension_commands_user_id ON extension_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_commands_status ON extension_commands(status);
CREATE INDEX IF NOT EXISTS idx_extension_commands_created_at ON extension_commands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extension_commands_priority ON extension_commands(priority DESC);
CREATE INDEX IF NOT EXISTS idx_extension_commands_expires_at ON extension_commands(expires_at);

-- Índice composto para busca de comandos pendentes
CREATE INDEX IF NOT EXISTS idx_extension_commands_pending ON extension_commands(device_id, status, priority DESC)
  WHERE status = 'pending';

-- Comentários
COMMENT ON TABLE extension_commands IS 'Comandos para execução na extensão Chrome';
COMMENT ON COLUMN extension_commands.type IS 'Tipo de comando: DOM_READ, DOM_CLICK, DOM_FILL, etc';
COMMENT ON COLUMN extension_commands.selector IS 'Seletor CSS/XPath do elemento alvo';
COMMENT ON COLUMN extension_commands.options IS 'Opções adicionais do comando (JSON)';
COMMENT ON COLUMN extension_commands.status IS 'Status: pending, processing, completed, failed, timeout';
COMMENT ON COLUMN extension_commands.priority IS 'Prioridade (maior = executa primeiro)';
COMMENT ON COLUMN extension_commands.expires_at IS 'Data de expiração do comando';

-- RLS (Row Level Security)
ALTER TABLE extension_commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own commands" ON extension_commands;
CREATE POLICY "Users can view their own commands"
  ON extension_commands FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own commands" ON extension_commands;
CREATE POLICY "Users can insert their own commands"
  ON extension_commands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own commands" ON extension_commands;
CREATE POLICY "Users can update their own commands"
  ON extension_commands FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can do anything on commands" ON extension_commands;
CREATE POLICY "Service role can do anything on commands"
  ON extension_commands FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ==========================================
-- TABELA 3: EXTENSION_LOGS
-- Armazena logs de execução
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  command_id UUID REFERENCES extension_commands(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  message TEXT,
  data JSONB,
  url TEXT,
  result JSONB,
  level TEXT DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_logs_device_id ON extension_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_extension_logs_user_id ON extension_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_logs_command_id ON extension_logs(command_id);
CREATE INDEX IF NOT EXISTS idx_extension_logs_created_at ON extension_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extension_logs_level ON extension_logs(level);
CREATE INDEX IF NOT EXISTS idx_extension_logs_action ON extension_logs(action);

-- Índice para busca de logs recentes
CREATE INDEX IF NOT EXISTS idx_extension_logs_recent ON extension_logs(user_id, created_at DESC);

-- Comentários
COMMENT ON TABLE extension_logs IS 'Logs de atividade da extensão Chrome';
COMMENT ON COLUMN extension_logs.action IS 'Ação executada (COMMAND_COMPLETED, ERROR, etc)';
COMMENT ON COLUMN extension_logs.level IS 'Nível do log: debug, info, warn, error';
COMMENT ON COLUMN extension_logs.timestamp IS 'Timestamp em milissegundos (client-side)';

-- RLS (Row Level Security)
ALTER TABLE extension_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own logs" ON extension_logs;
CREATE POLICY "Users can view their own logs"
  ON extension_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own logs" ON extension_logs;
CREATE POLICY "Users can insert their own logs"
  ON extension_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can do anything on logs" ON extension_logs;
CREATE POLICY "Service role can do anything on logs"
  ON extension_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ==========================================
-- FUNÇÕES AUXILIARES
-- ==========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_extension_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_extension_devices_updated_at ON extension_devices;
CREATE TRIGGER trigger_update_extension_devices_updated_at
  BEFORE UPDATE ON extension_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_extension_devices_updated_at();

-- Função para cleanup de logs antigos (executar via cron ou manualmente)
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

-- Função para cleanup de comandos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_commands()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  deleted BIGINT;
BEGIN
  DELETE FROM extension_commands
  WHERE expires_at < NOW() AND status IN ('pending', 'processing');

  GET DIAGNOSTICS deleted = ROW_COUNT;

  RETURN QUERY SELECT deleted;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar dispositivos offline (se não tiver last_seen recente)
CREATE OR REPLACE FUNCTION mark_inactive_devices(minutes_threshold INTEGER DEFAULT 5)
RETURNS TABLE(updated_count BIGINT) AS $$
DECLARE
  updated BIGINT;
BEGIN
  UPDATE extension_devices
  SET status = 'offline'
  WHERE status = 'online'
    AND last_seen < NOW() - (minutes_threshold || ' minutes')::INTERVAL;

  GET DIAGNOSTICS updated = ROW_COUNT;

  RETURN QUERY SELECT updated;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VIEWS ÚTEIS
-- ==========================================

-- View para estatísticas de comandos por dispositivo
CREATE OR REPLACE VIEW extension_command_stats AS
SELECT
  device_id,
  COUNT(*) as total_commands,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_commands,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_commands,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_commands,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE completed_at IS NOT NULL) as avg_execution_time_seconds,
  MAX(created_at) as last_command_at
FROM extension_commands
GROUP BY device_id;

-- View para dispositivos ativos
CREATE OR REPLACE VIEW extension_active_devices AS
SELECT
  ed.*,
  COUNT(ec.id) FILTER (WHERE ec.status = 'pending') as pending_commands_count
FROM extension_devices ed
LEFT JOIN extension_commands ec ON ed.device_id = ec.device_id
WHERE ed.status = 'online'
GROUP BY ed.id;

-- ==========================================
-- DADOS INICIAIS / SEEDS (OPCIONAL)
-- ==========================================

-- Nenhum dado inicial necessário
-- As tabelas serão populadas pela extensão e API

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================

-- Verificar se todas as tabelas foram criadas
DO $$
BEGIN
  RAISE NOTICE '✅ Verificando tabelas criadas...';

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'extension_devices') THEN
    RAISE NOTICE '  ✓ extension_devices';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'extension_commands') THEN
    RAISE NOTICE '  ✓ extension_commands';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'extension_logs') THEN
    RAISE NOTICE '  ✓ extension_logs';
  END IF;

  RAISE NOTICE '✅ Setup completo!';
END $$;

-- ==========================================
-- INSTRUÇÕES DE USO
-- ==========================================

-- Para executar este script:
-- 1. Acesse Supabase SQL Editor
-- 2. Cole todo o conteúdo deste arquivo
-- 3. Execute (Run)

-- Para cleanup periódico (executar via cron ou manualmente):
-- SELECT * FROM cleanup_old_extension_logs(30);  -- Limpa logs > 30 dias
-- SELECT * FROM cleanup_expired_commands();       -- Limpa comandos expirados
-- SELECT * FROM mark_inactive_devices(5);         -- Marca dispositivos offline

-- Para ver estatísticas:
-- SELECT * FROM extension_command_stats;
-- SELECT * FROM extension_active_devices;

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================
