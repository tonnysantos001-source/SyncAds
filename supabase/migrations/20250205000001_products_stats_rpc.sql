-- Migration: RPC para produtos com estatísticas
-- Criado em: 2025-02-05
-- Descrição: Função consolidada para buscar produtos com stats de vendas

-- Remover função se existir
DROP FUNCTION IF EXISTS get_products_with_stats(TEXT, INT, INT, TEXT, TEXT);

-- Criar função para buscar produtos com estatísticas
CREATE OR REPLACE FUNCTION get_products_with_stats(
  p_user_id TEXT,
  p_page_offset INT DEFAULT 0,
  p_page_limit INT DEFAULT 50,
  p_search_term TEXT DEFAULT '',
  p_status TEXT DEFAULT 'all'
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  compare_price DECIMAL,
  sku TEXT,
  stock INT,
  status TEXT,
  category_id UUID,
  user_id TEXT,
  organization_id TEXT,
  shopify_product_id TEXT,
  slug TEXT,
  image_url TEXT,
  low_stock_threshold INT,
  track_stock BOOLEAN,
  is_featured BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_sales BIGINT,
  revenue DECIMAL,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Calcular total count (para paginação)
  SELECT COUNT(*)
  INTO v_total_count
  FROM "Product" p
  WHERE p."userId" = p_user_id
    AND (p_search_term = '' OR
         p.name ILIKE '%' || p_search_term || '%' OR
         COALESCE(p.sku, '') ILIKE '%' || p_search_term || '%' OR
         COALESCE(p.description, '') ILIKE '%' || p_search_term || '%')
    AND (p_status = 'all' OR p.status = p_status);

  -- Retornar produtos com estatísticas
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p."comparePrice" as compare_price,
    p.sku,
    p.stock,
    p.status::TEXT,
    p."categoryId" as category_id,
    p."userId" as user_id,
    p."organizationId" as organization_id,
    p."shopifyProductId" as shopify_product_id,
    p.slug,
    p."imageUrl" as image_url,
    p."lowStockThreshold" as low_stock_threshold,
    p."trackStock" as track_stock,
    p."isFeatured" as is_featured,
    p."isActive" as is_active,
    p."createdAt" as created_at,
    p."updatedAt" as updated_at,
    COALESCE(COUNT(oi.id), 0) as total_sales,
    COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
    v_total_count as total_count
  FROM "Product" p
  LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
  WHERE p."userId" = p_user_id
    AND (p_search_term = '' OR
         p.name ILIKE '%' || p_search_term || '%' OR
         COALESCE(p.sku, '') ILIKE '%' || p_search_term || '%' OR
         COALESCE(p.description, '') ILIKE '%' || p_search_term || '%')
    AND (p_status = 'all' OR p.status = p_status)
  GROUP BY
    p.id, p.name, p.description, p.price, p."comparePrice",
    p.sku, p.stock, p.status, p."categoryId", p."userId",
    p."organizationId", p."shopifyProductId", p.slug, p."imageUrl",
    p."lowStockThreshold", p."trackStock", p."isFeatured",
    p."isActive", p."createdAt", p."updatedAt"
  ORDER BY p."createdAt" DESC
  LIMIT p_page_limit
  OFFSET p_page_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_products_with_stats(TEXT, INT, INT, TEXT, TEXT) TO authenticated;

-- Comentários
COMMENT ON FUNCTION get_products_with_stats IS 'Retorna produtos com estatísticas de vendas (total_sales, revenue) com suporte a paginação e busca';
