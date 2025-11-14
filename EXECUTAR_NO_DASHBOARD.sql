-- =====================================================
-- CORREÇÃO CRÍTICA: SECURITY DEFINER VIEWS
-- Executar no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/mthscppxsxmycjiwetec/sql/new
-- =====================================================

-- 1. ActiveDiscountCodes
DROP VIEW IF EXISTS "ActiveDiscountCodes" CASCADE;
CREATE VIEW "ActiveDiscountCodes"
WITH (security_invoker = true) AS
SELECT
    dc.*,
    pr.title as "priceRuleTitle",
    pr."valueType",
    pr.value
FROM "ShopifyDiscountCode" dc
INNER JOIN "ShopifyPriceRule" pr ON pr.id = dc."priceRuleId"
WHERE dc."usageCount" < pr."usageLimit"
  AND pr."startsAt" <= NOW()
  AND pr."endsAt" >= NOW()
  AND dc."userId" = auth.uid()::text;

-- 2. v_active_users
DROP VIEW IF EXISTS v_active_users CASCADE;
CREATE VIEW v_active_users
WITH (security_invoker = true) AS
SELECT id, email, name, plan, "isActive", "lastSeen", "createdAt"
FROM "User"
WHERE "isActive" = true
  AND "lastSeen" > NOW() - INTERVAL '30 days'
  AND id = auth.uid()::text;

-- 3. v_super_admins
DROP VIEW IF EXISTS v_super_admins CASCADE;
CREATE VIEW v_super_admins
WITH (security_invoker = true) AS
SELECT id, email, name, "isSuperAdmin", "createdAt"
FROM "User"
WHERE "isSuperAdmin" = true
  AND id = auth.uid()::text;

-- 4. ProductPerformance
DROP VIEW IF EXISTS "ProductPerformance" CASCADE;
CREATE VIEW "ProductPerformance"
WITH (security_invoker = true) AS
SELECT
    p.id,
    p."userId",
    p.title,
    p."productType",
    COUNT(DISTINCT oi.id) as "totalOrders",
    COALESCE(SUM(oi.quantity), 0) as "totalQuantity",
    COALESCE(SUM(oi.price * oi.quantity), 0) as "totalRevenue",
    COALESCE(AVG(oi.price), 0) as "averagePrice"
FROM "Product" p
LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
LEFT JOIN "Order" o ON o.id = oi."orderId" AND o.status = 'completed'
WHERE p."userId" = auth.uid()::text
GROUP BY p.id, p."userId", p.title, p."productType";

-- 5. CheckoutDashboard
DROP VIEW IF EXISTS "CheckoutDashboard" CASCADE;
CREATE VIEW "CheckoutDashboard"
WITH (security_invoker = true) AS
SELECT
    u.id as "userId",
    COUNT(DISTINCT o.id) as "totalOrders",
    COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as "completedOrders",
    COUNT(DISTINCT CASE WHEN o.status = 'abandoned' THEN o.id END) as "abandonedOrders",
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o."totalAmount" END), 0) as "totalRevenue",
    COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o."totalAmount" END), 0) as "averageOrderValue",
    COALESCE(
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END)::float /
        NULLIF(COUNT(DISTINCT o.id), 0) * 100,
        0
    ) as "conversionRate"
FROM "User" u
LEFT JOIN "Order" o ON o."userId" = u.id
WHERE u.id = auth.uid()::text
GROUP BY u.id;

-- 6. CartRecoveryAnalytics
DROP VIEW IF EXISTS "CartRecoveryAnalytics" CASCADE;
CREATE VIEW "CartRecoveryAnalytics"
WITH (security_invoker = true) AS
SELECT
    o."userId",
    COUNT(DISTINCT CASE WHEN o.status = 'abandoned' THEN o.id END) as "abandonedCarts",
    COUNT(DISTINCT CASE WHEN o.status = 'recovered' THEN o.id END) as "recoveredCarts",
    COALESCE(SUM(CASE WHEN o.status = 'recovered' THEN o."totalAmount" END), 0) as "recoveredRevenue",
    COALESCE(
        COUNT(DISTINCT CASE WHEN o.status = 'recovered' THEN o.id END)::float /
        NULLIF(COUNT(DISTINCT CASE WHEN o.status = 'abandoned' THEN o.id END), 0) * 100,
        0
    ) as "recoveryRate",
    COALESCE(AVG(CASE WHEN o.status = 'recovered' THEN o."totalAmount" END), 0) as "avgRecoveredValue"
FROM "Order" o
WHERE o."userId" = auth.uid()::text
  AND o.status IN ('abandoned', 'recovered')
GROUP BY o."userId";

-- 7. CustomerAnalytics
DROP VIEW IF EXISTS "CustomerAnalytics" CASCADE;
CREATE VIEW "CustomerAnalytics"
WITH (security_invoker = true) AS
SELECT
    o."userId",
    o."customerEmail",
    o."customerName",
    COUNT(DISTINCT o.id) as "totalOrders",
    COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as "completedOrders",
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o."totalAmount" END), 0) as "lifetimeValue",
    COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o."totalAmount" END), 0) as "averageOrderValue",
    MIN(o."createdAt") as "firstOrderDate",
    MAX(o."createdAt") as "lastOrderDate"
FROM "Order" o
WHERE o."userId" = auth.uid()::text
  AND o."customerEmail" IS NOT NULL
GROUP BY o."userId", o."customerEmail", o."customerName";

-- 8. UTMAnalytics
DROP VIEW IF EXISTS "UTMAnalytics" CASCADE;
CREATE VIEW "UTMAnalytics"
WITH (security_invoker = true) AS
SELECT
    utm."userId",
    utm."utmSource",
    utm."utmMedium",
    utm."utmCampaign",
    utm."utmTerm",
    utm."utmContent",
    COUNT(DISTINCT utm.id) as "totalVisits",
    COUNT(DISTINCT CASE WHEN utm.converted = true THEN utm.id END) as "totalConversions",
    COALESCE(SUM(CASE WHEN utm.converted = true THEN utm."orderValue" END), 0) as "totalRevenue",
    COALESCE(
        COUNT(DISTINCT CASE WHEN utm.converted = true THEN utm.id END)::float /
        NULLIF(COUNT(DISTINCT utm.id), 0) * 100,
        0
    ) as "conversionRate",
    COALESCE(
        AVG(CASE WHEN utm.converted = true THEN utm."orderValue" END),
        0
    ) as "averageOrderValue"
FROM "UTMTracking" utm
WHERE utm."userId" = auth.uid()::text
GROUP BY
    utm."userId",
    utm."utmSource",
    utm."utmMedium",
    utm."utmCampaign",
    utm."utmTerm",
    utm."utmContent";

-- 9. checkout_trial_dashboard
DROP VIEW IF EXISTS "checkout_trial_dashboard" CASCADE;
CREATE VIEW "checkout_trial_dashboard"
WITH (security_invoker = true) AS
SELECT
    u.id as "userId",
    u.email,
    u.name,
    u.plan,
    u."trialEndsAt",
    CASE
        WHEN u."trialEndsAt" IS NULL THEN 'no_trial'
        WHEN u."trialEndsAt" > NOW() THEN 'active'
        ELSE 'expired'
    END as "trialStatus",
    CASE
        WHEN u."trialEndsAt" IS NOT NULL AND u."trialEndsAt" > NOW()
        THEN EXTRACT(DAY FROM (u."trialEndsAt" - NOW()))
        ELSE 0
    END as "daysRemaining",
    COUNT(DISTINCT o.id) as "ordersInTrial",
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o."totalAmount" END), 0) as "revenueInTrial"
FROM "User" u
LEFT JOIN "Order" o ON o."userId" = u.id
    AND o."createdAt" >= COALESCE(u."trialStartedAt", u."createdAt")
    AND o."createdAt" <= COALESCE(u."trialEndsAt", NOW())
WHERE u.id = auth.uid()::text
GROUP BY u.id, u.email, u.name, u.plan, u."trialEndsAt", u."trialStartedAt", u."createdAt";

-- =====================================================
-- SUCESSO! 9 views corrigidas com security_invoker
-- Todos os auth.uid() convertidos para ::text
-- =====================================================
