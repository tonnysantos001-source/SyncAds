import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handlePreflightRequest } from "../_utils/cors.ts";

const PYTHON_SERVICE_URL = Deno.env.get("PYTHON_SERVICE_URL") || "https://syncads-production.up.railway.app";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return handlePreflightRequest();
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing authorization" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { command, session_id, params } = await req.json();

        console.log("🤖 Browser automation request:", { command, session_id });

        // Map commands to Python service endpoints
        let endpoint = "";
        let payload: any = { session_id };

        switch (command) {
            case "NAVIGATE":
                endpoint = "/api/automation/browser/navigate";
                payload.url = params.url;
                break;

            case "FILL_FORM":
                endpoint = "/api/automation/browser/fill-form";
                payload.form_data = params.form_data;
                payload.form_selector = params.form_selector;
                break;

            case "CLICK":
                endpoint = "/api/automation/browser/click";
                payload.selector = params.selector;
                break;

            case "EXTRACT_DATA":
                endpoint = "/api/automation/browser/extract";
                payload.selectors = params.selectors;
                break;

            case "SCREENSHOT":
                endpoint = "/api/automation/browser/screenshot";
                payload.full_page = params.full_page || false;
                break;

            case "SCRAPE_PRODUCTS":
                endpoint = "/api/automation/browser/scrape-products";
                payload.url = params.url;
                payload.product_selectors = params.product_selectors;
                break;

            case "DETECT_CHECKOUT":
                endpoint = "/api/automation/browser/detect-checkout";
                break;

            case "CREATE_SESSION":
                endpoint = "/api/automation/browser/session";
                payload.user_agent = params.user_agent;
                break;

            case "CLOSE_SESSION":
                const closeResponse = await fetch(
                    `${PYTHON_SERVICE_URL}/api/automation/browser/session/${session_id}`,
                    {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
                const closeData = await closeResponse.json();
                return new Response(JSON.stringify(closeData), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });

            default:
                return new Response(
                    JSON.stringify({ error: `Unknown command: ${command}` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
        }

        // Forward request to Python service
        console.log(`📡 Forwarding to Python service: ${endpoint}`);

        const response = await fetch(`${PYTHON_SERVICE_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        console.log("✅ Python service response:", {
            status: response.status,
            success: data.success,
        });

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("❌ Browser automation error:", error);

        return new Response(
            JSON.stringify({
                error: "Browser automation failed",
                message: error.message,
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
