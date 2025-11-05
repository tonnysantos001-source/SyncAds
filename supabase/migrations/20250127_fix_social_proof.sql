-- Migration: Fix SocialProof table (organizationId → userId)
-- Date: 2025-01-27
-- Description: Remove organizationId column and add userId with proper constraints and RLS

-- ============================================
-- STEP 1: Add userId column (nullable first)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'SocialProof'
        AND column_name = 'userId'
    ) THEN
        ALTER TABLE "SocialProof"
        ADD COLUMN "userId" TEXT;

        RAISE NOTICE 'Column userId added to SocialProof';
    ELSE
        RAISE NOTICE 'Column userId already exists in SocialProof';
    END IF;
END $$;

-- ============================================
-- STEP 2: Migrate data from organizationId to userId (if needed)
-- ============================================
-- Note: Since we're removing organizationId, we need to set userId
-- For existing records, you may need to manually map organizationId to userId
-- or delete old records if they're just test data

-- Option 1: If you have mapping data, update here
-- UPDATE "SocialProof"
-- SET "userId" = (SELECT id FROM "User" WHERE ...)
-- WHERE "userId" IS NULL;

-- Option 2: If it's test data, just delete old records
DELETE FROM "SocialProof" WHERE "userId" IS NULL;

RAISE NOTICE 'Data migration completed';

-- ============================================
-- STEP 3: Make userId NOT NULL
-- ============================================
ALTER TABLE "SocialProof"
ALTER COLUMN "userId" SET NOT NULL;

RAISE NOTICE 'Column userId set to NOT NULL';

-- ============================================
-- STEP 4: Add Foreign Key constraint
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'SocialProof_userId_fkey'
        AND table_name = 'SocialProof'
    ) THEN
        ALTER TABLE "SocialProof"
        ADD CONSTRAINT "SocialProof_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

        RAISE NOTICE 'Foreign key constraint added';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- ============================================
-- STEP 5: Remove organizationId column
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'SocialProof'
        AND column_name = 'organizationId'
    ) THEN
        ALTER TABLE "SocialProof"
        DROP COLUMN "organizationId" CASCADE;

        RAISE NOTICE 'Column organizationId removed';
    ELSE
        RAISE NOTICE 'Column organizationId does not exist';
    END IF;
END $$;

-- ============================================
-- STEP 6: Update RLS Policies
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own social proofs" ON "SocialProof";
DROP POLICY IF EXISTS "Users can insert own social proofs" ON "SocialProof";
DROP POLICY IF EXISTS "Users can update own social proofs" ON "SocialProof";
DROP POLICY IF EXISTS "Users can delete own social proofs" ON "SocialProof";
DROP POLICY IF EXISTS "Users can manage social proofs" ON "SocialProof";
DROP POLICY IF EXISTS "Users can manage their own social proofs" ON "SocialProof";

-- Create new unified policy
CREATE POLICY "Users can manage their own social proofs"
ON "SocialProof"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

RAISE NOTICE 'RLS policies updated';

-- ============================================
-- STEP 7: Ensure RLS is enabled
-- ============================================
ALTER TABLE "SocialProof" ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'RLS enabled on SocialProof';

-- ============================================
-- STEP 8: Add performance indexes
-- ============================================

-- Index for userId lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_social_proof_user_active
ON "SocialProof"("userId", "isActive", "createdAt" DESC);

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_social_proof_type
ON "SocialProof"("type", "isActive");

RAISE NOTICE 'Performance indexes created';

-- ============================================
-- STEP 9: Update column comments
-- ============================================
COMMENT ON COLUMN "SocialProof"."userId" IS 'Reference to the user who owns this social proof';
COMMENT ON TABLE "SocialProof" IS 'Social proof notifications to display in checkout (purchases, reviews, visitors)';

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
    col_exists BOOLEAN;
    fk_exists BOOLEAN;
    rls_enabled BOOLEAN;
BEGIN
    -- Check userId exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'SocialProof' AND column_name = 'userId'
    ) INTO col_exists;

    -- Check FK exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'SocialProof_userId_fkey'
    ) INTO fk_exists;

    -- Check RLS enabled
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'SocialProof'
    INTO rls_enabled;

    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'userId column exists: %', col_exists;
    RAISE NOTICE 'Foreign key exists: %', fk_exists;
    RAISE NOTICE 'RLS enabled: %', rls_enabled;

    IF NOT col_exists OR NOT fk_exists OR NOT rls_enabled THEN
        RAISE EXCEPTION 'Migration verification failed!';
    END IF;

    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
END $$;
