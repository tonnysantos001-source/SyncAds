-- ============================================================================
-- SEED FINAL 100% - SQL pronto para executar no Supabase SQL Editor
-- ============================================================================
-- Cole este script completo no SQL Editor do Supabase e execute
-- ============================================================================

-- Kits (campos corretos: totalPrice, discount, finalPrice, status)
INSERT INTO "Kit" (id, "organizationId", name, slug, description, "totalPrice", discount, "finalPrice", status, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Kit Gamer Completo', 'kit-gamer-completo', 
     'Fone Bluetooth Premium + Mouse Gamer RGB', 279.80, 59.90, 219.90, 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Kit Esportivo', 'kit-esportivo', 
     'Tênis Esportivo + Camiseta Premium', 329.90, 80.00, 249.90, 'ACTIVE', NOW(), NOW());

-- Kit Items
INSERT INTO "KitItem" (id, "kitId", "productId", quantity, "createdAt", "updatedAt")
SELECT gen_random_uuid(), (SELECT id FROM "Kit" WHERE slug = 'kit-gamer-completo'), '610e9acb-9f8d-43fd-92b1-40389ee802a1'::UUID, 1, NOW(), NOW()
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM "Kit" WHERE slug = 'kit-gamer-completo'), 'ee247968-f70d-4451-bf76-be981d26255f'::UUID, 1, NOW(), NOW()
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM "Kit" WHERE slug = 'kit-esportivo'), 'ae0ac631-2fef-4615-9b36-58493f019e09'::UUID, 1, NOW(), NOW()
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM "Kit" WHERE slug = 'kit-esportivo'), '58189a7b-20e5-4df4-98f8-1e9728768a26'::UUID, 1, NOW(), NOW();

-- Customer Addresses
INSERT INTO "CustomerAddress" (id, "customerId", label, street, number, complement, neighborhood, city, state, "zipCode", country, "isDefault", "createdAt")
VALUES 
    (gen_random_uuid(), '97ec7a86-1c77-460e-817b-30ea8339a8c8', 'Casa', 'Rua das Flores', '123', 'Apt 45', 'Centro', 'São Paulo', 'SP', '01310-100', 'Brasil', TRUE, NOW()),
    (gen_random_uuid(), 'dccabe56-4d58-4173-a92f-853fefbfd4b5', 'Casa', 'Av. Paulista', '1000', 'Apt 302', 'Bela Vista', 'São Paulo', 'SP', '01310-200', 'Brasil', TRUE, NOW()),
    (gen_random_uuid(), 'fc8c6497-2d7f-461a-893c-0cfee011f055', 'Casa', 'Rua Oscar Freire', '500', NULL, 'Jardins', 'São Paulo', 'SP', '01426-001', 'Brasil', TRUE, NOW());

-- Carts
INSERT INTO "Cart" (id, "organizationId", "customerId", "sessionId", "expiresAt", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', '97ec7a86-1c77-460e-817b-30ea8339a8c8', 'sess_' || gen_random_uuid()::text, NOW() + INTERVAL '7 days', NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'dccabe56-4d58-4173-a92f-853fefbfd4b5', 'sess_' || gen_random_uuid()::text, NOW() + INTERVAL '7 days', NOW(), NOW());

-- Cart Items
INSERT INTO "CartItem" (id, "cartId", "productId", quantity, price, "createdAt", "updatedAt")
SELECT gen_random_uuid(), (SELECT id FROM "Cart" WHERE "customerId" = '97ec7a86-1c77-460e-817b-30ea8339a8c8' LIMIT 1), '610e9acb-9f8d-43fd-92b1-40389ee802a1'::UUID, 1, 149.90, NOW(), NOW()
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM "Cart" WHERE "customerId" = '97ec7a86-1c77-460e-817b-30ea8339a8c8' LIMIT 1), 'ee247968-f70d-4451-bf76-be981d26255f'::UUID, 1, 89.90, NOW(), NOW()
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM "Cart" WHERE "customerId" = 'dccabe56-4d58-4173-a92f-853fefbfd4b5' LIMIT 1), '58189a7b-20e5-4df4-98f8-1e9728768a26'::UUID, 2, 49.90, NOW(), NOW();

-- Abandoned Carts
INSERT INTO "AbandonedCart" (id, "cartId", "customerId", email, "abandonedAt", "recoveryAttempts", "createdAt")
SELECT gen_random_uuid(), c.id, c."customerId", cust.email, NOW() - INTERVAL '2 days', 1, NOW() - INTERVAL '2 days'
FROM "Cart" c
JOIN "Customer" cust ON cust.id = c."customerId"
WHERE c."customerId" = '97ec7a86-1c77-460e-817b-30ea8339a8c8'
LIMIT 1;

-- Order Items (campo correto: name, sem updatedAt)
INSERT INTO "OrderItem" (id, "orderId", "productId", name, quantity, price, "createdAt")
VALUES 
    (gen_random_uuid(), 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', '610e9acb-9f8d-43fd-92b1-40389ee802a1', 'Fone Bluetooth Premium', 1, 149.90, NOW()),
    (gen_random_uuid(), 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', 'ee247968-f70d-4451-bf76-be981d26255f', 'Mouse Gamer RGB', 1, 89.90, NOW()),
    (gen_random_uuid(), 'f17d3866-a989-463c-b864-d85d25a762eb', '58189a7b-20e5-4df4-98f8-1e9728768a26', 'Camiseta Premium', 2, 49.90, NOW()),
    (gen_random_uuid(), '87f30ef9-f8f2-4fa3-8465-a98982e8d147', 'ae0ac631-2fef-4615-9b36-58493f019e09', 'Tênis Esportivo', 1, 199.90, NOW());

-- Order History
INSERT INTO "OrderHistory" (id, "orderId", status, notes, "createdAt")
VALUES 
    (gen_random_uuid(), 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', 'PENDING', 'Pedido criado', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', 'PROCESSING', 'Pagamento confirmado', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), 'f17d3866-a989-463c-b864-d85d25a762eb', 'PENDING', 'Pedido criado', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '87f30ef9-f8f2-4fa3-8465-a98982e8d147', 'PENDING', 'Pedido criado', NOW() - INTERVAL '3 hours');

-- Coupon Usage
INSERT INTO "CouponUsage" (id, "couponId", "customerId", "orderId", "discountAmount", "usedAt")
SELECT gen_random_uuid(), id, '97ec7a86-1c77-460e-817b-30ea8339a8c8', 'ef5b17cd-084d-4bc5-b839-3d4ad016c310', 23.98, NOW() - INTERVAL '2 days'
FROM "Coupon" WHERE code = 'BEMVINDO10' LIMIT 1;

-- Discounts (sem maxDiscountAmount)
INSERT INTO "Discount" (id, "organizationId", name, description, type, value, "applyTo", "minPurchaseAmount", "startsAt", "expiresAt", "isActive", priority, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Black Friday 2025', 'Desconto especial Black Friday', 'PERCENTAGE', 30, 'ALL', 100, NOW(), NOW() + INTERVAL '30 days', TRUE, 1, NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Primeira Compra', 'Desconto para primeira compra', 'FIXED_AMOUNT', 20, 'ALL', 50, NOW(), NOW() + INTERVAL '90 days', TRUE, 2, NOW(), NOW());

-- Upsells
INSERT INTO "Upsell" (id, "organizationId", name, "fromProductId", "toProductId", title, description, "discountType", "discountValue", timing, "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Fone → Mouse', '610e9acb-9f8d-43fd-92b1-40389ee802a1', 'ee247968-f70d-4451-bf76-be981d26255f', 
     'Complete seu setup gamer!', 'Mouse Gamer RGB com 20% OFF', 'PERCENTAGE', 20, 'CHECKOUT', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Camiseta → Tênis', '58189a7b-20e5-4df4-98f8-1e9728768a26', 'ae0ac631-2fef-4615-9b36-58493f019e09', 
     'Monte seu look completo!', 'Tênis Esportivo com R$ 30 OFF', 'FIXED_AMOUNT', 30, 'THANK_YOU_PAGE', TRUE, NOW(), NOW());

-- CrossSells
INSERT INTO "CrossSell" (id, "organizationId", name, "productId", "relatedProductIds", title, description, "position", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Fone - Relacionados', '610e9acb-9f8d-43fd-92b1-40389ee802a1', 
     ARRAY['ee247968-f70d-4451-bf76-be981d26255f', 'c0a18973-8438-4335-b0da-65ee3d63d884']::UUID[], 
     'Você também pode gostar', 'Produtos que combinam', 'PRODUCT_PAGE', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'Mouse - Relacionados', 'ee247968-f70d-4451-bf76-be981d26255f', 
     ARRAY['610e9acb-9f8d-43fd-92b1-40389ee802a1']::UUID[], 
     'Complete sua setup', 'Mais produtos tech', 'CART', TRUE, NOW(), NOW());

-- Subscriptions
INSERT INTO "Subscription" (id, "organizationId", "stripeSubscriptionId", "stripeCustomerId", plan, status, "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", amount, currency, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'sub_' || gen_random_uuid()::text, 'cus_' || gen_random_uuid()::text, 
     'PRO', 'ACTIVE', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', FALSE, 99.90, 'BRL', NOW() - INTERVAL '15 days', NOW());

-- Usage Tracking
INSERT INTO "UsageTracking" (id, "organizationId", metric, count, "limitValue", period, "periodStart", "periodEnd", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'campaigns', 1, 999999, 'MONTHLY', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'users', 1, 999999, 'MONTHLY', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', NOW(), NOW()),
    (gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', 'chat_messages', 5, 999999, 'MONTHLY', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', NOW(), NOW());

-- AI Usage
INSERT INTO "AiUsage" (id, "organizationId", "userId", provider, model, "tokensUsed", "tokensInput", "tokensOutput", cost, "requestType", month, "createdAt")
SELECT gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', id, 'OPENAI', 'gpt-4o-mini', 500, 300, 200, 0.01, 'chat', date_trunc('month', NOW()), NOW()
FROM "User" LIMIT 1;

INSERT INTO "AiUsage" (id, "organizationId", "userId", provider, model, "tokensUsed", "tokensInput", "tokensOutput", cost, "requestType", month, "createdAt")
SELECT gen_random_uuid(), '62f38421-3ea6-44c4-a5e0-d6437a627ab5', id, 'OPENAI', 'gpt-4o-mini', 800, 500, 300, 0.015, 'chat', date_trunc('month', NOW()), NOW() - INTERVAL '1 day'
FROM "User" LIMIT 1;

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================
SELECT 
    'ProductVariant' as tabela, COUNT(*) as registros FROM "ProductVariant"
UNION ALL SELECT 'ProductImage', COUNT(*) FROM "ProductImage"
UNION ALL SELECT 'Collection', COUNT(*) FROM "Collection"
UNION ALL SELECT 'Kit', COUNT(*) FROM "Kit"
UNION ALL SELECT 'KitItem', COUNT(*) FROM "KitItem"
UNION ALL SELECT 'CustomerAddress', COUNT(*) FROM "CustomerAddress"
UNION ALL SELECT 'Cart', COUNT(*) FROM "Cart"
UNION ALL SELECT 'CartItem', COUNT(*) FROM "CartItem"
UNION ALL SELECT 'AbandonedCart', COUNT(*) FROM "AbandonedCart"
UNION ALL SELECT 'OrderItem', COUNT(*) FROM "OrderItem"
UNION ALL SELECT 'OrderHistory', COUNT(*) FROM "OrderHistory"
UNION ALL SELECT 'CouponUsage', COUNT(*) FROM "CouponUsage"
UNION ALL SELECT 'Discount', COUNT(*) FROM "Discount"
UNION ALL SELECT 'Upsell', COUNT(*) FROM "Upsell"
UNION ALL SELECT 'CrossSell', COUNT(*) FROM "CrossSell"
UNION ALL SELECT 'Subscription', COUNT(*) FROM "Subscription"
UNION ALL SELECT 'UsageTracking', COUNT(*) FROM "UsageTracking"
UNION ALL SELECT 'AiUsage', COUNT(*) FROM "AiUsage"
UNION ALL SELECT 'GatewayConfig', COUNT(*) FROM "GatewayConfig"
ORDER BY tabela;
