-- CORREÇÃO 1: Garantir campos obrigatórios têm valores
UPDATE "GlobalAiConnection"
SET 
  "maxTokens" = COALESCE("maxTokens", 4096),
  temperature = COALESCE(temperature, 0.7),
  "baseUrl" = COALESCE("baseUrl", 'https://api.anthropic.com/v1')
WHERE provider = 'ANTHROPIC';

-- CORREÇÃO 2: Corrigir RLS para permitir gerenciamento
ALTER TABLE "GlobalAiConnection" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_access" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins full access" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "allow_super_admin_all" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "allow_authenticated_all" ON "GlobalAiConnection";

-- Política permissiva para authenticated users
CREATE POLICY "allow_authenticated_all" ON "GlobalAiConnection"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;

-- Verificação
SELECT 
  'VERIFICAÇÃO' as status,
  id,
  name,
  provider,
  "maxTokens",
  temperature,
  "baseUrl",
  "isActive"
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';

SELECT '✅ CORREÇÕES SQL APLICADAS COM SUCESSO!' as resultado;
