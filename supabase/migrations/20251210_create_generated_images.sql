-- Migration: Create generated_images table
-- Purpose: Store AI-generated images with metadata and user association
-- Date: 2025-12-10
-- Create generated_images table
CREATE TABLE IF NOT EXISTS public.generated_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Image metadata
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    prompt TEXT NOT NULL,
    revised_prompt TEXT,
    -- DALL-E may revise prompts
    -- Generation parameters
    model VARCHAR(50) NOT NULL DEFAULT 'dall-e-3',
    style VARCHAR(20) DEFAULT 'vivid',
    -- vivid, natural
    size VARCHAR(20) DEFAULT '1024x1024',
    -- 1024x1024, 1792x1024, 1024x1792
    quality VARCHAR(10) DEFAULT 'standard',
    -- standard, hd
    -- User interaction
    liked BOOLEAN DEFAULT false,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    -- Cost tracking (optional)
    cost_cents INTEGER,
    -- Cost in cents
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    -- Soft delete
    -- Search
    search_vector TSVECTOR
);
-- Create indexes for performance
CREATE INDEX idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX idx_generated_images_created_at ON public.generated_images(created_at DESC);
CREATE INDEX idx_generated_images_model ON public.generated_images(model);
CREATE INDEX idx_generated_images_liked ON public.generated_images(user_id, liked)
WHERE liked = true;
CREATE INDEX idx_generated_images_search ON public.generated_images USING GIN(search_vector);
-- Create function to update search_vector
CREATE OR REPLACE FUNCTION update_generated_images_search_vector() RETURNS TRIGGER AS $$ BEGIN NEW.search_vector := to_tsvector(
        'portuguese',
        COALESCE(NEW.prompt, '') || ' ' || COALESCE(NEW.revised_prompt, '')
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for search_vector
CREATE TRIGGER trigger_update_generated_images_search_vector BEFORE
INSERT
    OR
UPDATE ON public.generated_images FOR EACH ROW EXECUTE FUNCTION update_generated_images_search_vector();
-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_generated_images_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for updated_at
CREATE TRIGGER trigger_update_generated_images_updated_at BEFORE
UPDATE ON public.generated_images FOR EACH ROW EXECUTE FUNCTION update_generated_images_updated_at();
-- Enable Row Level Security
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Policy: Users can view their own images
CREATE POLICY "Users can view own generated images" ON public.generated_images FOR
SELECT USING (auth.uid() = user_id);
-- Policy: Users can insert their own images
CREATE POLICY "Users can insert own generated images" ON public.generated_images FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Policy: Users can update their own images
CREATE POLICY "Users can update own generated images" ON public.generated_images FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Policy: Users can delete (soft) their own images
CREATE POLICY "Users can delete own generated images" ON public.generated_images FOR DELETE USING (auth.uid() = user_id);
-- Create helper functions
-- Function: Get user's recent images
CREATE OR REPLACE FUNCTION get_user_generated_images(
        p_user_id UUID,
        p_limit INTEGER DEFAULT 50,
        p_offset INTEGER DEFAULT 0
    ) RETURNS TABLE (
        id UUID,
        url TEXT,
        thumbnail_url TEXT,
        prompt TEXT,
        model VARCHAR,
        style VARCHAR,
        size VARCHAR,
        liked BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE
    ) AS $$ BEGIN RETURN QUERY
SELECT gi.id,
    gi.url,
    gi.thumbnail_url,
    gi.prompt,
    gi.model,
    gi.style,
    gi.size,
    gi.liked,
    gi.created_at
FROM public.generated_images gi
WHERE gi.user_id = p_user_id
    AND gi.deleted_at IS NULL
ORDER BY gi.created_at DESC
LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function: Search images by text
CREATE OR REPLACE FUNCTION search_generated_images(
        p_user_id UUID,
        p_query TEXT,
        p_limit INTEGER DEFAULT 20
    ) RETURNS TABLE (
        id UUID,
        url TEXT,
        prompt TEXT,
        relevance REAL
    ) AS $$ BEGIN RETURN QUERY
SELECT gi.id,
    gi.url,
    gi.prompt,
    ts_rank(
        gi.search_vector,
        plainto_tsquery('portuguese', p_query)
    ) AS relevance
FROM public.generated_images gi
WHERE gi.user_id = p_user_id
    AND gi.deleted_at IS NULL
    AND gi.search_vector @@ plainto_tsquery('portuguese', p_query)
ORDER BY relevance DESC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function: Get user stats
CREATE OR REPLACE FUNCTION get_user_image_stats(p_user_id UUID) RETURNS JSON AS $$
DECLARE v_stats JSON;
BEGIN
SELECT json_build_object(
        'total_images',
        COUNT(*),
        'liked_images',
        COUNT(*) FILTER (
            WHERE liked = true
        ),
        'total_downloads',
        COUNT(*) FILTER (
            WHERE downloaded_at IS NOT NULL
        ),
        'total_cost_cents',
        COALESCE(SUM(cost_cents), 0),
        'images_by_model',
        json_object_agg(model, model_count)
    ) INTO v_stats
FROM (
        SELECT model,
            COUNT(*) as model_count,
            liked,
            downloaded_at,
            cost_cents
        FROM public.generated_images
        WHERE user_id = p_user_id
            AND deleted_at IS NULL
        GROUP BY model,
            liked,
            downloaded_at,
            cost_cents
    ) AS stats;
RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant permissions
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.generated_images TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_generated_images TO authenticated;
GRANT EXECUTE ON FUNCTION search_generated_images TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_image_stats TO authenticated;
-- Add comment
COMMENT ON TABLE public.generated_images IS 'Stores AI-generated images with full metadata and user associations';