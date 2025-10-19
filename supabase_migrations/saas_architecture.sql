-- ============================================
-- SYNCADS SAAS ARCHITECTURE
-- Migration: Single-tenant → Multi-tenant
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SUPER ADMIN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "SuperAdmin" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ORGANIZATIONS (Tenants)
-- ============================================
CREATE TABLE IF NOT EXISTS "Organization" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'FREE', -- FREE, STARTER, PRO, ENTERPRISE
  status TEXT NOT NULL DEFAULT 'TRIAL', -- TRIAL, ACTIVE, SUSPENDED, CANCELLED
  "trialEndsAt" TIMESTAMP,
  "subscriptionId" TEXT,
  "maxUsers" INTEGER DEFAULT 2,
  "maxCampaigns" INTEGER DEFAULT 5,
  "maxChatMessages" INTEGER DEFAULT 100,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ALTER USER TABLE (add organizationId and role)
-- ============================================
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER', -- ADMIN, MEMBER, VIEWER
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Remove unique constraint on email (now unique per organization)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";

-- Add composite unique constraint
ALTER TABLE "User" 
  ADD CONSTRAINT "User_organizationId_email_key" 
  UNIQUE ("organizationId", email);

-- ============================================
-- GLOBAL AI CONNECTIONS (Super Admin only)
-- ============================================
CREATE TABLE IF NOT EXISTS "GlobalAiConnection" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- OPENAI, ANTHROPIC, GOOGLE, COHERE
  "apiKey" TEXT NOT NULL, -- Encrypted
  "baseUrl" TEXT,
  model TEXT,
  "maxTokens" INTEGER DEFAULT 4096,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ORGANIZATION AI ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS "OrganizationAiConnection" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE,
  "globalAiConnectionId" UUID REFERENCES "GlobalAiConnection"(id) ON DELETE CASCADE,
  "isDefault" BOOLEAN DEFAULT false,
  "customSystemPrompt" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", "globalAiConnectionId")
);

-- ============================================
-- ALTER EXISTING TABLES (add organizationId)
-- ============================================

-- Campaigns
ALTER TABLE "Campaign" 
  ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE;

-- ChatConversation
ALTER TABLE "ChatConversation" 
  ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE;

-- Integration
ALTER TABLE "Integration" 
  ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE;

-- Analytics (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Analytics') THEN
    ALTER TABLE "Analytics" 
      ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS "Subscription" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL, -- ACTIVE, CANCELLED, PAST_DUE, TRIALING
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS "UsageTracking" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- campaigns, chat_messages, users
  count INTEGER DEFAULT 0,
  period TEXT NOT NULL, -- monthly
  "periodStart" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", metric, "periodStart")
);

-- ============================================
-- AI USAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS "AiUsage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "User"(id),
  "globalAiConnectionId" UUID REFERENCES "GlobalAiConnection"(id),
  "messageCount" INTEGER DEFAULT 1,
  "tokensUsed" INTEGER DEFAULT 0,
  cost DECIMAL(10,4) DEFAULT 0,
  month TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", "userId", "globalAiConnectionId", month)
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_organization ON "User"("organizationId");
CREATE INDEX IF NOT EXISTS idx_campaign_organization ON "Campaign"("organizationId");
CREATE INDEX IF NOT EXISTS idx_conversation_organization ON "ChatConversation"("organizationId");
CREATE INDEX IF NOT EXISTS idx_integration_organization ON "Integration"("organizationId");
CREATE INDEX IF NOT EXISTS idx_org_ai_org ON "OrganizationAiConnection"("organizationId");
CREATE INDEX IF NOT EXISTS idx_usage_org_period ON "UsageTracking"("organizationId", "periodStart");

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationAiConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageTracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiUsage" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Organizations: Users see only their organization
CREATE POLICY "Users see own organization" ON "Organization"
  FOR SELECT USING (
    id IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Users: See only users in their organization
CREATE POLICY "Users see org members" ON "User"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Campaigns: Users see only their org campaigns
CREATE POLICY "Users see org campaigns" ON "Campaign"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users insert org campaigns" ON "Campaign"
  FOR INSERT WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users update org campaigns" ON "Campaign"
  FOR UPDATE USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users delete org campaigns" ON "Campaign"
  FOR DELETE USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- ChatConversations: Users see only their conversations
CREATE POLICY "Users see own conversations" ON "ChatConversation"
  FOR SELECT USING (
    "userId" = auth.uid() OR 
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Users create own conversations" ON "ChatConversation"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

-- ChatMessages: Users see messages from their conversations
CREATE POLICY "Users see conversation messages" ON "ChatMessage"
  FOR SELECT USING (
    "conversationId" IN (
      SELECT id FROM "ChatConversation" WHERE "userId" = auth.uid()
    )
  );

CREATE POLICY "Users create messages" ON "ChatMessage"
  FOR INSERT WITH CHECK (
    "conversationId" IN (
      SELECT id FROM "ChatConversation" WHERE "userId" = auth.uid()
    )
  );

-- Integrations: Users see org integrations
CREATE POLICY "Users see org integrations" ON "Integration"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users manage org integrations" ON "Integration"
  FOR ALL USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- GlobalAiConnection: Only accessible via backend
CREATE POLICY "Block direct access to global AI" ON "GlobalAiConnection"
  FOR SELECT USING (false);

-- OrganizationAiConnection: Users see assigned AI
CREATE POLICY "Users see assigned AI" ON "OrganizationAiConnection"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updatedAt
CREATE TRIGGER update_organization_updated_at BEFORE UPDATE ON "Organization"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_updated_at BEFORE UPDATE ON "Campaign"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check organization limits
CREATE OR REPLACE FUNCTION check_organization_limits()
RETURNS TRIGGER AS $$
DECLARE
  org_record RECORD;
  current_count INTEGER;
BEGIN
  -- Get organization details
  SELECT * INTO org_record FROM "Organization" WHERE id = NEW."organizationId";
  
  -- Check based on table
  IF TG_TABLE_NAME = 'User' THEN
    SELECT COUNT(*) INTO current_count FROM "User" WHERE "organizationId" = NEW."organizationId";
    IF current_count >= org_record."maxUsers" THEN
      RAISE EXCEPTION 'Organization has reached maximum users limit';
    END IF;
  ELSIF TG_TABLE_NAME = 'Campaign' THEN
    SELECT COUNT(*) INTO current_count FROM "Campaign" WHERE "organizationId" = NEW."organizationId";
    IF current_count >= org_record."maxCampaigns" THEN
      RAISE EXCEPTION 'Organization has reached maximum campaigns limit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for limits
CREATE TRIGGER check_user_limit BEFORE INSERT ON "User"
  FOR EACH ROW EXECUTE FUNCTION check_organization_limits();

CREATE TRIGGER check_campaign_limit BEFORE INSERT ON "Campaign"
  FOR EACH ROW EXECUTE FUNCTION check_organization_limits();

-- ============================================
-- SEED DATA - Create first organization from existing user
-- ============================================
DO $$
DECLARE
  first_org_id UUID;
  first_user_id UUID;
BEGIN
  -- Get first user (if exists)
  SELECT id INTO first_user_id FROM "User" LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- Create first organization
    INSERT INTO "Organization" (name, slug, plan, status, "maxUsers", "maxCampaigns", "maxChatMessages")
    VALUES ('Minha Empresa', 'minha-empresa', 'PRO', 'ACTIVE', 999, 999, 99999)
    RETURNING id INTO first_org_id;
    
    -- Update user with organizationId
    UPDATE "User" 
    SET "organizationId" = first_org_id, role = 'ADMIN'
    WHERE id = first_user_id;
    
    -- Update existing campaigns
    UPDATE "Campaign" 
    SET "organizationId" = first_org_id
    WHERE "userId" = first_user_id;
    
    -- Update existing conversations
    UPDATE "ChatConversation" 
    SET "organizationId" = first_org_id
    WHERE "userId" = first_user_id;
    
    -- Update existing integrations
    UPDATE "Integration" 
    SET "organizationId" = first_org_id
    WHERE "userId" = first_user_id;
    
    RAISE NOTICE 'Migration completed. First organization created with ID: %', first_org_id;
  END IF;
END $$;

-- ============================================
-- COMPLETED
-- ============================================
-- Run this migration with:
-- psql -h your-supabase-url -U postgres -d postgres -f saas_architecture.sql
