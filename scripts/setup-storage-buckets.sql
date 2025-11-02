-- ============================================
-- SCRIPT DE CONFIGURAÇÃO DE STORAGE BUCKETS
-- SyncAds - Checkout Images
-- ============================================

-- Criar bucket para imagens do checkout
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'checkout-images',
  'checkout-images',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- POLÍTICAS DE ACESSO
-- ============================================

-- Política: Leitura pública (qualquer pessoa pode ver as imagens)
CREATE POLICY "Public read access for checkout images"
ON storage.objects FOR SELECT
USING (bucket_id = 'checkout-images');

-- Política: Upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload checkout images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'checkout-images'
  AND auth.role() = 'authenticated'
);

-- Política: Usuários podem atualizar suas próprias imagens
CREATE POLICY "Users can update their own checkout images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'checkout-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'checkout-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Usuários podem deletar suas próprias imagens
CREATE POLICY "Users can delete their own checkout images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'checkout-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- BUCKET ADICIONAL PARA PRODUTOS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Política: Leitura pública para imagens de produtos
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Política: Upload de produtos apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Política: Usuários podem atualizar suas próprias imagens de produtos
CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Usuários podem deletar suas próprias imagens de produtos
CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar buckets criados
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('checkout-images', 'product-images');

-- Verificar políticas criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%checkout%' OR policyname LIKE '%product%';
