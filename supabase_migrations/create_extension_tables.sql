-- ============================================
-- SYNCADS EXTENSION TABLES
-- Tabelas para comunicação com a extensão do navegador
-- Data: 18/01/2025
-- ============================================

-- ============================================
-- 1. EXTENSIONDEVICE
-- Registra dispositivos/navegadores conectados
-- ============================================
CREATE TABLE IF NOT EXISTS "ExtensionDevice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "isOnline" BOOLEAN DEFAULT true,
  "lastSeen" TIMESTAMPTZ DEFAULT NOW(),
  "userAgent" TEXT,
  "browserName" TEXT,
  "browserVersion" TEXT,
  "osName" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_device_user_id ON "ExtensionDevice"("userId");
CREATE INDEX IF NOT EXISTS idx_extension_device_online ON "ExtensionDevice"("isOnline");
CREATE INDEX IF NOT EXISTS idx_extension_device_last_seen ON "ExtensionDevice"("lastSeen");
CREATE INDEX IF NOT EXISTS idx_extension_device_user_online ON "ExtensionDevice"("userId", "isOnline");

-- Comentários
COMMENT ON TABLE "ExtensionDevice" IS 'Dispositivos/navegadores com extensão SyncAds AI instalada';
COMMENT ON COLUMN "ExtensionDevice"."deviceId" IS 'ID único do dispositivo (gerado pela extensão)';
COMMENT ON COLUMN "ExtensionDevice"."lastSeen" IS 'Última vez que a extensão fez ping (heartbeat)';

-- ============================================
-- 2. EXTENSIONCOMMAND
-- Comandos para a extensão executar
-- ============================================
CREATE TABLE IF NOT EXISTS "ExtensionCommand" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  params JSONB DEFAULT '{}',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  result JSONB,
  error TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "executedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  CONSTRAINT fk_extension_device FOREIGN KEY ("deviceId") REFERENCES "ExtensionDevice"("deviceId") ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_command_device_id ON "ExtensionCommand"("deviceId");
CREATE INDEX IF NOT EXISTS idx_extension_command_status ON "ExtensionCommand"(status);
CREATE INDEX IF NOT EXISTS idx_extension_command_device_status ON "ExtensionCommand"("deviceId", status);
CREATE INDEX IF NOT EXISTS idx_extension_command_created_at ON "ExtensionCommand"("createdAt");
CREATE INDEX IF NOT EXISTS idx_extension_command_user_id ON "ExtensionCommand"("userId");

-- Comentários
COMMENT ON TABLE "ExtensionCommand" IS 'Fila de comandos para a extensão executar';
COMMENT ON COLUMN "ExtensionCommand".command IS 'Tipo de comando: NAVIGATE, CLICK, TYPE, EXTRACT, SCREENSHOT, SCROLL, WAIT';
COMMENT ON COLUMN "ExtensionCommand".params IS 'Parâmetros do comando em JSON';
COMMENT ON COLUMN "ExtensionCommand".status IS 'Status do comando: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED';

-- ============================================
-- 3. EXTENSIONLOG
-- Logs da extensão para debugging
-- ============================================
CREATE TABLE IF NOT EXISTS "ExtensionLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT NOT NULL,
  "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'SUCCESS')),
  message TEXT NOT NULL,
  data JSONB,
  url TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_extension_device_log FOREIGN KEY ("deviceId") REFERENCES "ExtensionDevice"("deviceId") ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_log_device_id ON "ExtensionLog"("deviceId");
CREATE INDEX IF NOT EXISTS idx_extension_log_level ON "ExtensionLog"(level);
CREATE INDEX IF NOT EXISTS idx_extension_log_created_at ON "ExtensionLog"("createdAt");
CREATE INDEX IF NOT EXISTS idx_extension_log_user_id ON "ExtensionLog"("userId");

-- Comentários
COMMENT ON TABLE "ExtensionLog" IS 'Logs da extensão para debugging e monitoramento';
COMMENT ON COLUMN "ExtensionLog".level IS 'Nível do log: DEBUG, INFO, WARN, ERROR, SUCCESS';

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Ativar RLS
ALTER TABLE "ExtensionDevice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExtensionCommand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExtensionLog" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - EXTENSIONDEVICE
-- ============================================

-- Usuário pode ver seus próprios devices
CREATE POLICY "Users can view their own devices"
  ON "ExtensionDevice"
  FOR SELECT
  USING (auth.uid() = "userId");

-- Usuário pode inserir seus devices
CREATE POLICY "Users can insert their own devices"
  ON "ExtensionDevice"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Usuário pode atualizar seus devices
CREATE POLICY "Users can update their own devices"
  ON "ExtensionDevice"
  FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Service role pode fazer tudo (para Edge Functions)
CREATE POLICY "Service role can do everything on devices"
  ON "ExtensionDevice"
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- POLICIES - EXTENSIONCOMMAND
-- ============================================

-- Usuário pode ver seus próprios comandos
CREATE POLICY "Users can view their own commands"
  ON "ExtensionCommand"
  FOR SELECT
  USING (auth.uid() = "userId");

-- Usuário pode inserir seus comandos
CREATE POLICY "Users can insert their own commands"
  ON "ExtensionCommand"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Usuário pode atualizar seus comandos
CREATE POLICY "Users can update their own commands"
  ON "ExtensionCommand"
  FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Service role pode fazer tudo
CREATE POLICY "Service role can do everything on commands"
  ON "ExtensionCommand"
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- POLICIES - EXTENSIONLOG
-- ============================================

-- Usuário pode ver seus próprios logs
CREATE POLICY "Users can view their own logs"
  ON "ExtensionLog"
  FOR SELECT
  USING (auth.uid() = "userId");

-- Usuário pode inserir seus logs
CREATE POLICY "Users can insert their own logs"
  ON "ExtensionLog"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Service role pode fazer tudo
CREATE POLICY "Service role can do everything on logs"
  ON "ExtensionLog"
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 5. FUNCTIONS E TRIGGERS
-- ============================================

-- Função para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_extension_device_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updatedAt
DROP TRIGGER IF EXISTS trigger_update_extension_device_updated_at ON "ExtensionDevice";
CREATE TRIGGER trigger_update_extension_device_updated_at
  BEFORE UPDATE ON "ExtensionDevice"
  FOR EACH ROW
  EXECUTE FUNCTION update_extension_device_updated_at();

-- Função para marcar device como offline se não fez ping há mais de 2 minutos
CREATE OR REPLACE FUNCTION mark_offline_devices()
RETURNS void AS $$
BEGIN
  UPDATE "ExtensionDevice"
  SET "isOnline" = false
  WHERE "isOnline" = true
    AND "lastSeen" < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION mark_offline_devices() IS 'Marca devices como offline se não fizeram ping há mais de 2 minutos';

-- Função para limpar comandos antigos (mais de 7 dias)
CREATE OR REPLACE FUNCTION cleanup_old_commands()
RETURNS void AS $$
BEGIN
  DELETE FROM "ExtensionCommand"
  WHERE status IN ('COMPLETED', 'FAILED', 'CANCELLED')
    AND "createdAt" < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION cleanup_old_commands() IS 'Remove comandos completados/falhados com mais de 7 dias';

-- Função para limpar logs antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM "ExtensionLog"
  WHERE "createdAt" < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION cleanup_old_logs() IS 'Remove logs com mais de 30 dias';

-- ============================================
-- 6. VIEWS ÚTEIS
-- ============================================

-- View de devices online
CREATE OR REPLACE VIEW "ExtensionDeviceOnline" AS
SELECT
  ed.*,
  u.email as "userEmail",
  u.name as "userName"
FROM "ExtensionDevice" ed
LEFT JOIN "User" u ON ed."userId" = u.id
WHERE ed."isOnline" = true
  AND ed."lastSeen" > NOW() - INTERVAL '2 minutes';

COMMENT ON VIEW "ExtensionDeviceOnline" IS 'Devices online (ping nos últimos 2 minutos)';

-- View de comandos pendentes
CREATE OR REPLACE VIEW "ExtensionCommandPending" AS
SELECT
  ec.*,
  ed."userId",
  ed."userAgent",
  u.email as "userEmail"
FROM "ExtensionCommand" ec
LEFT JOIN "ExtensionDevice" ed ON ec."deviceId" = ed."deviceId"
LEFT JOIN "User" u ON ec."userId" = u.id
WHERE ec.status = 'PENDING'
ORDER BY ec."createdAt" ASC;

COMMENT ON VIEW "ExtensionCommandPending" IS 'Comandos pendentes de execução';

-- ============================================
-- 7. DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Nenhum dado inicial necessário

-- ============================================
-- 8. VALIDAÇÕES E CHECKS
-- ============================================

-- Verificar se User existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    RAISE EXCEPTION 'Tabela User não existe. Crie-a primeiro.';
  END IF;
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas da extensão criadas com sucesso!';
  RAISE NOTICE '📊 Tabelas: ExtensionDevice, ExtensionCommand, ExtensionLog';
  RAISE NOTICE '🔒 RLS ativado com policies configuradas';
  RAISE NOTICE '⚡ Índices criados para performance';
  RAISE NOTICE '🔧 Functions e triggers configurados';
END $$;
