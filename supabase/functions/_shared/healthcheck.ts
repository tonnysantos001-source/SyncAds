/**
 * Shared Health Check Helper for Supabase Edge Functions
 * Provides standardized health check responses across all functions
 */

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  function_name: string;
  version: string;
  uptime_seconds?: number;
  checks?: {
    [key: string]: {
      status: "ok" | "error" | "warning";
      message?: string;
      response_time_ms?: number;
    };
  };
  error?: string;
}

export interface HealthCheckOptions {
  functionName: string;
  version?: string;
  startTime?: number;
  additionalChecks?: () => Promise<Record<string, any>>;
}

/**
 * Creates a standardized health check response
 */
export async function createHealthCheck(
  options: HealthCheckOptions
): Promise<HealthCheckResponse> {
  const {
    functionName,
    version = "1.0.0",
    startTime,
    additionalChecks,
  } = options;

  const response: HealthCheckResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    function_name: functionName,
    version,
    checks: {},
  };

  // Calculate uptime if startTime provided
  if (startTime) {
    response.uptime_seconds = Math.floor((Date.now() - startTime) / 1000);
  }

  // Environment check
  try {
    const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
    const missingVars = requiredEnvVars.filter((v) => !Deno.env.get(v));

    if (missingVars.length > 0) {
      response.checks!.environment = {
        status: "warning",
        message: `Missing env vars: ${missingVars.join(", ")}`,
      };
      response.status = "degraded";
    } else {
      response.checks!.environment = {
        status: "ok",
        message: "All required env vars present",
      };
    }
  } catch (error) {
    response.checks!.environment = {
      status: "error",
      message: `Environment check failed: ${error.message}`,
    };
    response.status = "degraded";
  }

  // Memory check
  try {
    const memoryUsage = Deno.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    response.checks!.memory = {
      status: heapUsedMB < 100 ? "ok" : "warning",
      message: `Heap used: ${heapUsedMB}MB`,
    };

    if (heapUsedMB >= 100) {
      response.status = "degraded";
    }
  } catch (error) {
    response.checks!.memory = {
      status: "error",
      message: `Memory check failed: ${error.message}`,
    };
  }

  // Run additional checks if provided
  if (additionalChecks) {
    try {
      const startCheck = Date.now();
      const customChecks = await additionalChecks();
      const checkTime = Date.now() - startCheck;

      response.checks!.custom = {
        status: "ok",
        message: "Custom checks passed",
        response_time_ms: checkTime,
        ...customChecks,
      };
    } catch (error) {
      response.checks!.custom = {
        status: "error",
        message: `Custom checks failed: ${error.message}`,
      };
      response.status = "unhealthy";
    }
  }

  return response;
}

/**
 * Quick health check endpoint handler
 * Use this for simple GET /health endpoints
 */
export async function handleHealthCheck(
  req: Request,
  options: HealthCheckOptions
): Promise<Response> {
  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const health = await createHealthCheck(options);

    const statusCode = health.status === "healthy"
      ? 200
      : health.status === "degraded"
      ? 200
      : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        function_name: options.functionName,
        error: error.message,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Check if Supabase client can connect
 */
export async function checkSupabaseConnection(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ status: "ok" | "error"; message: string; response_time_ms?: number }> {
  try {
    const startTime = Date.now();

    // Simple health check - just verify the URL is reachable
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "HEAD",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    const responseTime = Date.now() - startTime;

    if (response.ok || response.status === 404) {
      // 404 is ok, means we reached the endpoint
      return {
        status: "ok",
        message: "Supabase connection successful",
        response_time_ms: responseTime,
      };
    }

    return {
      status: "error",
      message: `Supabase returned status ${response.status}`,
      response_time_ms: responseTime,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Connection failed: ${error.message}`,
    };
  }
}

/**
 * Batch health check for multiple services
 */
export async function batchHealthCheck(
  checks: Array<{
    name: string;
    check: () => Promise<any>;
  }>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  await Promise.allSettled(
    checks.map(async ({ name, check }) => {
      try {
        const startTime = Date.now();
        const result = await check();
        const responseTime = Date.now() - startTime;

        results[name] = {
          status: "ok",
          response_time_ms: responseTime,
          ...result,
        };
      } catch (error) {
        results[name] = {
          status: "error",
          message: error.message,
        };
      }
    })
  );

  return results;
}

/**
 * Simple ping check
 */
export function createPingCheck(): {
  status: "ok";
  message: string;
  timestamp: string;
} {
  return {
    status: "ok",
    message: "pong",
    timestamp: new Date().toISOString(),
  };
}
