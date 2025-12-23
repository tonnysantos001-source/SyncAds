-- Create storage bucket for screenshots verification
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true) ON CONFLICT (id) DO NOTHING;
-- Policy to allow authenticated uploads (Extension users)
CREATE POLICY "Authenticated users can upload screenshots" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'screenshots');
-- Policy to allow public viewing (so valid URLs work for LLM)
CREATE POLICY "Public can view screenshots" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'screenshots');