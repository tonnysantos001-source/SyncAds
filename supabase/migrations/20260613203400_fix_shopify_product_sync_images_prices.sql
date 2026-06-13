-- =====================================================
-- MIGRATION: Fix Shopify Product Sync Images and Prices
-- Date: 2026-06-13
-- Description: Updates the sync_shopify_products_to_main function
--              to extract images list, featuredImage and correct
--              minPrice/maxPrice/inventory from shopifyData.
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_shopify_products_to_main()
 RETURNS TABLE(synced_count integer, error_count integer)
 LANGUAGE plpgsql
 SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  v_synced INTEGER := 0;
  v_errors INTEGER := 0;
  v_product RECORD;
  v_product_id UUID;
  v_image JSONB;
  v_image_index INTEGER;
  v_calculated_price DECIMAL;
  v_calculated_compare_price DECIMAL;
  v_calculated_stock INTEGER;
BEGIN
  FOR v_product IN 
    SELECT * FROM "ShopifyProduct" 
    WHERE "lastSyncAt" IS NOT NULL
    ORDER BY "lastSyncAt" DESC
  LOOP
    BEGIN
      -- Calcular preço se minPrice for nulo ou zero
      IF v_product."minPrice" IS NOT NULL AND v_product."minPrice" > 0 THEN
        v_calculated_price := v_product."minPrice";
      ELSE
        SELECT MIN(COALESCE((val->>'price')::DECIMAL, 0)) INTO v_calculated_price 
        FROM jsonb_array_elements(v_product."shopifyData"->'variants') val;
        v_calculated_price := COALESCE(v_calculated_price, 0);
      END IF;

      -- Calcular compareAtPrice se maxPrice for nulo
      IF v_product."maxPrice" IS NOT NULL THEN
        v_calculated_compare_price := v_product."maxPrice";
      ELSE
        SELECT MAX((val->>'compare_at_price')::DECIMAL) INTO v_calculated_compare_price 
        FROM jsonb_array_elements(v_product."shopifyData"->'variants') val;
      END IF;

      -- Calcular estoque se totalInventory for nulo ou zero
      IF v_product."totalInventory" IS NOT NULL AND v_product."totalInventory" > 0 THEN
        v_calculated_stock := v_product."totalInventory";
      ELSE
        SELECT SUM(COALESCE((val->>'inventory_quantity')::INTEGER, 0)) INTO v_calculated_stock 
        FROM jsonb_array_elements(v_product."shopifyData"->'variants') val;
        v_calculated_stock := COALESCE(v_calculated_stock, 0);
      END IF;

      -- Verificar se produto já existe
      SELECT id INTO v_product_id
      FROM "Product"
      WHERE metadata->>'shopifyId' = v_product.id::TEXT;
      
      IF v_product_id IS NULL THEN
        -- Criar novo produto
        INSERT INTO "Product" (
          "userId",
          name,
          slug,
          description,
          price,
          "comparePrice",
          sku,
          stock,
          "trackStock",
          status,
          "isActive",
          tags,
          metadata
        ) VALUES (
          v_product."userId",
          v_product.title,
          v_product.handle,
          v_product.description,
          v_calculated_price,
          v_calculated_compare_price,
          v_product.handle,
          v_calculated_stock,
          true,
          CASE WHEN v_product.status = 'active' THEN 'ACTIVE' ELSE 'DRAFT' END,
          v_product.status = 'active',
          v_product.tags,
          jsonb_build_object(
            'shopifyId', v_product.id::TEXT,
            'shopifyHandle', v_product.handle,
            'vendor', v_product.vendor,
            'productType', v_product."productType",
            'featuredImage', COALESCE(v_product."featuredImage", v_product."shopifyData"->'image'->>'src'),
            'images', COALESCE(v_product.images, v_product."shopifyData"->'images'),
            'syncedAt', NOW()
          )
        )
        RETURNING id INTO v_product_id;
        
        -- Inserir imagens do produto
        IF v_product.images IS NOT NULL AND jsonb_array_length(v_product.images) > 0 THEN
          v_image_index := 0;
          FOR v_image IN SELECT * FROM jsonb_array_elements(v_product.images)
          LOOP
            INSERT INTO "ProductImage" (
              "productId",
              url,
              "altText",
              position
            ) VALUES (
              v_product_id,
              v_image->>'src',
              COALESCE(v_image->>'alt', v_product.title),
              v_image_index
            );
            v_image_index := v_image_index + 1;
          END LOOP;
        ELSIF v_product."shopifyData"->'images' IS NOT NULL AND jsonb_array_length(v_product."shopifyData"->'images') > 0 THEN
          v_image_index := 0;
          FOR v_image IN SELECT * FROM jsonb_array_elements(v_product."shopifyData"->'images')
          LOOP
            INSERT INTO "ProductImage" (
              "productId",
              url,
              "altText",
              position
            ) VALUES (
              v_product_id,
              v_image->>'src',
              COALESCE(v_image->>'alt', v_product.title),
              v_image_index
            );
            v_image_index := v_image_index + 1;
          END LOOP;
        END IF;
        
        v_synced := v_synced + 1;
      ELSE
        -- Atualizar produto existente
        UPDATE "Product"
        SET
          name = v_product.title,
          slug = v_product.handle,
          description = v_product.description,
          price = v_calculated_price,
          "comparePrice" = v_calculated_compare_price,
          stock = v_calculated_stock,
          status = CASE WHEN v_product.status = 'active' THEN 'ACTIVE' ELSE 'DRAFT' END,
          "isActive" = v_product.status = 'active',
          tags = v_product.tags,
          metadata = metadata || jsonb_build_object(
            'shopifyId', v_product.id::TEXT,
            'featuredImage', COALESCE(v_product."featuredImage", v_product."shopifyData"->'image'->>'src'),
            'images', COALESCE(v_product.images, v_product."shopifyData"->'images'),
            'syncedAt', NOW()
          ),
          "updatedAt" = NOW()
        WHERE id = v_product_id;
        
        -- Deletar imagens antigas e inserir novas
        DELETE FROM "ProductImage" WHERE "productId" = v_product_id;
        
        IF v_product.images IS NOT NULL AND jsonb_array_length(v_product.images) > 0 THEN
          v_image_index := 0;
          FOR v_image IN SELECT * FROM jsonb_array_elements(v_product.images)
          LOOP
            INSERT INTO "ProductImage" (
              "productId",
              url,
              "altText",
              position
            ) VALUES (
              v_product_id,
              v_image->>'src',
              COALESCE(v_image->>'alt', v_product.title),
              v_image_index
            );
            v_image_index := v_image_index + 1;
          END LOOP;
        ELSIF v_product."shopifyData"->'images' IS NOT NULL AND jsonb_array_length(v_product."shopifyData"->'images') > 0 THEN
          v_image_index := 0;
          FOR v_image IN SELECT * FROM jsonb_array_elements(v_product."shopifyData"->'images')
          LOOP
            INSERT INTO "ProductImage" (
              "productId",
              url,
              "altText",
              position
            ) VALUES (
              v_product_id,
              v_image->>'src',
              COALESCE(v_image->>'alt', v_product.title),
              v_image_index
            );
            v_image_index := v_image_index + 1;
          END LOOP;
        END IF;
        
        v_synced := v_synced + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING 'Error syncing product %: %', v_product.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_synced, v_errors;
END;
$function$;
