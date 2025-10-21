-- ============================================================================
-- SEED COMPLETO FINAL - Popular 100% das tabelas restantes
-- ============================================================================
-- Execute este SQL diretamente no SQL Editor do Supabase
-- ============================================================================

-- Product Images
INSERT INTO "ProductImage" (id, "productId", url, alt, "position", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '610e9acb-9f8d-43fd-92b1-40389ee802a1', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', 'Fone Bluetooth Premium', 1, NOW(), NOW()),
    (gen_random_uuid(), 'ee247968-f70d-4451-bf76-be981d26255f', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46', 'Mouse Gamer RGB', 1, NOW(), NOW()),
    (gen_random_uuid(), '58189a7b-20e5-4df4-98f8-1e9728768a26', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 'Camiseta Premium', 1, NOW(), NOW());

-- Collections
INSERT INTO "Collection" (id, "organizationId", name, slug, description, "productIds", "isFeatured", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Tech Essentials', 'tech-essentials', 'Melhores produtos tech', 
     ARRAY['610e9acb-9f8d-43fd-92b1-40389ee802a1', 'ee247968-f70d-4451-bf76-be981d26255f']::UUID[], TRUE, NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Moda & Estilo', 'moda-estilo', 'Roupas e acessórios', 
     ARRAY['58189a7b-20e5-4df4-98f8-1e9728768a26']::UUID[], TRUE, NOW(), NOW());

-- Kits
INSERT INTO "Kit" (id, "organizationId", name, slug, description, price, "comparePrice", "discountPercentage", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Kit Gamer Completo', 'kit-gamer-completo', 
     'Fone + Mouse Gamer', 219.90, 279.80, 21.40, TRUE, NOW(), NOW());

-- Kit Items
INSERT INTO "KitItem" (id, "kitId", "productId", quantity, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    (SELECT id FROM "Kit" WHERE slug = 'kit-gamer-completo'),
    '610e9acb-9f8d-43fd-92b1-40389ee802a1',
    1,
    NOW(),
    NOW()
UNION ALL
SELECT 
    gen_random_uuid(),
    (SELECT id FROM "Kit" WHERE slug = 'kit-gamer-completo'),
    'ee247968-f70d-4451-bf76-be981d26255f',
    1,
    NOW(),
    NOW();

-- Customer Addresses
INSERT INTO "CustomerAddress" (id, "customerId", label, street, number, neighborhood, city, state, "zipCode", country, "isDefault", "createdAt")
VALUES 
    (gen_random_uuid(), '97ec7a86-1c77-460e-817b-30ea8339a8c8', 'Casa', 'Rua das Flores', '123', 'Centro', 'São Paulo', 'SP', '01310-100', 'Brasil', TRUE, NOW()),
    (gen_random_uuid(), 'dccabe56-4d58-4173-a92f-853fefbfd4b5', 'Trabalho', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', '01310-200', 'Brasil', TRUE, NOW());

-- Carts
INSERT INTO "Cart" (id, "organizationId", "customerId", "sessionId", "expiresAt", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', '97ec7a86-1c77-460e-817b-30ea8339a8c8', 'sess_' || gen_random_uuid()::text, NOW() + INTERVAL '7 days', NOW(), NOW());

-- Cart Items
INSERT INTO "CartItem" (id, "cartId", "productId", quantity, price, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    (SELECT id FROM "Cart" WHERE "customerId" = '97ec7a86-1c77-460e-817b-30ea8339a8c8' LIMIT 1),
    '610e9acb-9f8d-43fd-92b1-40389ee802a1',
    1,
    149.90,
    NOW(),
    NOW();

-- Abandoned Carts
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

-- Order Items
INSERT INTO "OrderItem" (id, "orderId", "productId", "productName", quantity, price, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', '610e9acb-9f8d-43fd-92b1-40389ee802a1', 'Fone Bluetooth Premium', 1, 149.90, NOW(), NOW()),
    (gen_random_uuid(), 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', 'ee247968-f70d-4451-bf76-be981d26255f', 'Mouse Gamer RGB', 1, 89.90, NOW(), NOW());

-- Order History
INSERT INTO "OrderHistory" (id, "orderId", status, notes, "createdAt")
VALUES 
    (gen_random_uuid(), 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', 'PENDING', 'Pedido criado', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', 'PROCESSING', 'Pagamento confirmado', NOW() - INTERVAL '1 day');

-- Coupon Usage
INSERT INTO "CouponUsage" (id, "couponId", "customerId", "orderId", "discountAmount", "usedAt")
SELECT gen_random_uuid(), id, '97ec7a86-1c77-460e-817b-30ea8339a8c8', 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', 23.98, NOW() - INTERVAL '2 days'
FROM "Coupon" WHERE code = 'BEMVINDO10' LIMIT 1;

-- Discounts
INSERT INTO "Discount" (id, "organizationId", name, type, value, "minPurchaseAmount", "maxDiscountAmount", "startsAt", "expiresAt", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Black Friday 2025', 'PERCENTAGE', 30, 100, 500, NOW(), NOW() + INTERVAL '30 days', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Primeira Compra', 'FIXED_AMOUNT', 20, 50, 20, NOW(), NOW() + INTERVAL '90 days', TRUE, NOW(), NOW());

-- Upsells
INSERT INTO "Upsell" (id, "organizationId", name, "fromProductId", "toProductId", title, description, "discountType", "discountValue", timing, "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Fone → Mouse', '610e9acb-9f8d-43fd-92b1-40389ee802a1', 'ee247968-f70d-4451-bf76-be981d26255f', 
     'Complete seu setup gamer!', 'Mouse Gamer RGB com 20% OFF', 'PERCENTAGE', 20, 'CHECKOUT', TRUE, NOW(), NOW());

-- CrossSells
INSERT INTO "CrossSell" (id, "organizationId", name, "productId", "relatedProductIds", title, description, "position", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Fone - Relacionados', '610e9acb-9f8d-43fd-92b1-40389ee802a1', 
     ARRAY['ee247968-f70d-4451-bf76-be981d26255f']::UUID[], 
     'Você também pode gostar', 'Produtos que combinam', 'PRODUCT_PAGE', TRUE, NOW(), NOW());

-- Subscriptions
INSERT INTO "Subscription" (id, "organizationId", "stripeSubscriptionId", "stripeCustomerId", plan, status, "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", amount, currency, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'sub_' || gen_random_uuid()::text, 'cus_' || gen_random_uuid()::text, 
     'PRO', 'ACTIVE', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', FALSE, 99.90, 'BRL', NOW() - INTERVAL '15 days', NOW());

-- Usage Tracking
INSERT INTO "UsageTracking" (id, "organizationId", metric, count, "limitValue", period, "periodStart", "periodEnd", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'campaigns', 1, 999999, 'MONTHLY', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'chat_messages', 5, 999999, 'MONTHLY', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', NOW(), NOW());

-- AI Usage
INSERT INTO "AiUsage" (id, "organizationId", "userId", provider, model, "tokensUsed", "tokensInput", "tokensOutput", cost, "requestType", month, "createdAt")
SELECT 
    gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', id, 
    'OPENAI', 'gpt-4o-mini', 500, 300, 200, 0.01, 'chat', date_trunc('month', NOW()), NOW()
FROM "User" LIMIT 1;

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================

SELECT 
    'ProductVariant' as tabela, COUNT(*) as registros FROM "ProductVariant"
UNION ALL SELECT 'ProductImage', COUNT(*) FROM "ProductImage"
UNION ALL SELECT 'Collection', COUNT(*) FROM "Collection"
UNION ALL SELECT 'Kit', COUNT(*) FROM "Kit"
UNION ALL SELECT 'GatewayConfig', COUNT(*) FROM "GatewayConfig"
ORDER BY tabela;
