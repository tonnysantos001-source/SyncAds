-- ============================================
-- Migration: 20251103_gateway_verification.sql
-- Purpose: Add gateway verification fields, indexes and audit table
-- Project: SyncAds
-- ============================================

-- Safety first: wrap into a transaction
BEGIN;

-- Required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1) GatewayConfig: verification fields
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'GatewayConfig') THEN
    -- Environment: 'production' | 'sandbox' (default: production)
    ALTER TABLE "GatewayConfig"
      ADD COLUMN IF NOT EXISTS "environment" TEXT NOT NULL DEFAULT 'production';

    -- Verification status and metadata
    ALTER TABLE "GatewayConfig"
      ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE "GatewayConfig"
      ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMPTZ;

    ALTER TABLE "GatewayConfig"
      ADD COLUMN IF NOT EXISTS "verificationMetadata" JSONB;

    -- Optional encrypted credentials blob (AES-GCM base64). Prefer this instead of raw JSONB in production.
    ALTER TABLE "GatewayConfig"
      ADD COLUMN IF NOT EXISTS "credentialsEncrypted" TEXT;

    -- Helpful indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_gateway_config_user_env ON "GatewayConfig"("userId", "environment");
    CREATE INDEX IF NOT EXISTS idx_gateway_config_verified ON "GatewayConfig"("isVerified");
  END IF;
END
$$;

-- Backfill environment to 'production' where null (defensive; should already be defaulted)
UPDATE "GatewayConfig"
SET "environment" = 'production'
WHERE "environment" IS NULL;

-- ============================================
-- 2) Gateway: provider-reported methods and scope
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Gateway') THEN
    ALTER TABLE "Gateway"
      ADD COLUMN IF NOT EXISTS "methods" JSONB;          -- e.g. { "credit_card": true, "pix": true, "boleto": true }
    ALTER TABLE "Gateway"
      ADD COLUMN IF NOT EXISTS "isGlobal" BOOLEAN DEFAULT false;
  END IF;
END
$$;

-- ============================================
-- 3) GatewayVerification: audit table
-- ============================================
CREATE TABLE IF NOT EXISTS "GatewayVerification" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "gatewayConfigId" UUID REFERENCES "GatewayConfig"(id) ON DELETE CASCADE,
  "userId" TEXT,                             -- owner of the config
  "verifiedAt" TIMESTAMPTZ DEFAULT NOW(),    -- when the verification happened
  success BOOLEAN,
  "httpStatus" INT,
  message TEXT,
  "responseJson" JSONB                       -- small/filtered provider response (no secrets)
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_gateway_verif_config ON "GatewayVerification"("gatewayConfigId");
CREATE INDEX IF NOT EXISTS idx_gateway_verif_user   ON "GatewayVerification"("userId");

-- ============================================
-- 4) RLS for GatewayVerification (owner can read/write own records)
--    This mirrors existing ownership semantics for GatewayConfig.
-- ============================================
DO $$
BEGIN
  -- Enable RLS
  ALTER TABLE "GatewayVerification" ENABLE ROW LEVEL SECURITY;

  -- Drop legacy policies if any
  DROP POLICY IF EXISTS "gateway_verif_owner_all" ON "GatewayVerification";
  DROP POLICY IF EXISTS "gateway_verif_owner_select" ON "GatewayVerification";
  DROP POLICY IF EXISTS "gateway_verif_owner_insert" ON "GatewayVerification";

  -- Conservative single policy allowing owner to do ALL actions on their rows.
  -- Super admins can still operate via service role / edge functions if needed.
  CREATE POLICY "gateway_verif_owner_all" ON "GatewayVerification"
    FOR ALL
    USING ((SELECT auth.uid())::text = "userId")
    WITH CHECK ((SELECT auth.uid())::text = "userId");
END
$$;

-- ============================================
-- 5) Notes
-- - Keep secrets out of logs and out of verificationMetadata/responseJson.
-- - Prefer storing credentials using "credentialsEncrypted" (AES-GCM base64) instead of raw JSONB.
-- - Application layer should set isVerified=true and verifiedAt=now() only after a successful real provider call.
-- ============================================

COMMIT;
