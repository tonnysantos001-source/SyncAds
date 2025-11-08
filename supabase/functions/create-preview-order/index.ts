import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const previewProducts = [
      {
        id: "preview-product-1",
        productId: "preview-product-1",
        variantId: "preview-variant-1",
        name: "Produto de Demonstração 1",
        price: 199.99,
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        sku: "DEMO-001",
      },
      {
        id: "preview-product-2",
        productId: "preview-product-2",
        variantId: "preview-variant-2",
        name: "Produto de Demonstração 2",
        price: 149.99,
        quantity: 2,
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        sku: "DEMO-002",
      },
    ];

    const subtotal = previewProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shipping = 29.99;
    const total = subtotal + shipping;

    const { data: order, error: orderError } = await supabase
      .from("Order")
      .insert({
        userId: user.id,
        status: "PREVIEW",
        paymentStatus: "PENDING",
        items: previewProducts,
        subtotal: subtotal,
        shipping: shipping,
        tax: 0,
        discount: 0,
        total: total,
        customerName: "Cliente de Demonstração",
        customerEmail: "demo@exemplo.com",
        customerPhone: "(11) 99999-9999",
        metadata: {
          isPreview: true,
          originalProducts: previewProducts,
          createdBy: "checkout-customizer",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Database error:", orderError);
      throw new Error(`Failed to create preview order: ${orderError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        message: "Preview order created successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in create-preview-order:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
