// ============================================
// SYSTEM HEALTH AGGREGATOR - EDGE FUNCTION
// ============================================
//
// Agregador de health checks para todas as funções críticas
// Monitora status de:
// - chat-enhanced
// - process-payment
// - payment-webhook
// - shopify-create-order
// - python-service (Railway)
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_utils/cors.ts";

const CRITICAL_FUNCTIONS = [
  {
    name: "chat-enhanced",
    url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/chat-enhanced/health`,
  },
  {
    name: "process-payment",
    url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-payment/health`,
  },
  {
    name: "payment-webhook",
    url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/health`,
  },
  {
    name: "shopify-create-order",
    url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/shopify-create-order/health`,
  },
];

const EXTERNAL_SERVICES = [
  {
    name: "python-service",
    url: "https://syncads-python-microservice-production.up.railway.app/health",
  },
];

interface HealthCheckResult {
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "unreachable";
  response_time_ms: number;
  last_check: string;
  details?: any;
  error?: string;
}

interface SystemHealthResponse {
  status: "healthy" | "degraded" | "critical";
  timestamp: string;
  summary: {
    total_services: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unreachable: number;
  };
  services: HealthCheckResult[];
  uptime_checks: {
    edge_functions: HealthCheckResult[];
    external_services: HealthCheckResult[];
  };
}

async function checkService(
  name: string,
  url: string,
  timeout: number = 5000
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    return {
      name,
      status: data.status || (response.ok ? "healthy" : "unhealthy"),
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      details: data,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      name,
      status: "unreachable",
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      error: error.message,
    };
  }
}

async function checkAllServices(): Promise<SystemHealthResponse> {
  const timestamp = new Date().toISOString();

  // Check Edge Functions
  const edgeFunctionChecks = await Promise.all(
    CRITICAL_FUNCTIONS.map(({ name, url }) => checkService(name, url))
  );

  // Check External Services
  const externalServiceChecks = await Promise.all(
    EXTERNAL_SERVICES.map(({ name, url }) => checkService(name, url))
  );

  // Combine all checks
  const allServices = [...edgeFunctionChecks, ...externalServiceChecks];

  // Calculate summary
  const summary = {
    total_services: allServices.length,
    healthy: allServices.filter((s) => s.status === "healthy").length,
    degraded: allServices.filter((s) => s.status === "degraded").length,
    unhealthy: allServices.filter((s) => s.status === "unhealthy").length,
    unreachable: allServices.filter((s) => s.status === "unreachable").length,
  };

  // Determine overall status
  let overallStatus: "healthy" | "degraded" | "critical" = "healthy";

  if (summary.unhealthy > 0 || summary.unreachable >= 2) {
    overallStatus = "critical";
  } else if (summary.degraded > 0 || summary.unreachable > 0) {
    overallStatus = "degraded";
  }

  return {
    status: overallStatus,
    timestamp,
    summary,
    services: allServices,
    uptime_checks: {
      edge_functions: edgeFunctionChecks,
      external_services: externalServiceChecks,
    },
  };
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Quick ping endpoint
    if (url.pathname.endsWith("/ping")) {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "pong",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Full health check
    const healthReport = await checkAllServices();

    const statusCode = healthReport.status === "healthy"
      ? 200
      : healthReport.status === "degraded"
      ? 200
      : 503;

    return new Response(JSON.stringify(healthReport, null, 2), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("System health check error:", error);

    return new Response(
      JSON.stringify({
        status: "critical",
        timestamp: new Date().toISOString(),
        error: error.message,
        summary: {
          total_services: 0,
          healthy: 0,
          degraded: 0,
          unhealthy: 0,
          unreachable: 0,
        },
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
