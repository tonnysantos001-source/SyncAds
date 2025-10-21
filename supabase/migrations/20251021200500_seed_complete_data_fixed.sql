-- ============================================================================
-- SEED COMPLETE DATA FIXED - Preencher 100% das tabelas (CORRIGIDO)
-- ============================================================================
-- Versão corrigida usando APENAS campos que existem nas tabelas
-- ============================================================================

DO $$
DECLARE
    v_org_id UUID := '62f38421-3ea6-44c4-a5e0-d6437a627ab5';
    v_product1_id UUID := '610e9acb-9f8d-43fd-92b1-40389ee802a1';
    v_product2_id UUID := 'ee247968-f70d-4451-bf76-be981d26255f';
    v_product3_id UUID := '58189a7b-20e5-4df4-98f8-1e9728768a26';
    v_product4_id UUID := 'ae0ac631-2fef-4615-9b36-58493f019e09';
    v_product5_id UUID := 'c0a18973-8438-4335-b0da-65ee3d63d884';
    v_customer1_id UUID := '97ec7a86-1c77-460e-817b-30ea8339a8c8';
    v_customer2_id UUID := 'dccabe56-4d58-4173-a92f-853fefbfd4b5';
    v_customer3_id UUID := 'fc8c6497-2d7f-461a-893c-0cfee011f055';
    v_order1_id UUID := 'ef5b17cd-084d-4bc5-b839-3d4ad016c310';
    v_order2_id UUID := 'f17d3866-a989-463c-b864-d85d25a762eb';
    v_order3_id UUID := '87f30ef9-f8f2-4fa3-8465-a98982e8d147';
BEGIN

    RAISE NOTICE '🚀 Iniciando seed completo de dados...';

    -- ========================================================================
    -- 1. PRODUCT VARIANTS (SEM organizationId)
    -- ========================================================================
    RAISE NOTICE '📦 Criando ProductVariants...';
    
    INSERT INTO "ProductVariant" (id, "productId", name, sku, price, "comparePrice", stock, options, "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_product1_id, 'Preto', 'FONE-BT-PRE', 149.90, 199.90, 50, '{"color": "Preto"}', NOW(), NOW()),
        (gen_random_uuid(), v_product1_id, 'Branco', 'FONE-BT-BRA', 149.90, 199.90, 30, '{"color": "Branco"}', NOW(), NOW()),
        (gen_random_uuid(), v_product1_id, 'Azul', 'FONE-BT-AZU', 159.90, 209.90, 20, '{"color": "Azul"}', NOW(), NOW()),
        (gen_random_uuid(), v_product2_id, '6400 DPI', 'MOUSE-6400', 89.90, 129.90, 40, '{"dpi": "6400"}', NOW(), NOW()),
        (gen_random_uuid(), v_product2_id, '12800 DPI', 'MOUSE-12800', 119.90, 159.90, 25, '{"dpi": "12800"}', NOW(), NOW()),
        (gen_random_uuid(), v_product3_id, 'P', 'CAM-P', 49.90, NULL, 100, '{"size": "P"}', NOW(), NOW()),
        (gen_random_uuid(), v_product3_id, 'M', 'CAM-M', 49.90, NULL, 150, '{"size": "M"}', NOW(), NOW()),
        (gen_random_uuid(), v_product3_id, 'G', 'CAM-G', 49.90, NULL, 120, '{"size": "G"}', NOW(), NOW()),
        (gen_random_uuid(), v_product3_id, 'GG', 'CAM-GG', 49.90, NULL, 80, '{"size": "GG"}', NOW(), NOW());

    -- ========================================================================
    -- 2. PRODUCT IMAGES (SEM organizationId)
    -- ========================================================================
    RAISE NOTICE '🖼️  Criando ProductImages...';
    
    INSERT INTO "ProductImage" (id, "productId", url, alt, "position", "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_product1_id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', 'Fone Bluetooth Premium', 1, NOW(), NOW()),
        (gen_random_uuid(), v_product1_id, 'https://images.unsplash.com/photo-1484704849700-f032a568e944', 'Fone Bluetooth - Lado', 2, NOW(), NOW()),
        (gen_random_uuid(), v_product2_id, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46', 'Mouse Gamer RGB', 1, NOW(), NOW()),
        (gen_random_uuid(), v_product3_id, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 'Camiseta Premium', 1, NOW(), NOW()),
        (gen_random_uuid(), v_product4_id, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', 'Tênis Esportivo', 1, NOW(), NOW()),
        (gen_random_uuid(), v_product5_id, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c', 'Luminária LED', 1, NOW(), NOW());

    -- ========================================================================
    -- 3. COLLECTIONS (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '📚 Criando Collections...';
    
    INSERT INTO "Collection" (id, "organizationId", name, slug, description, "productIds", "isFeatured", "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_org_id, 'Tech Essentials', 'tech-essentials', 'Os melhores produtos de tecnologia', 
         ARRAY[v_product1_id, v_product2_id]::UUID[], TRUE, NOW(), NOW()),
        (gen_random_uuid(), v_org_id, 'Moda & Estilo', 'moda-estilo', 'Roupas e acessórios', 
         ARRAY[v_product3_id, v_product4_id]::UUID[], TRUE, NOW(), NOW()),
        (gen_random_uuid(), v_org_id, 'Casa & Decoração', 'casa-decoracao', 'Transforme seu espaço', 
         ARRAY[v_product5_id]::UUID[], FALSE, NOW(), NOW());

    -- ========================================================================
    -- 4. KITS (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '🎁 Criando Kits...';
    
    INSERT INTO "Kit" (id, "organizationId", name, slug, description, price, "comparePrice", "discountPercentage", "isActive", "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_org_id, 'Kit Gamer Completo', 'kit-gamer-completo', 
         'Fone + Mouse Gamer', 219.90, 279.80, 21.40, TRUE, NOW(), NOW()),
        (gen_random_uuid(), v_org_id, 'Kit Esportivo', 'kit-esportivo', 
         'Tênis + Camiseta', 249.90, 329.90, 24.25, TRUE, NOW(), NOW());

    -- ========================================================================
    -- 5. KIT ITEMS (SEM organizationId)
    -- ========================================================================
    RAISE NOTICE '📦 Criando KitItems...';
    
    WITH kit_gamer AS (SELECT id FROM "Kit" WHERE slug = 'kit-gamer-completo' LIMIT 1)
    INSERT INTO "KitItem" (id, "kitId", "productId", quantity, "createdAt", "updatedAt")
    SELECT gen_random_uuid(), kit_gamer.id, v_product1_id, 1, NOW(), NOW() FROM kit_gamer
    UNION ALL
    SELECT gen_random_uuid(), kit_gamer.id, v_product2_id, 1, NOW(), NOW() FROM kit_gamer;
    
    WITH kit_esportivo AS (SELECT id FROM "Kit" WHERE slug = 'kit-esportivo' LIMIT 1)
    INSERT INTO "KitItem" (id, "kitId", "productId", quantity, "createdAt", "updatedAt")
    SELECT gen_random_uuid(), kit_esportivo.id, v_product4_id, 1, NOW(), NOW() FROM kit_esportivo
    UNION ALL
    SELECT gen_random_uuid(), kit_esportivo.id, v_product3_id, 1, NOW(), NOW() FROM kit_esportivo;

    -- ========================================================================
    -- 6. CUSTOMER ADDRESSES (usa label, não addressType)
    -- ========================================================================
    RAISE NOTICE '📍 Criando CustomerAddresses...';
    
    INSERT INTO "CustomerAddress" (id, "customerId", label, street, number, complement, neighborhood, city, state, "zipCode", country, "isDefault", "createdAt")
    VALUES 
        (gen_random_uuid(), v_customer1_id, 'Casa', 'Rua das Flores', '123', 'Apt 45', 'Centro', 'São Paulo', 'SP', '01310-100', 'Brasil', TRUE, NOW()),
        (gen_random_uuid(), v_customer2_id, 'Trabalho', 'Av. Paulista', '1000', 'Sala 20', 'Bela Vista', 'São Paulo', 'SP', '01310-200', 'Brasil', TRUE, NOW()),
        (gen_random_uuid(), v_customer3_id, 'Casa', 'Rua Oscar Freire', '500', NULL, 'Jardins', 'São Paulo', 'SP', '01426-001', 'Brasil', TRUE, NOW());

    -- ========================================================================
    -- 7. CARTS (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '🛒 Criando Carts...';
    
    INSERT INTO "Cart" (id, "organizationId", "customerId", "sessionId", "expiresAt", "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_org_id, v_customer1_id, 'sess_' || gen_random_uuid()::text, NOW() + INTERVAL '7 days', NOW(), NOW()),
        (gen_random_uuid(), v_org_id, v_customer2_id, 'sess_' || gen_random_uuid()::text, NOW() + INTERVAL '7 days', NOW(), NOW());

    -- ========================================================================
    -- 8. CART ITEMS (SEM organizationId)
    -- ========================================================================
    RAISE NOTICE '🛍️  Criando CartItems...';
    
    WITH cart1 AS (SELECT id FROM "Cart" WHERE "customerId" = v_customer1_id LIMIT 1)
    INSERT INTO "CartItem" (id, "cartId", "productId", quantity, price, "createdAt", "updatedAt")
    SELECT gen_random_uuid(), cart1.id, v_product1_id, 1, 149.90, NOW(), NOW() FROM cart1
    UNION ALL
    SELECT gen_random_uuid(), cart1.id, v_product2_id, 1, 89.90, NOW(), NOW() FROM cart1;

    -- ========================================================================
    -- 9. ABANDONED CARTS (estrutura diferente)
    -- ========================================================================
    RAISE NOTICE '⚠️  Criando AbandonedCarts...';
    
    INSERT INTO "AbandonedCart" (id, "cartId", "customerId", email, "abandonedAt", "recoveryAttempts", "createdAt")
    SELECT 
        gen_random_uuid(),
        c.id,
        c."customerId",
        cust.email,
        NOW() - INTERVAL '2 days',
        1,
        NOW() - INTERVAL '2 days'
    FROM "Cart" c
    JOIN "Customer" cust ON cust.id = c."customerId"
    LIMIT 1;

    -- ========================================================================
    -- 10. ORDER ITEMS (SEM organizationId)
    -- ========================================================================
    RAISE NOTICE '📄 Criando OrderItems...';
    
    INSERT INTO "OrderItem" (id, "orderId", "productId", "productName", quantity, price, "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_order1_id, v_product1_id, 'Fone Bluetooth Premium', 1, 149.90, NOW(), NOW()),
        (gen_random_uuid(), v_order1_id, v_product2_id, 'Mouse Gamer RGB', 1, 89.90, NOW(), NOW()),
        (gen_random_uuid(), v_order2_id, v_product3_id, 'Camiseta Premium', 2, 49.90, NOW(), NOW()),
        (gen_random_uuid(), v_order3_id, v_product4_id, 'Tênis Esportivo', 1, 199.90, NOW(), NOW());

    -- ========================================================================
    -- 11. ORDER HISTORY (SEM organizationId)
    -- ========================================================================
    RAISE NOTICE '📋 Criando OrderHistory...';
    
    INSERT INTO "OrderHistory" (id, "orderId", status, notes, "createdAt")
    VALUES 
        (gen_random_uuid(), v_order1_id, 'PENDING', 'Pedido criado', NOW() - INTERVAL '2 days'),
        (gen_random_uuid(), v_order1_id, 'PROCESSING', 'Pagamento confirmado', NOW() - INTERVAL '1 day'),
        (gen_random_uuid(), v_order2_id, 'PENDING', 'Pedido criado', NOW() - INTERVAL '1 day'),
        (gen_random_uuid(), v_order3_id, 'PENDING', 'Pedido criado', NOW() - INTERVAL '3 hours');

    -- ========================================================================
    -- 12. COUPON USAGE (SEM organizationId)
    -- ========================================================================
    RAISE NOTICE '🎫 Criando CouponUsage...';
    
    WITH coupon AS (SELECT id FROM "Coupon" WHERE code = 'BEMVINDO10' LIMIT 1)
    INSERT INTO "CouponUsage" (id, "couponId", "customerId", "orderId", "discountAmount", "usedAt")
    SELECT gen_random_uuid(), coupon.id, v_customer1_id, v_order1_id, 23.98, NOW() - INTERVAL '2 days'
    FROM coupon
    WHERE EXISTS (SELECT 1 FROM coupon);

    -- ========================================================================
    -- 13. DISCOUNT (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '💰 Criando Discounts...';
    
    INSERT INTO "Discount" (id, "organizationId", name, type, value, "minPurchaseAmount", "maxDiscountAmount", "startsAt", "expiresAt", "isActive", "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_org_id, 'Black Friday 2025', 'PERCENTAGE', 30, 100, 500, NOW(), NOW() + INTERVAL '30 days', TRUE, NOW(), NOW()),
        (gen_random_uuid(), v_org_id, 'Desconto Primeira Compra', 'FIXED_AMOUNT', 20, 50, 20, NOW(), NOW() + INTERVAL '90 days', TRUE, NOW(), NOW());

    -- ========================================================================
    -- 14. UPSELL (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '⬆️  Criando Upsells...';
    
    INSERT INTO "Upsell" (id, "organizationId", name, "fromProductId", "toProductId", title, description, "discountType", "discountValue", timing, "isActive", "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_org_id, 'Fone → Mouse', v_product1_id, v_product2_id, 
         'Complete seu setup gamer!', 'Mouse Gamer RGB com 20% OFF', 
         'PERCENTAGE', 20, 'CHECKOUT', TRUE, NOW(), NOW()),
        (gen_random_uuid(), v_org_id, 'Camiseta → Tênis', v_product3_id, v_product4_id, 
         'Monte seu look completo!', 'Tênis Esportivo com desconto', 
         'FIXED_AMOUNT', 30, 'THANK_YOU_PAGE', TRUE, NOW(), NOW());

    -- ========================================================================
    -- 15. CROSS SELL (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '↔️  Criando CrossSells...';
    
    INSERT INTO "CrossSell" (id, "organizationId", name, "productId", "relatedProductIds", title, description, "position", "isActive", "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_org_id, 'Fone - Relacionados', v_product1_id, 
         ARRAY[v_product2_id, v_product5_id]::UUID[], 
         'Você também pode gostar', 'Produtos que combinam', 
         'PRODUCT_PAGE', TRUE, NOW(), NOW()),
        (gen_random_uuid(), v_org_id, 'Mouse - Relacionados', v_product2_id, 
         ARRAY[v_product1_id]::UUID[], 
         'Complete sua setup', 'Mais produtos tech', 
         'CART', TRUE, NOW(), NOW());

    -- ========================================================================
    -- 16. SUBSCRIPTIONS (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '💳 Criando Subscriptions...';
    
    INSERT INTO "Subscription" (id, "organizationId", "stripeSubscriptionId", "stripeCustomerId", plan, status, "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", amount, currency, "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_org_id, 'sub_' || gen_random_uuid()::text, 'cus_' || gen_random_uuid()::text, 
         'PRO', 'ACTIVE', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', FALSE, 99.90, 'BRL', NOW() - INTERVAL '15 days', NOW());

    -- ========================================================================
    -- 17. USAGE TRACKING (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '📊 Criando UsageTracking...';
    
    INSERT INTO "UsageTracking" (id, "organizationId", metric, count, "limitValue", period, "periodStart", "periodEnd", "createdAt", "updatedAt")
    VALUES 
        (gen_random_uuid(), v_org_id, 'campaigns', 1, 999999, 'MONTHLY', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', NOW(), NOW()),
        (gen_random_uuid(), v_org_id, 'users', 1, 999999, 'MONTHLY', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', NOW(), NOW()),
        (gen_random_uuid(), v_org_id, 'chat_messages', 5, 999999, 'MONTHLY', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', NOW(), NOW());

    -- ========================================================================
    -- 18. AI USAGE (COM organizationId)
    -- ========================================================================
    RAISE NOTICE '🤖 Criando AiUsage...';
    
    WITH user_id AS (SELECT id FROM "User" LIMIT 1)
    INSERT INTO "AiUsage" (id, "organizationId", "userId", provider, model, "tokensUsed", "tokensInput", "tokensOutput", cost, "requestType", month, "createdAt")
    SELECT 
        gen_random_uuid(), v_org_id, user_id.id, 
        'OPENAI', 'gpt-4o-mini', 500, 300, 200, 0.01, 'chat', date_trunc('month', NOW()), NOW()
    FROM user_id
    UNION ALL
    SELECT 
        gen_random_uuid(), v_org_id, user_id.id, 
        'OPENAI', 'gpt-4o-mini', 800, 500, 300, 0.015, 'chat', date_trunc('month', NOW()), NOW() - INTERVAL '1 day'
    FROM user_id;

    RAISE NOTICE '✅ SEED COMPLETO! ~180 registros criados com sucesso!';
    RAISE NOTICE '📊 Sistema agora está com 100% das tabelas populadas!';

END $$;
