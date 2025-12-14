import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// ==========================================
// AI GATEWAY GENERATOR
// Gera gateways automaticamente a partir de docs
// ==========================================

interface GeneratorRequest {
    action: "generate" | "analyze" | "list";
    documentationUrl?: string;
    gatewayName?: string;
    gatewayType?: "PIX" | "CREDIT_CARD" | "BOLETO" | "WALLET" | "OTHER";
}

interface GatewayAnalysis {
    name: string;
    type: string;
    baseUrl: string;
    endpoints: {
        createPayment?: string;
        checkStatus?: string;
        webhook?: string;
        refund?: string;
    };
    authentication: {
        type: "bearer" | "api_key" | "basic" | "custom";
        headers: Record<string, string>;
    };
    requiredCredentials: string[];
    examplePayload: any;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const startTime = Date.now();

    try {
        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        // Verificar autenticação
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        const request: GeneratorRequest = await req.json();
        console.log(`🔧 Gateway Generator:`, request);

        let response;

        switch (request.action) {
            case "generate":
                if (!request.documentationUrl) {
                    throw new Error("documentationUrl is required");
                }
                response = await handleGenerate(
                    request.documentationUrl,
                    request.gatewayName || "Auto Generated Gateway",
                    request.gatewayType || "OTHER",
                    user.id,
                    supabase
                );
                break;

            case "analyze":
                if (!request.documentationUrl) {
                    throw new Error("documentationUrl is required");
                }
                response = await handleAnalyze(request.documentationUrl);
                break;

            case "list":
                response = await listGateways(supabase);
                break;

            default:
                throw new Error(`Unknown action: ${request.action}`);
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Gateway Generator completed in ${duration}ms`);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("❌ Gateway Generator error:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});

// ==========================================
// HANDLERS
// ==========================================

async function handleGenerate(
    docUrl: string,
    name: string,
    type: string,
    userId: string,
    supabase: any
): Promise<any> {
    console.log(`📄 Analyzing documentation: ${docUrl}`);

    // Step 1: Analyze documentation via browser
    const analysis = await analyzeDocumentation(docUrl);

    // Step 2: Generate TypeScript implementation
    const implementation = generateImplementation(analysis);

    // Step 3: Generate tests
    const tests = generateTests(analysis);

    // Step 4: Save to database as APPROVED
    const { data, error } = await supabase
        .from("ai_generated_gateways")
        .insert({
            name: analysis.name || name,
            type: type,
            status: "APPROVED", // Auto-approved!
            is_public: true,
            implementation: implementation,
            tests: tests,
            documentation: docUrl,
            ai_analysis: JSON.stringify(analysis),
            created_by_ai: true,
        })
        .select()
        .single();

    if (error) throw error;

    console.log(`✅ Gateway created: ${data.id}`);

    return {
        success: true,
        gateway: data,
        message: `Gateway "${analysis.name}" criado com sucesso! Já está disponível para todos os clientes.`,
    };
}

async function handleAnalyze(docUrl: string): Promise<any> {
    const analysis = await analyzeDocumentation(docUrl);

    return {
        success: true,
        analysis,
    };
}

async function listGateways(supabase: any): Promise<any> {
    const { data, error } = await supabase
        .from("ai_generated_gateways")
        .select("id, name, type, status, downloads, rating, created_at")
        .eq("status", "APPROVED")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return {
        success: true,
        gateways: data,
        total: data.length,
    };
}

// ==========================================
// DOCUMENTATION ANALYZER
// Uses browser control to read docs
// ==========================================

async function analyzeDocumentation(docUrl: string): Promise<GatewayAnalysis> {
    console.log(`🌐 Reading documentation from browser...`);

    // Call browser-automation to read the page
    const browserResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/browser-automation`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
                action: "navigate_and_extract",
                url: docUrl,
                extractRules: {
                    selectors: [
                        "code",
                        "pre",
                        ".endpoint",
                        ".api-endpoint",
                        ".method",
                        "[class*='code']",
                        "[class*='endpoint']",
                    ],
                    keywords: [
                        "POST",
                        "GET",
                        "PUT",
                        "DELETE",
                        "authorization",
                        "api_key",
                        "bearer",
                        "token",
                        "payment",
                        "charge",
                        "webhook",
                    ],
                },
            }),
        }
    );

    const browserData = await browserResponse.json();
    const pageContent = browserData.extractedData || "";

    // Parse the extracted content
    const analysis = parseDocumentation(pageContent, docUrl);

    return analysis;
}

function parseDocumentation(
    content: string,
    docUrl: string
): GatewayAnalysis {
    // Extract gateway name from URL or content
    const urlParts = new URL(docUrl).hostname.split(".");
    const gatewayName =
        urlParts[urlParts.length - 2]?.charAt(0).toUpperCase() +
        urlParts[urlParts.length - 2]?.slice(1);

    // Detect base URL
    const baseUrlMatch = content.match(
        /https?:\/\/api\.[a-z0-9\-]+\.[a-z]+/i
    );
    const baseUrl = baseUrlMatch ? baseUrlMatch[0] : "";

    // Detect endpoints
    const endpoints: any = {};

    if (
        content.includes("POST") &&
        (content.includes("/payment") ||
            content.includes("/charge") ||
            content.includes("/transaction"))
    ) {
        const endpointMatch = content.match(/POST\s+(\/[a-z\/\-\_]+)/i);
        endpoints.createPayment = endpointMatch
            ? endpointMatch[1]
            : "/v1/payments";
    }

    if (content.includes("/status") || content.includes("/transactions/")) {
        endpoints.checkStatus = "/v1/payments/{id}";
    }

    if (content.includes("webhook") || content.includes("/notifications")) {
        endpoints.webhook = "/webhooks";
    }

    if (content.includes("refund") || content.includes("/cancel")) {
        endpoints.refund = "/v1/payments/{id}/refund";
    }

    // Detect authentication
    let authType: "bearer" | "api_key" | "basic" | "custom" = "api_key";
    const authHeaders: Record<string, string> = {};

    if (content.toLowerCase().includes("bearer")) {
        authType = "bearer";
        authHeaders["Authorization"] = "Bearer {token}";
    } else if (
        content.toLowerCase().includes("api_key") ||
        content.toLowerCase().includes("api-key")
    ) {
        authType = "api_key";
        authHeaders["api_key"] = "{api_key}";
    } else if (content.toLowerCase().includes("basic auth")) {
        authType = "basic";
        authHeaders["Authorization"] = "Basic {credentials}";
    }

    // Detect required credentials
    const requiredCredentials = [];
    if (content.includes("api_key") || content.includes("apiKey"))
        requiredCredentials.push("apiKey");
    if (content.includes("secret") || content.includes("secretKey"))
        requiredCredentials.push("secretKey");
    if (content.includes("merchant") || content.includes("merchantId"))
        requiredCredentials.push("merchantId");
    if (content.includes("token")) requiredCredentials.push("token");

    // Build example payload
    const examplePayload = {
        amount: 100.0,
        currency: "BRL",
        description: "Pagamento de teste",
        customer: {
            name: "Cliente Teste",
            email: "cliente@example.com",
        },
    };

    return {
        name: gatewayName || "Unknown Gateway",
        type: detectGatewayType(content),
        baseUrl,
        endpoints,
        authentication: {
            type: authType,
            headers: authHeaders,
        },
        requiredCredentials,
        examplePayload,
    };
}

function detectGatewayType(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes("pix")) return "PIX";
    if (lower.includes("credit") || lower.includes("card")) return "CREDIT_CARD";
    if (lower.includes("boleto")) return "BOLETO";
    if (lower.includes("wallet") || lower.includes("carteira"))
        return "WALLET";

    return "OTHER";
}

// ==========================================
// CODE GENERATOR
// ==========================================

function generateImplementation(analysis: GatewayAnalysis): any {
    const code = `
// Auto-generated gateway for ${analysis.name}
// Generated by AI Gateway Generator

export interface ${analysis.name}Credentials {
  ${analysis.requiredCredentials.map((cred) => `${cred}: string;`).join("\n  ")}
}

export interface PaymentRequest {
  amount: number;
  currency?: string;
  description?: string;
  customer?: {
    name: string;
    email: string;
  };
}

export interface PaymentResponse {
  id: string;
  status: string;
  amount: number;
  createdAt: Date;
}

export class ${analysis.name}Gateway {
  private baseUrl = "${analysis.baseUrl}";
  private credentials: ${analysis.name}Credentials;

  constructor(credentials: ${analysis.name}Credentials) {
    this.credentials = credentials;
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const response = await fetch(\`\${this.baseUrl}${analysis.endpoints.createPayment}\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ${Object.entries(analysis.authentication.headers)
            .map(
                ([key, value]) =>
                    `"${key}": "${value.replace("{token}", "${this.credentials.token || this.credentials.apiKey}")}"`
            )
            .join(",\n        ")}
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(\`Payment failed: \${response.statusText}\`);
    }

    return await response.json();
  }

  async checkStatus(paymentId: string): Promise<PaymentResponse> {
    const response = await fetch(
      \`\${this.baseUrl}${analysis.endpoints.checkStatus?.replace("{id}", paymentId)}\`,
      {
        headers: {
          ${Object.entries(analysis.authentication.headers)
            .map(
                ([key, value]) =>
                    `"${key}": "${value.replace("{token}", "${this.credentials.token || this.credentials.apiKey}")}"`
            )
            .join(",\n          ")}
        }
      }
    );

    if (!response.ok) {
      throw new Error(\`Status check failed: \${response.statusText}\`);
    }

    return await response.json();
  }

  async refund(paymentId: string): Promise<PaymentResponse> {
    const response = await fetch(
      \`\${this.baseUrl}${analysis.endpoints.refund?.replace("{id}", paymentId)}\`,
      {
        method: "POST",
        headers: {
          ${Object.entries(analysis.authentication.headers)
            .map(
                ([key, value]) =>
                    `"${key}": "${value.replace("{token}", "${this.credentials.token || this.credentials.apiKey}")}"`
            )
            .join(",\n          ")}
        }
      }
    );

    if (!response.ok) {
      throw new Error(\`Refund failed: \${response.statusText}\`);
    }

    return await response.json();
  }
}
`;

    return {
        language: "typescript",
        code: code.trim(),
        dependencies: [],
        version: "1.0.0",
    };
}

function generateTests(analysis: GatewayAnalysis): any {
    return {
        unit: [
            {
                name: "should create payment",
                code: `test("createPayment", async () => {
  const gateway = new ${analysis.name}Gateway({ apiKey: "test" });
  const payment = await gateway.createPayment({
    amount: 100,
    description: "Test"
  });
  expect(payment.id).toBeDefined();
});`,
            },
            {
                name: "should check payment status",
                code: `test("checkStatus", async () => {
  const gateway = new ${analysis.name}Gateway({ apiKey: "test" });
  const status = await gateway.checkStatus("payment-123");
  expect(status.status).toBeDefined();
});`,
            },
        ],
        integration: [
            {
                name: "full payment flow",
                description: `Create payment -> Check status -> Refund`,
            },
        ],
    };
}
