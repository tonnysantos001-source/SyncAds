-- Script 1: CORRIGIR POLÍTICAS RLS
ALTER TABLE "GlobalAiConnection" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage global AI" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins view global AI" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins can insert" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins can update" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins can delete" ON "GlobalAiConnection";

CREATE POLICY "Super admins full access" ON "GlobalAiConnection"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
        AND "User".role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;
