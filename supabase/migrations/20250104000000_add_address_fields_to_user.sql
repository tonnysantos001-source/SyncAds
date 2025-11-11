-- Migration: Add address fields to User table
-- Created: 2025-01-04
-- Description: Adds address fields (CEP, street, number, complement, neighborhood, city, state) to User table for 2-step registration

-- Add address fields to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "cep" TEXT,
ADD COLUMN IF NOT EXISTS "street" TEXT,
ADD COLUMN IF NOT EXISTS "number" TEXT,
ADD COLUMN IF NOT EXISTS "complement" TEXT,
ADD COLUMN IF NOT EXISTS "neighborhood" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT;

-- Add comments to document the fields
COMMENT ON COLUMN "User"."cep" IS 'CEP (Brazilian postal code) - Format: 00000-000';
COMMENT ON COLUMN "User"."street" IS 'Street name';
COMMENT ON COLUMN "User"."number" IS 'Street number';
COMMENT ON COLUMN "User"."complement" IS 'Address complement (apartment, suite, etc.) - Optional';
COMMENT ON COLUMN "User"."neighborhood" IS 'Neighborhood/District';
COMMENT ON COLUMN "User"."city" IS 'City name';
COMMENT ON COLUMN "User"."state" IS 'State/Province code (2 letters for Brazil)';

-- Create index on CEP for faster address lookups
CREATE INDEX IF NOT EXISTS "idx_user_cep" ON "User"("cep");

-- Create index on city for analytics/reports
CREATE INDEX IF NOT EXISTS "idx_user_city" ON "User"("city");

-- Create index on state for analytics/reports
CREATE INDEX IF NOT EXISTS "idx_user_state" ON "User"("state");
