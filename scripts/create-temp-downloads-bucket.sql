-- =====================================================
-- CREATE TEMP DOWNLOADS BUCKET
-- Data: 25/10/2025
-- =====================================================

-- Criar bucket para downloads temporários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-downloads', 
  'temp-downloads', 
  true, 
  104857600, -- 100MB
  ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload apenas para usuários autenticados
CREATE POLICY "Users can upload temp files" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'temp-downloads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir download público (arquivos temporários)
CREATE POLICY "Public can download temp files" ON storage.objects
FOR SELECT 
USING (bucket_id = 'temp-downloads');

-- Política para permitir delete apenas do próprio usuário
CREATE POLICY "Users can delete their temp files" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'temp-downloads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
