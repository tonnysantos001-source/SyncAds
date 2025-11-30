-- Schema para temp_files
CREATE TABLE IF NOT EXISTS temp_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  signed_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_temp_files_expires ON temp_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_files_user ON temp_files(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_files_created ON temp_files(created_at DESC);

-- RLS Policies
ALTER TABLE temp_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files" ON temp_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON temp_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON temp_files
  FOR DELETE USING (auth.uid() = user_id);
