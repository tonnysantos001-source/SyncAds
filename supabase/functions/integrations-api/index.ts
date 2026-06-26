// =========================================================================
// SYNCADS - INTEGRATIONS API EDGE FUNCTION (Zero Frontend Architecture)
// =========================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "payment";

    // 1. Buscar todos os plugins e capabilities correspondentes à categoria
    const { data: plugins, error: fetchErr } = await supabaseClient
      .from("IntegrationPlugin")
      .select(`
        id,
        name,
        slug,
        version,
        category,
        logo_url,
        description,
        status,
        config_fields,
        IntegrationCapability (
          capabilities
        )
      `)
      .eq("category", category)
      .eq("status", "active");

    if (fetchErr) {
      throw fetchErr;
    }

    // 2. Formatar resposta para o formato esperado pelo frontend
    const formattedPlugins = (plugins || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      version: p.version,
      category: p.category,
      logo: p.logo_url,
      description: p.description,
      status: p.status,
      configFields: p.config_fields,
      capabilities: p.IntegrationCapability?.capabilities || {},
    }));

    return new Response(JSON.stringify(formattedPlugins), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[INTEGRATIONS-API] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
