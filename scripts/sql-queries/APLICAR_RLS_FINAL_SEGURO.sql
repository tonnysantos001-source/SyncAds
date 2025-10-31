-- ============================================
-- 🚀 OTIMIZAÇÃO DE RLS PERFORMANCE (ULTRA-SEGURO)
-- ============================================
-- Aplica (select auth.uid()) apenas em tabelas que existem
-- E que têm a coluna userId
-- ============================================

-- ===== USER TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'User'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
    CREATE POLICY "Users can view their own profile" ON "User"
      FOR SELECT USING ((select auth.uid())::text = id);

    DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
    CREATE POLICY "Users can update their own profile" ON "User"
      FOR UPDATE USING ((select auth.uid())::text = id);
    
    RAISE NOTICE '✅ User policies updated';
  END IF;
END $$;

-- ===== CAMPAIGN TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Campaign' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own campaigns" ON "Campaign";
    CREATE POLICY "Users can view their own campaigns" ON "Campaign"
      FOR SELECT USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can insert their own campaigns" ON "Campaign";
    CREATE POLICY "Users can insert their own campaigns" ON "Campaign"
      FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can update their own campaigns" ON "Campaign";
    CREATE POLICY "Users can update their own campaigns" ON "Campaign"
      FOR UPDATE USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can delete their own campaigns" ON "Campaign";
    CREATE POLICY "Users can delete their own campaigns" ON "Campaign"
      FOR DELETE USING ((select auth.uid())::text = "userId");
    
    RAISE NOTICE '✅ Campaign policies updated';
  END IF;
END $$;

-- ===== ANALYTICS TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Analytics' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own analytics" ON "Analytics";
    CREATE POLICY "Users can view their own analytics" ON "Analytics"
      FOR SELECT USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can insert their own analytics" ON "Analytics";
    CREATE POLICY "Users can insert their own analytics" ON "Analytics"
      FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can update their own analytics" ON "Analytics";
    CREATE POLICY "Users can update their own analytics" ON "Analytics"
      FOR UPDATE USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can delete their own analytics" ON "Analytics";
    CREATE POLICY "Users can delete their own analytics" ON "Analytics"
      FOR DELETE USING ((select auth.uid())::text = "userId");
    
    RAISE NOTICE '✅ Analytics policies updated';
  END IF;
END $$;

-- ===== CHATCONVERSATION TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ChatConversation' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
    CREATE POLICY "Users can view their own conversations" ON "ChatConversation"
      FOR SELECT USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
    CREATE POLICY "Users can insert their own conversations" ON "ChatConversation"
      FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
    CREATE POLICY "Users can update their own conversations" ON "ChatConversation"
      FOR UPDATE USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";
    CREATE POLICY "Users can delete their own conversations" ON "ChatConversation"
      FOR DELETE USING ((select auth.uid())::text = "userId");
    
    RAISE NOTICE '✅ ChatConversation policies updated';
  END IF;
END $$;

-- ===== CHATMESSAGE TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ChatMessage' AND column_name = 'conversationId'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ChatConversation' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
    CREATE POLICY "Users can view messages from their conversations" ON "ChatMessage"
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM "ChatConversation" 
          WHERE id = "ChatMessage"."conversationId" 
          AND "userId" = (select auth.uid())::text
        )
      );

    DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
    CREATE POLICY "Users can insert messages to their conversations" ON "ChatMessage"
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM "ChatConversation" 
          WHERE id = "ChatMessage"."conversationId" 
          AND "userId" = (select auth.uid())::text
        )
      );

    DROP POLICY IF EXISTS "Users can update messages in their conversations" ON "ChatMessage";
    CREATE POLICY "Users can update messages in their conversations" ON "ChatMessage"
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM "ChatConversation" 
          WHERE id = "ChatMessage"."conversationId" 
          AND "userId" = (select auth.uid())::text
        )
      );

    DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON "ChatMessage";
    CREATE POLICY "Users can delete messages from their conversations" ON "ChatMessage"
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM "ChatConversation" 
          WHERE id = "ChatMessage"."conversationId" 
          AND "userId" = (select auth.uid())::text
        )
      );
    
    RAISE NOTICE '✅ ChatMessage policies updated';
  END IF;
END $$;

-- ===== INTEGRATION TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Integration' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own integrations" ON "Integration";
    CREATE POLICY "Users can view their own integrations" ON "Integration"
      FOR SELECT USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can insert their own integrations" ON "Integration";
    CREATE POLICY "Users can insert their own integrations" ON "Integration"
      FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can update their own integrations" ON "Integration";
    CREATE POLICY "Users can update their own integrations" ON "Integration"
      FOR UPDATE USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can delete their own integrations" ON "Integration";
    CREATE POLICY "Users can delete their own integrations" ON "Integration"
      FOR DELETE USING ((select auth.uid())::text = "userId");
    
    RAISE NOTICE '✅ Integration policies updated';
  END IF;
END $$;

-- ===== APIKEY TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ApiKey' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own API keys" ON "ApiKey";
    CREATE POLICY "Users can view their own API keys" ON "ApiKey"
      FOR SELECT USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can insert their own API keys" ON "ApiKey";
    CREATE POLICY "Users can insert their own API keys" ON "ApiKey"
      FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can update their own API keys" ON "ApiKey";
    CREATE POLICY "Users can update their own API keys" ON "ApiKey"
      FOR UPDATE USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can delete their own API keys" ON "ApiKey";
    CREATE POLICY "Users can delete their own API keys" ON "ApiKey"
      FOR DELETE USING ((select auth.uid())::text = "userId");
    
    RAISE NOTICE '✅ ApiKey policies updated';
  END IF;
END $$;

-- ===== NOTIFICATION TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Notification' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON "Notification";
    CREATE POLICY "Users can view their own notifications" ON "Notification"
      FOR SELECT USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can update their own notifications" ON "Notification";
    CREATE POLICY "Users can update their own notifications" ON "Notification"
      FOR UPDATE USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can delete their own notifications" ON "Notification";
    CREATE POLICY "Users can delete their own notifications" ON "Notification"
      FOR DELETE USING ((select auth.uid())::text = "userId");
    
    RAISE NOTICE '✅ Notification policies updated';
  END IF;
END $$;

-- ===== AICONNECTION TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AiConnection' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own AI connections" ON "AiConnection";
    CREATE POLICY "Users can view their own AI connections" ON "AiConnection"
      FOR SELECT USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can insert their own AI connections" ON "AiConnection";
    CREATE POLICY "Users can insert their own AI connections" ON "AiConnection"
      FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can update their own AI connections" ON "AiConnection";
    CREATE POLICY "Users can update their own AI connections" ON "AiConnection"
      FOR UPDATE USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can delete their own AI connections" ON "AiConnection";
    CREATE POLICY "Users can delete their own AI connections" ON "AiConnection"
      FOR DELETE USING ((select auth.uid())::text = "userId");
    
    RAISE NOTICE '✅ AiConnection policies updated';
  END IF;
END $$;

-- ===== AIPERSONALITY TABLE =====
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AiPersonality' AND column_name = 'userId'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own AI personality" ON "AiPersonality";
    CREATE POLICY "Users can view their own AI personality" ON "AiPersonality"
      FOR SELECT USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can insert their own AI personality" ON "AiPersonality";
    CREATE POLICY "Users can insert their own AI personality" ON "AiPersonality"
      FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can update their own AI personality" ON "AiPersonality";
    CREATE POLICY "Users can update their own AI personality" ON "AiPersonality"
      FOR UPDATE USING ((select auth.uid())::text = "userId");

    DROP POLICY IF EXISTS "Users can delete their own AI personality" ON "AiPersonality";
    CREATE POLICY "Users can delete their own AI personality" ON "AiPersonality"
      FOR DELETE USING ((select auth.uid())::text = "userId");
    
    RAISE NOTICE '✅ AiPersonality policies updated';
  END IF;
END $$;

SELECT '🎉 RLS Performance otimizado! Apenas tabelas compatíveis foram atualizadas.' as resultado;

