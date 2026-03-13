-- Migration: Create generated_audios table
-- Purpose: Store AI-generated audios with metadata and user association

CREATE TABLE IF NOT EXISTS public.generated_audios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Audio metadata
    url TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'tts', 'music', 'sfx'
    text TEXT,
    prompt TEXT,
    duration INTEGER,
    provider VARCHAR(50) NOT NULL,
    voice VARCHAR(100),
    
    -- User interaction
    liked BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_generated_audios_user_id ON public.generated_audios(user_id);
CREATE INDEX idx_generated_audios_created_at ON public.generated_audios(created_at DESC);
CREATE INDEX idx_generated_audios_type ON public.generated_audios(type);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_generated_audios_updated_at() RETURNS TRIGGER AS $$ 
BEGIN 
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_generated_audios_updated_at 
    BEFORE UPDATE ON public.generated_audios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_generated_audios_updated_at();

-- Enable Row Level Security
ALTER TABLE public.generated_audios ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: Users can view their own audios
CREATE POLICY "Users can view own generated audios" ON public.generated_audios 
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own audios
CREATE POLICY "Users can insert own generated audios" ON public.generated_audios 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own audios
CREATE POLICY "Users can update own generated audios" ON public.generated_audios 
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete (soft) their own audios
CREATE POLICY "Users can delete own generated audios" ON public.generated_audios 
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_audios TO authenticated;

COMMENT ON TABLE public.generated_audios IS 'Stores AI-generated audios with full metadata and user associations';
