-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
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
CREATE POLICY "org_category_select" ON "Category"
  FOR SELECT USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_category_insert" ON "Category"
  FOR INSERT WITH CHECK ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_category_update" ON "Category"
  FOR UPDATE USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_category_delete" ON "Category"
  FOR DELETE USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

-- Product
CREATE POLICY "org_product_select" ON "Product"
  FOR SELECT USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_product_insert" ON "Product"
  FOR INSERT WITH CHECK ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_product_update" ON "Product"
  FOR UPDATE USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_product_delete" ON "Product"
  FOR DELETE USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

-- ProductVariant (através do Product)
CREATE POLICY "org_variant_all" ON "ProductVariant"
  FOR ALL USING ("productId" IN (
    SELECT id FROM "Product" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

-- ProductImage (através do Product)
CREATE POLICY "org_image_all" ON "ProductImage"
  FOR ALL USING ("productId" IN (
    SELECT id FROM "Product" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

-- Collection
CREATE POLICY "org_collection_all" ON "Collection"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

-- Kit
CREATE POLICY "org_kit_all" ON "Kit"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

-- KitItem (através do Kit)
CREATE POLICY "org_kit_item_all" ON "KitItem"
  FOR ALL USING ("kitId" IN (
    SELECT id FROM "Kit" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

-- ============================================
-- POLICIES - CLIENTES
-- ============================================

CREATE POLICY "org_customer_all" ON "Customer"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_customer_address_all" ON "CustomerAddress"
  FOR ALL USING ("customerId" IN (
    SELECT id FROM "Customer" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

CREATE POLICY "org_lead_all" ON "Lead"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

-- ============================================
-- POLICIES - CARRINHO
-- ============================================

CREATE POLICY "org_cart_all" ON "Cart"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_cart_item_all" ON "CartItem"
  FOR ALL USING ("cartId" IN (
    SELECT id FROM "Cart" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

CREATE POLICY "org_abandoned_cart_all" ON "AbandonedCart"
  FOR ALL USING ("cartId" IN (
    SELECT id FROM "Cart" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

-- ============================================
-- POLICIES - PEDIDOS
-- ============================================

CREATE POLICY "org_order_all" ON "Order"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_order_item_all" ON "OrderItem"
  FOR ALL USING ("orderId" IN (
    SELECT id FROM "Order" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

CREATE POLICY "org_order_history_select" ON "OrderHistory"
  FOR SELECT USING ("orderId" IN (
    SELECT id FROM "Order" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

CREATE POLICY "org_order_history_insert" ON "OrderHistory"
  FOR INSERT WITH CHECK ("orderId" IN (
    SELECT id FROM "Order" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

-- ============================================
-- POLICIES - GATEWAYS
-- ============================================

-- Gateway (todos podem ver)
CREATE POLICY "gateway_select_all" ON "Gateway"
  FOR SELECT USING (true);

-- GatewayConfig (apenas da org)
CREATE POLICY "org_gateway_config_all" ON "GatewayConfig"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Transaction (apenas da org)
CREATE POLICY "org_transaction_all" ON "Transaction"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

-- ============================================
-- POLICIES - MARKETING
-- ============================================

CREATE POLICY "org_coupon_all" ON "Coupon"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_coupon_usage_all" ON "CouponUsage"
  FOR ALL USING ("couponId" IN (
    SELECT id FROM "Coupon" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

CREATE POLICY "org_discount_all" ON "Discount"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_order_bump_all" ON "OrderBump"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_upsell_all" ON "Upsell"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_cross_sell_all" ON "CrossSell"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

-- ============================================
-- POLICIES - CHECKOUT & TRACKING
-- ============================================

CREATE POLICY "org_checkout_custom_all" ON "CheckoutCustomization"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_checkout_section_all" ON "CheckoutSection"
  FOR ALL USING ("customizationId" IN (
    SELECT id FROM "CheckoutCustomization" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

CREATE POLICY "org_pixel_all" ON "Pixel"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_pixel_event_all" ON "PixelEvent"
  FOR ALL USING ("pixelId" IN (
    SELECT id FROM "Pixel" WHERE "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  ));

CREATE POLICY "org_social_proof_all" ON "SocialProof"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_banner_all" ON "Banner"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));

CREATE POLICY "org_shipping_all" ON "Shipping"
  FOR ALL USING ("organizationId" IN (
    SELECT "organizationId" FROM "User" WHERE id = auth.uid()
  ));
