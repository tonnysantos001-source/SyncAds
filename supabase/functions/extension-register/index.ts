// ============================================
// SYNCADS EXTENSION-REGISTER EDGE FUNCTION v4.0
// Robust token validation, device registration and logging
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// ============================================
// CORS HEADERS
// ============================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-device-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// TYPES
// ============================================
interface BrowserInfo {
  userAgent: string;
  platform: string;
  language: string;
  vendor?: string;
}

interface RequestBody {
  device_id: string;
  browser_info: BrowserInfo;
  version: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
}

interface SuccessResponse {
  success: boolean;
  device: unknown;
  message: string;
  device_id: string;
  user_id: string;
}

// ============================================
// LOGGER
// ============================================
const Logger = {
  info: (message: string, data?: unknown) => {
    console.log(`ℹ️ [INFO] ${message}`, data ? JSON.stringify(data) : "");
  },

  success: (message: string, data?: unknown) => {
    console.log(`✅ [SUCCESS] ${message}`, data ? JSON.stringify(data) : "");
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`⚠️ [WARN] ${message}`, data ? JSON.stringify(data) : "");
  },

  error: (message: string, error?: unknown, data?: unknown) => {
    console.error(
      `❌ [ERROR] ${message}`,
      error instanceof Error ? error.message : error,
      data ? JSON.stringify(data) : "",
    );
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function createErrorResponse(
  status: number,
  error: string,
  message: string,
  code?: string,
  details?: unknown,
): Response {
  const body: ErrorResponse = {
    error,
    message,
    ...(code && { code }),
    ...(details && { details }),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function createSuccessResponse(data: SuccessResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================
// TOKEN VALIDATION
// ============================================
async function validateToken(
  authHeader: string | null,
  supabaseUrl: string,
  supabaseAnonKey: string,
) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    Logger.warn("Missing or invalid Authorization header");
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");

  // Basic JWT format validation
  const parts = token.split(".");
  if (parts.length !== 3) {
    Logger.warn("Invalid JWT format");
    return { valid: false, error: "Invalid token format" };
  }

  try {
    // Create Supabase client with user token
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) {
      Logger.error("Token validation failed", authError);
      return {
        valid: false,
        error: "Token validation failed",
        details: authError.message,
      };
    }

    if (!user) {
      Logger.warn("No user found for token");
      return { valid: false, error: "Invalid token - no user found" };
    }

    Logger.success("Token validated successfully", {
      userId: user.id,
      email: user.email,
    });

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    Logger.error("Token validation exception", error);
    return {
      valid: false,
      error: "Token validation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// DEVICE REGISTRATION
// ============================================
async function registerDevice(
  supabaseAdmin: ReturnType<typeof createClient>,
  deviceId: string,
  userId: string,
  browserInfo: BrowserInfo,
  version: string,
) {
  try {
    Logger.info("Checking if device exists", { deviceId, userId });

    // Check if device exists
    const { data: existingDevice, error: checkError } = await supabaseAdmin
      .from("extension_devices")
      .select("*")
      .eq("device_id", deviceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      Logger.error("Error checking existing device", checkError);
      throw checkError;
    }

    const deviceData = {
      browser_info: browserInfo,
      version,
      status: "online",
      last_seen: new Date().toISOString(),
    };

    if (existingDevice) {
      // Update existing device
      Logger.info("Updating existing device", { deviceId });

      const { data, error } = await supabaseAdmin
        .from("extension_devices")
        .update({
          ...deviceData,
          updated_at: new Date().toISOString(),
        })
        .eq("device_id", deviceId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        Logger.error("Error updating device", error);
        throw error;
      }

      Logger.success("Device updated successfully", { deviceId });
      return { device: data, isNew: false };
    } else {
      // Insert new device
      Logger.info("Creating new device", { deviceId });

      const { data, error } = await supabaseAdmin
        .from("extension_devices")
        .insert({
          device_id: deviceId,
          user_id: userId,
          ...deviceData,
        })
        .select()
        .single();

      if (error) {
        Logger.error("Error creating device", error);
        throw error;
      }

      Logger.success("Device created successfully", { deviceId });
      return { device: data, isNew: true };
    }
  } catch (error) {
    Logger.error("Device registration failed", error);
    throw error;
  }
}

// ============================================
// LOG TO DATABASE
// ============================================
async function logToDatabase(
  supabaseAdmin: ReturnType<typeof createClient>,
  deviceId: string,
  userId: string,
  level: string,
  message: string,
  data?: unknown,
) {
  try {
    await supabaseAdmin.from("extension_logs").insert({
      device_id: deviceId,
      user_id: userId,
      level,
      message,
      data: data || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Don't throw - logging should not break the main flow
    Logger.error("Failed to write log to database", error);
  }
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  Logger.info(`[${requestId}] Request received`, {
    method: req.method,
    url: req.url,
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    Logger.info(`[${requestId}] CORS preflight request`);
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    Logger.warn(`[${requestId}] Method not allowed: ${req.method}`);
    return createErrorResponse(
      405,
      "Method Not Allowed",
      "Only POST requests are allowed",
      "METHOD_NOT_ALLOWED",
    );
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      Logger.error(`[${requestId}] Missing environment variables`);
      return createErrorResponse(
        500,
        "Internal Server Error",
        "Server configuration error",
        "MISSING_ENV_VARS",
      );
    }

    // Validate token
    const authHeader = req.headers.get("Authorization");
    const validationResult = await validateToken(
      authHeader,
      supabaseUrl,
      supabaseAnonKey,
    );

    if (!validationResult.valid) {
      Logger.warn(`[${requestId}] Token validation failed`, {
        error: validationResult.error,
      });
      return createErrorResponse(
        401,
        "Unauthorized",
        validationResult.error || "Invalid token",
        "INVALID_TOKEN",
        validationResult.details,
      );
    }

    const user = validationResult.user!;

    // Parse request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (error) {
      Logger.error(`[${requestId}] Failed to parse request body`, error);
      return createErrorResponse(
        400,
        "Bad Request",
        "Invalid JSON in request body",
        "INVALID_JSON",
      );
    }

    const { device_id, browser_info, version } = body;

    // Validate required fields
    if (!device_id) {
      Logger.warn(`[${requestId}] Missing device_id`);
      return createErrorResponse(
        400,
        "Bad Request",
        "device_id is required",
        "MISSING_DEVICE_ID",
      );
    }

    if (!browser_info) {
      Logger.warn(`[${requestId}] Missing browser_info`);
      return createErrorResponse(
        400,
        "Bad Request",
        "browser_info is required",
        "MISSING_BROWSER_INFO",
      );
    }

    if (!version) {
      Logger.warn(`[${requestId}] Missing version`);
      return createErrorResponse(
        400,
        "Bad Request",
        "version is required",
        "MISSING_VERSION",
      );
    }

    Logger.info(`[${requestId}] Processing registration`, {
      deviceId: device_id,
      userId: user.id,
      version,
    });

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Register device
    const { device, isNew } = await registerDevice(
      supabaseAdmin,
      device_id,
      user.id,
      browser_info,
      version,
    );

    // Log successful registration
    await logToDatabase(
      supabaseAdmin,
      device_id,
      user.id,
      "info",
      isNew ? "Device registered successfully" : "Device updated successfully",
      {
        browser_info,
        version,
        isNew,
        requestId,
      },
    );

    const duration = Date.now() - startTime;
    Logger.success(`[${requestId}] Registration completed in ${duration}ms`, {
      deviceId: device_id,
      userId: user.id,
      isNew,
    });

    return createSuccessResponse({
      success: true,
      device,
      message: isNew
        ? "Device registered successfully"
        : "Device updated successfully",
      device_id: device_id,
      user_id: user.id,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.error(`[${requestId}] Request failed after ${duration}ms`, error);

    // Check for specific database errors
    if (error && typeof error === "object") {
      const err = error as { code?: string; message?: string };

      if (err.code === "PGRST116") {
        return createErrorResponse(
          404,
          "Not Found",
          "Table not found - please ensure database is properly set up",
          "TABLE_NOT_FOUND",
          err.message,
        );
      }

      if (err.code === "23505") {
        return createErrorResponse(
          409,
          "Conflict",
          "Device already exists",
          "DUPLICATE_DEVICE",
          err.message,
        );
      }

      if (err.code?.startsWith("23")) {
        return createErrorResponse(
          400,
          "Bad Request",
          "Database constraint violation",
          "CONSTRAINT_VIOLATION",
          err.message,
        );
      }
    }

    return createErrorResponse(
      500,
      "Internal Server Error",
      error instanceof Error ? error.message : "An unexpected error occurred",
      "INTERNAL_ERROR",
      error instanceof Error ? error.stack : undefined,
    );
  }
});
