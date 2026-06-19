import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { getGateway } from "../process-payment/gateways/registry.ts";

interface GatewayTestRequest {
  gatewayId: string;
  credentials: any;
  testMode: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { gatewayId, credentials, testMode }: GatewayTestRequest = await req.json();

    // Buscar informações do gateway na nova tabela payment_gateways
    const { data: gateway, error: gatewayError } = await supabaseClient
      .from("payment_gateways")
      .select("*")
      .eq("id", gatewayId)
      .single();

    if (gatewayError || !gateway) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Gateway não encontrado",
          error: gatewayError?.message 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const gatewaySlug = gateway.slug;
    const processor = getGateway(gatewaySlug);

    if (!processor) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `O gateway ${gateway.name} não está implementado nesta sprint.`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Criar um dummy config com as credenciais em texto plano enviadas para teste
    const dummyConfig: any = {
      id: `test_${gatewaySlug}`,
      gatewayId: gateway.id,
      credentials,
      testMode,
      environment: testMode ? "sandbox" : "production"
    };

    console.log(`[TEST-GATEWAY] Running healthCheck for ${gateway.name} (${gatewaySlug})...`);
    const healthResult = await processor.healthCheck(dummyConfig);

    const supportedMethods: string[] = [];
    if (gateway.supportsPix) supportedMethods.push("PIX");
    if (gateway.supportsCreditCard) supportedMethods.push("Cartão de Crédito");
    if (gateway.supportsBoleto) supportedMethods.push("Boleto");
    if (gateway.supportsDebit) supportedMethods.push("Cartão de Débito");

    if (healthResult.isValid) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Conexão com ${gateway.name} estabelecida com sucesso!`,
          data: {
            gatewayName: gateway.name,
            testMode,
            supportedMethods,
            connectionStatus: "connected"
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Erro ao testar ${gateway.name}: ${healthResult.message}`,
          error: healthResult.message
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

  } catch (error: any) {
    console.error("Gateway test error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Erro interno no teste do gateway",
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
