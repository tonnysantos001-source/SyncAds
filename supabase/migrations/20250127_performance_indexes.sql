-- Migration: Add Performance Indexes
-- Date: 2025-01-27
-- Description: Add indexes to improve query performance across the checkout system

-- ============================================
-- ORDER INDEXES
-- ============================================

-- Index for user's orders filtered by status
CREATE INDEX IF NOT EXISTS idx_orders_user_status_date
ON "Order"("userId", "status", "createdAt" DESC)
WHERE "userId" IS NOT NULL;

-- Index for payment status queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_date
ON "Order"("paymentStatus", "createdAt" DESC);

-- Index for order number lookups (unique searches)
CREATE INDEX IF NOT EXISTS idx_orders_order_number
ON "Order"("orderNumber")
WHERE "orderNumber" IS NOT NULL;

-- Index for email searches
CREATE INDEX IF NOT EXISTS idx_orders_customer_email
ON "Order"("customerEmail");

-- Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_status_payment_date
ON "Order"("status", "paymentStatus", "createdAt" DESC);

-- ============================================
-- TRANSACTION INDEXES
-- ============================================

-- Index for gateway transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_status
ON "Transaction"("gatewayId", "status", "createdAt" DESC);

-- Index for user's transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_date
ON "Transaction"("userId", "status", "createdAt" DESC)
WHERE "userId" IS NOT NULL;

-- Index for order-transaction relationship
CREATE INDEX IF NOT EXISTS idx_transactions_order_id
ON "Transaction"("orderId");

-- Index for payment method analytics
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_status
ON "Transaction"("paymentMethod", "status", "paidAt" DESC NULLS LAST);

-- Index for transaction ID searches (external gateway IDs)
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id
ON "Transaction"("transactionId")
WHERE "transactionId" IS NOT NULL;

-- Index for PIX transactions (for PIX recovery queries)
CREATE INDEX IF NOT EXISTS idx_transactions_pix_status
ON "Transaction"("status", "pixExpiresAt")
WHERE "paymentMethod" = 'PIX' AND "pixQrCode" IS NOT NULL;

-- ============================================
-- SHOPIFY INTEGRATION INDEXES
-- ============================================

-- ShopifyProduct indexes
CREATE INDEX IF NOT EXISTS idx_shopify_products_integration_status
ON "ShopifyProduct"("integrationId", "status", "lastSyncAt" DESC);

CREATE INDEX IF NOT EXISTS idx_shopify_products_user_id
ON "ShopifyProduct"("userId", "status")
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shopify_products_handle
ON "ShopifyProduct"("handle")
WHERE "handle" IS NOT NULL;

-- ShopifyOrder indexes
CREATE INDEX IF NOT EXISTS idx_shopify_orders_integration_financial
ON "ShopifyOrder"("integrationId", "financialStatus", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_user_id
ON "ShopifyOrder"("userId", "financialStatus")
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shopify_orders_email
ON "ShopifyOrder"("email")
WHERE "email" IS NOT NULL;

-- ShopifyCustomer indexes
CREATE INDEX IF NOT EXISTS idx_shopify_customers_integration_email
ON "ShopifyCustomer"("integrationId", "email")
WHERE "email" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shopify_customers_user_id
ON "ShopifyCustomer"("userId")
WHERE "userId" IS NOT NULL;

-- ShopifySyncLog indexes
CREATE INDEX IF NOT EXISTS idx_shopify_sync_log_integration_type
ON "ShopifySyncLog"("integrationId", "syncType", "startedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_shopify_sync_log_status
ON "ShopifySyncLog"("status", "startedAt" DESC);

-- ============================================
-- CHECKOUT FEATURE INDEXES
-- ============================================

-- PaymentMethodDiscount indexes
CREATE INDEX IF NOT EXISTS idx_payment_discounts_user_active_method
ON "PaymentMethodDiscount"("userId", "isActive", "paymentMethod")
WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_payment_discounts_method_active
ON "PaymentMethodDiscount"("paymentMethod", "isActive")
WHERE "isActive" = true;

-- PixelConfig indexes
CREATE INDEX IF NOT EXISTS idx_pixel_config_user_active_platform
ON "PixelConfig"("userId", "isActive", "platform")
WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_pixel_config_platform_active
ON "PixelConfig"("platform", "isActive")
WHERE "isActive" = true;

-- CheckoutCustomization indexes
CREATE INDEX IF NOT EXISTS idx_checkout_customization_user_active
ON "CheckoutCustomization"("userId", "isActive")
WHERE "isActive" = true;

-- RedirectRule indexes
CREATE INDEX IF NOT EXISTS idx_redirect_rule_user_active_trigger
ON "RedirectRule"("userId", "isActive", "triggerType")
WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_redirect_rule_active_priority
ON "RedirectRule"("isActive", "priority" DESC)
WHERE "isActive" = true;

-- RedirectLog indexes
CREATE INDEX IF NOT EXISTS idx_redirect_log_rule_created
ON "RedirectLog"("redirectRuleId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_redirect_log_user_converted
ON "RedirectLog"("userId", "converted", "createdAt" DESC)
WHERE "userId" IS NOT NULL;

-- SocialProof indexes (already created in previous migration, but adding for completeness)
CREATE INDEX IF NOT EXISTS idx_social_proof_user_active_type
ON "SocialProof"("userId", "isActive", "type")
WHERE "isActive" = true;

-- ============================================
-- GATEWAY INDEXES
-- ============================================

-- GatewayConfig indexes
CREATE INDEX IF NOT EXISTS idx_gateway_config_user_active
ON "GatewayConfig"("userId", "isActive")
WHERE "userId" IS NOT NULL AND "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_gateway_config_gateway_user
ON "GatewayConfig"("gatewayId", "userId", "isActive");

CREATE INDEX IF NOT EXISTS idx_gateway_config_default
ON "GatewayConfig"("userId", "isDefault")
WHERE "isDefault" = true;

-- Gateway indexes (for public queries)
CREATE INDEX IF NOT EXISTS idx_gateway_active_popular
ON "Gateway"("isActive", "isPopular")
WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_gateway_slug
ON "Gateway"("slug")
WHERE "slug" IS NOT NULL;

-- ============================================
-- CUSTOMER & LEAD INDEXES
-- ============================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customer_user_email
ON "Customer"("userId", "email")
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_email_status
ON "Customer"("email", "status")
WHERE "status" = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_customer_user_total_spent
ON "Customer"("userId", "totalSpent" DESC NULLS LAST)
WHERE "userId" IS NOT NULL;

-- Lead indexes
CREATE INDEX IF NOT EXISTS idx_lead_user_status
ON "Lead"("userId", "status", "createdAt" DESC)
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_email
ON "Lead"("email")
WHERE "email" IS NOT NULL;

-- ============================================
-- CART & RECOVERY INDEXES
-- ============================================

-- Cart indexes
CREATE INDEX IF NOT EXISTS idx_cart_user_session
ON "Cart"("userId", "sessionId")
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cart_expires_at
ON "Cart"("expiresAt")
WHERE "expiresAt" IS NOT NULL;

-- AbandonedCart indexes
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_user_abandoned
ON "AbandonedCart"("userId", "abandonedAt" DESC)
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_abandoned_cart_email_recovered
ON "AbandonedCart"("email", "recoveredAt" NULLS FIRST);

-- RecoveredCart indexes
CREATE INDEX IF NOT EXISTS idx_recovered_cart_user_method
ON "RecoveredCart"("userId", "recoveryMethod", "recovered")
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recovered_cart_pix_expires
ON "RecoveredCart"("pixExpiresAt")
WHERE "pixExpiresAt" IS NOT NULL AND "recovered" = false;

-- ============================================
-- MARKETING INDEXES
-- ============================================

-- UTMTracking indexes
CREATE INDEX IF NOT EXISTS idx_utm_tracking_user_converted
ON "UTMTracking"("userId", "converted", "createdAt" DESC)
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_utm_tracking_source_medium_campaign
ON "UTMTracking"("utmSource", "utmMedium", "utmCampaign")
WHERE "utmSource" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_utm_tracking_order_id
ON "UTMTracking"("orderId")
WHERE "orderId" IS NOT NULL;

-- Cashback indexes
CREATE INDEX IF NOT EXISTS idx_cashback_user_active
ON "Cashback"("userId", "isActive")
WHERE "isActive" = true;

-- CashbackTransaction indexes
CREATE INDEX IF NOT EXISTS idx_cashback_transaction_customer_status
ON "CashbackTransaction"("customerId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_cashback_transaction_expires
ON "CashbackTransaction"("expiresAt")
WHERE "status" = 'AVAILABLE' AND "expiresAt" IS NOT NULL;

-- DiscountBanner indexes
CREATE INDEX IF NOT EXISTS idx_discount_banner_user_active
ON "DiscountBanner"("userId", "isActive", "priority" DESC)
WHERE "isActive" = true;

-- ============================================
-- PRODUCT & COLLECTION INDEXES
-- ============================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_product_user_status
ON "Product"("userId", "status")
WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_slug
ON "Product"("slug")
WHERE "slug" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_featured
ON "Product"("isFeatured", "status")
WHERE "isFeatured" = true AND "status" = 'ACTIVE';

-- Collection indexes
CREATE INDEX IF NOT EXISTS idx_collection_user_published
ON "Collection"("userId", "isPublished")
WHERE "userId" IS NOT NULL;

-- ============================================
-- ANALYTICS & REPORTING INDEXES
-- ============================================

-- For date-range queries in reports
CREATE INDEX IF NOT EXISTS idx_orders_created_at_date
ON "Order"(DATE("createdAt"), "status");

CREATE INDEX IF NOT EXISTS idx_transactions_paid_at_date
ON "Transaction"(DATE("paidAt"), "status")
WHERE "paidAt" IS NOT NULL;

-- For revenue calculations
CREATE INDEX IF NOT EXISTS idx_orders_total_paid_date
ON "Order"("total", "paidAt")
WHERE "paymentStatus" = 'PAID';

-- ============================================
-- USER & AUTH INDEXES
-- ============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_email
ON "User"("email")
WHERE "email" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_active
ON "User"("isActive", "createdAt" DESC)
WHERE "isActive" = true;

-- ChatConversation indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversation_user_updated
ON "ChatConversation"("userId", "updatedAt" DESC)
WHERE "userId" IS NOT NULL;

-- ============================================
-- VERIFICATION & SUMMARY
-- ============================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    -- Count total indexes created
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    INTO index_count;

    RAISE NOTICE '=== PERFORMANCE INDEXES MIGRATION COMPLETED ===';
    RAISE NOTICE 'Total indexes in public schema: %', index_count;
    RAISE NOTICE 'Migration added indexes for:';
    RAISE NOTICE '  - Order & Transaction tables';
    RAISE NOTICE '  - Shopify integration tables';
    RAISE NOTICE '  - Checkout features (Discounts, Pixels, Customization)';
    RAISE NOTICE '  - Gateway & Payment processing';
    RAISE NOTICE '  - Customer & Lead management';
    RAISE NOTICE '  - Cart & Recovery';
    RAISE NOTICE '  - Marketing & Analytics';
    RAISE NOTICE '  - Product & Collection';
    RAISE NOTICE '========================================';
END $$;
