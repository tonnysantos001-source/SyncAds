-- Enable vector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;
-- Documents table (Files uploaded by user: PDF, DOCX, etc)
CREATE TABLE IF NOT EXISTS memory_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_path TEXT,
    -- Storage path
    content_summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Chunks table (Split content for better semantic search)
CREATE TABLE IF NOT EXISTS memory_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES memory_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    -- The actual text chunk
    embedding vector(1536),
    -- OpenAI embedding size
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Page number, section, etc
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS memory_documents_user_id_idx ON memory_documents(user_id);
CREATE INDEX IF NOT EXISTS memory_chunks_user_id_idx ON memory_chunks(user_id);
CREATE INDEX IF NOT EXISTS memory_chunks_document_id_idx ON memory_chunks(document_id);
-- HNSW Index for fast vector search (ivfflat is simpler but HNSW is better for high dimensions)
CREATE INDEX IF NOT EXISTS memory_chunks_embedding_idx ON memory_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- RLS Policies
ALTER TABLE memory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own documents" ON memory_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own chunks" ON memory_chunks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Function to search memory (Cosine Similarity)
CREATE OR REPLACE FUNCTION match_memory_chunks(
        query_embedding vector(1536),
        match_threshold float,
        match_count int,
        p_user_id UUID
    ) RETURNS TABLE (
        id UUID,
        content TEXT,
        metadata JSONB,
        similarity float,
        document_filename TEXT
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT c.id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.filename as document_filename
FROM memory_chunks c
    JOIN memory_documents d ON c.document_id = d.id
WHERE c.user_id = p_user_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
ORDER BY c.embedding <=> query_embedding
LIMIT match_count;
END;
$$;