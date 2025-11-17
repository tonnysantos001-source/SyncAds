-- Tabelas da Extensão SyncAds
-- CORRIGIDO: userId como TEXT (não UUID)

-- 1. ExtensionDevice
CREATE TABLE IF NOT EXISTS "ExtensionDevice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "isOnline" BOOLEAN DEFAULT true,
  "lastSeen" TIMESTAMPTZ DEFAULT NOW(),
  "userAgent" TEXT,
  "browserName" TEXT,
  "browserVersion" TEXT,
  "osName" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ExtensionCommand
CREATE TABLE IF NOT EXISTS "ExtensionCommand" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  params JSONB DEFAULT '{}',
  status TEXT DEFAULT 'PENDING',
  result JSONB,
  error TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "executedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ
);

-- 3. ExtensionLog
CREATE TABLE IF NOT EXISTS "ExtensionLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId" TEXT NOT NULL,
  "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  url TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_extension_device_user ON "ExtensionDevice"("userId");
CREATE INDEX IF NOT EXISTS idx_extension_device_online ON "ExtensionDevice"("isOnline");
CREATE INDEX IF NOT EXISTS idx_extension_command_device ON "ExtensionCommand"("deviceId");
CREATE INDEX IF NOT EXISTS idx_extension_command_status ON "ExtensionCommand"(status);
CREATE INDEX IF NOT EXISTS idx_extension_log_device ON "ExtensionLog"("deviceId");

-- RLS
ALTER TABLE "ExtensionDevice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExtensionCommand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExtensionLog" ENABLE ROW LEVEL SECURITY;

-- Policies ExtensionDevice
DROP POLICY IF EXISTS "Users view own devices" ON "ExtensionDevice";
CREATE POLICY "Users view own devices" ON "ExtensionDevice" FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users insert own devices" ON "ExtensionDevice";
CREATE POLICY "Users insert own devices" ON "ExtensionDevice" FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users update own devices" ON "ExtensionDevice";
CREATE POLICY "Users update own devices" ON "ExtensionDevice" FOR UPDATE USING (auth.uid()::text = "userId");

-- Policies ExtensionCommand
DROP POLICY IF EXISTS "Users view own commands" ON "ExtensionCommand";
CREATE POLICY "Users view own commands" ON "ExtensionCommand" FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users insert own commands" ON "ExtensionCommand";
CREATE POLICY "Users insert own commands" ON "ExtensionCommand" FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users update own commands" ON "ExtensionCommand";
CREATE POLICY "Users update own commands" ON "ExtensionCommand" FOR UPDATE USING (auth.uid()::text = "userId");

-- Policies ExtensionLog
DROP POLICY IF EXISTS "Users view own logs" ON "ExtensionLog";
CREATE POLICY "Users view own logs" ON "ExtensionLog" FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users insert own logs" ON "ExtensionLog";
CREATE POLICY "Users insert own logs" ON "ExtensionLog" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
