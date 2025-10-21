-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS (CORRIGIDO)
-- ============================================

-- Enable RLS
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Kit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KitItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerAddress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AbandonedCart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Gateway" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GatewayConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CouponUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Discount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderBump" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Upsell" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrossSell" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckoutCustomization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckoutSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pixel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PixelEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialProof" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Banner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipping" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - PRODUTOS
-- ============================================

-- Category
CREATE POLICY "org_category_all" ON "Category"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

-- Product
CREATE POLICY "org_product_all" ON "Product"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

-- ProductVariant (através do Product)
CREATE POLICY "org_variant_all" ON "ProductVariant"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Product" 
      WHERE "Product".id = "ProductVariant"."productId"
      AND "Product"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

-- ProductImage (através do Product)
CREATE POLICY "org_image_all" ON "ProductImage"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Product" 
      WHERE "Product".id = "ProductImage"."productId"
      AND "Product"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

-- Collection
CREATE POLICY "org_collection_all" ON "Collection"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

-- Kit
CREATE POLICY "org_kit_all" ON "Kit"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

-- KitItem (através do Kit)
CREATE POLICY "org_kit_item_all" ON "KitItem"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Kit" 
      WHERE "Kit".id = "KitItem"."kitId"
      AND "Kit"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

-- ============================================
-- POLICIES - CLIENTES
-- ============================================

CREATE POLICY "org_customer_all" ON "Customer"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_customer_address_all" ON "CustomerAddress"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Customer" 
      WHERE "Customer".id = "CustomerAddress"."customerId"
      AND "Customer"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

CREATE POLICY "org_lead_all" ON "Lead"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

-- ============================================
-- POLICIES - CARRINHO
-- ============================================

CREATE POLICY "org_cart_all" ON "Cart"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_cart_item_all" ON "CartItem"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Cart" 
      WHERE "Cart".id = "CartItem"."cartId"
      AND "Cart"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

CREATE POLICY "org_abandoned_cart_all" ON "AbandonedCart"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Cart" 
      WHERE "Cart".id = "AbandonedCart"."cartId"
      AND "Cart"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

-- ============================================
-- POLICIES - PEDIDOS
-- ============================================

CREATE POLICY "org_order_all" ON "Order"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_order_item_all" ON "OrderItem"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Order" 
      WHERE "Order".id = "OrderItem"."orderId"
      AND "Order"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

CREATE POLICY "org_order_history_all" ON "OrderHistory"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Order" 
      WHERE "Order".id = "OrderHistory"."orderId"
      AND "Order"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

-- ============================================
-- POLICIES - GATEWAYS
-- ============================================

-- Gateway (todos podem ver)
CREATE POLICY "gateway_select_all" ON "Gateway"
  FOR SELECT USING (true);

-- GatewayConfig (apenas ADMIN da org)
CREATE POLICY "org_gateway_config_select" ON "GatewayConfig"
  FOR SELECT USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
  );

CREATE POLICY "org_gateway_config_insert" ON "GatewayConfig"
  FOR INSERT WITH CHECK (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
  );

CREATE POLICY "org_gateway_config_update" ON "GatewayConfig"
  FOR UPDATE USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
  );

CREATE POLICY "org_gateway_config_delete" ON "GatewayConfig"
  FOR DELETE USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
  );

-- Transaction
CREATE POLICY "org_transaction_all" ON "Transaction"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

-- ============================================
-- POLICIES - MARKETING
-- ============================================

CREATE POLICY "org_coupon_all" ON "Coupon"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_coupon_usage_all" ON "CouponUsage"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Coupon" 
      WHERE "Coupon".id = "CouponUsage"."couponId"
      AND "Coupon"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

CREATE POLICY "org_discount_all" ON "Discount"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_order_bump_all" ON "OrderBump"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_upsell_all" ON "Upsell"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_cross_sell_all" ON "CrossSell"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

-- ============================================
-- POLICIES - CHECKOUT & TRACKING
-- ============================================

CREATE POLICY "org_checkout_custom_all" ON "CheckoutCustomization"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_checkout_section_all" ON "CheckoutSection"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "CheckoutCustomization" 
      WHERE "CheckoutCustomization".id = "CheckoutSection"."customizationId"
      AND "CheckoutCustomization"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

CREATE POLICY "org_pixel_all" ON "Pixel"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_pixel_event_all" ON "PixelEvent"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Pixel" 
      WHERE "Pixel".id = "PixelEvent"."pixelId"
      AND "Pixel"."organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

CREATE POLICY "org_social_proof_all" ON "SocialProof"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_banner_all" ON "Banner"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "org_shipping_all" ON "Shipping"
  FOR ALL USING (
    "organizationId" = (SELECT "organizationId" FROM "User" WHERE id = auth.uid()::text)
  );
