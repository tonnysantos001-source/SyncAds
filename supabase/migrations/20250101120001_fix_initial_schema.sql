/*
# [Initial Schema Setup (Corrected)]
This script sets up the foundational tables for the Growth OS application. This version corrects a typo in the timestamp data type.

## Query Description: This is a structural migration that creates new tables. It is safe to run as it does not modify or delete existing data. It establishes the necessary schema for core application features.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the created tables)

## Structure Details:
- Tables Created:
  - `ai_models`: Stores API keys and configurations for different AI models.
  - `conversations`: Stores conversation sessions between users and the AI.
  - `messages`: Stores individual messages within each conversation.
- Columns: Includes IDs, foreign keys, text content, and timestamps.
- Indexes: Primary keys and foreign keys are indexed by default.

## Security Implications:
- RLS Status: Enabled by default on all new tables.
- Policy Changes: No policies are created in this script. Policies will need to be added later to allow user access.
- Auth Requirements: Tables are designed to be linked to `auth.users` via a `user_id` column.

## Performance Impact:
- Indexes: Primary and foreign keys are indexed, ensuring good query performance for joins and lookups.
- Triggers: No triggers are added in this script.
- Estimated Impact: Low. Initial setup of tables.
*/

-- =============================================
-- Table: ai_models
-- Stores API keys for different AI providers.
-- WARNING: Storing secrets in database columns is not recommended. Use Supabase Vault for production.
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL, -- e.g., 'OpenRouter', 'OpenAI', 'Midjourney'
    api_key TEXT NOT NULL, -- Encrypt this value or use Supabase Vault
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    model_type TEXT NOT NULL, -- e.g., 'language', 'image'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Comment on table and columns
COMMENT ON TABLE public.ai_models IS 'Stores API keys and configurations for different AI models.';
COMMENT ON COLUMN public.ai_models.api_key IS 'WARNING: Encrypt this value or use Supabase Vault for production environments.';


-- =============================================
-- Table: conversations
-- Stores conversation threads.
-- =============================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- Comment on table
COMMENT ON TABLE public.conversations IS 'Stores conversation threads between a user and the AI.';


-- =============================================
-- Table: messages
-- Stores individual messages within a conversation.
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- Comment on table
COMMENT ON TABLE public.messages IS 'Stores individual messages within a conversation thread.';
