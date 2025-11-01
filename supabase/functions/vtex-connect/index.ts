import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { accountName, appKey, appToken, environment = "vtexcommercestable" } = await req.json();

    if (!accountName || !appKey || !appToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "accountName, appKey and appToken are required"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test VTEX credentials by fetching account info
    const vtexApiUrl = `https://${accountName}.${environment}.com.br/api/catalog/pvt/product/1`;

    const testResponse = await fetch(vtexApiUrl, {
      headers: {
        "X-VTEX-API-AppKey": appKey,
        "X-VTEX-API-AppToken": appToken,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    // VTEX returns 404 if product doesn't exist, but that's OK - means credentials work
    // 401 or 403 means invalid credentials
    if (testResponse.status === 401 || testResponse.status === 403) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid VTEX credentials. Please check your App Key and App Token."
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to get store info
    const storeInfoUrl = `https://${accountName}.${environment}.com.br/api/catalog_system/pvt/configuration`;
    const storeInfoResponse = await fetch(storeInfoUrl, {
      headers: {
        "X-VTEX-API-AppKey": appKey,
        "X-VTEX-API-AppToken": appToken,
        "Content-Type": "application/json",
      },
    });

    let storeInfo: any = {};
    if (storeInfoResponse.ok) {
      storeInfo = await storeInfoResponse.json();
    }

    // Create or update integration
    const integrationId = `${user.id}-${accountName}`;

    const { data: existingIntegration } = await supabase
      .from("VtexIntegration")
      .select("*")
      .eq("userId", user.id)
      .eq("accountName", accountName)
      .single();

    if (existingIntegration) {
      // Update existing
      const { error: updateError } = await supabase
        .from("VtexIntegration")
        .update({
          appKey,
          appToken,
          environment,
          isActive: true,
          metadata: { storeInfo },
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingIntegration.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "VTEX integration updated successfully",
          integrationId: existingIntegration.id,
          accountName,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from("VtexIntegration")
        .insert({
          id: integrationId,
          userId: user.id,
          accountName,
          appKey,
          appToken,
          environment,
          isActive: true,
          metadata: { storeInfo },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Start initial sync
      try {
        await fetch(`${supabaseUrl}/functions/v1/vtex-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({
            integrationId,
            action: "sync-all",
          }),
        });
      } catch (syncError) {
        console.error("Failed to start initial sync:", syncError);
        // Don't fail the connection if sync fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "VTEX integration connected successfully",
          integrationId,
          accountName,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("VTEX connect error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
