// ============================================================================
// AI SCHEMAS - VALIDAÇÃO DE OUTPUTS DA IA
// ============================================================================

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// SCHEMAS DE FERRAMENTAS (TOOL CALLING)
// ============================================================================

export const WebScrapingParamsSchema = z.object({
  url: z.string().url("URL inválida"),
  selector: z.string().optional(),
  waitForSelector: z.string().optional(),
  extractData: z.array(z.string()).optional(),
});

export const CreateCSVParamsSchema = z.object({
  data: z.array(z.record(z.any())),
  filename: z.string().min(1).max(255),
  headers: z.array(z.string()).optional(),
});

export const CreateExcelParamsSchema = z.object({
  sheets: z.array(z.object({
    name: z.string().min(1).max(31),
    data: z.array(z.record(z.any())),
    headers: z.array(z.string()).optional(),
  })),
  filename: z.string().min(1).max(255),
});

export const CreatePDFParamsSchema = z.object({
  content: z.string().min(1),
  filename: z.string().min(1).max(255),
  format: z.enum(["A4", "Letter", "Legal"]).optional().default("A4"),
  orientation: z.enum(["portrait", "landscape"]).optional().default("portrait"),
});

export const GenerateImageParamsSchema = z.object({
  prompt: z.string().min(1).max(1000),
  size: z.enum(["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"]).optional(),
  quality: z.enum(["standard", "hd"]).optional(),
  style: z.enum(["vivid", "natural"]).optional(),
});

export const PythonExecutorParamsSchema = z.object({
  code: z.string().min(1),
  timeout: z.number().min(1).max(300).optional().default(30),
  libraries: z.array(z.string()).optional(),
});

export const HttpRequestParamsSchema = z.object({
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  timeout: z.number().min(1).max(60).optional().default(30),
});

export const SendEmailParamsSchema = z.object({
  to: z.string().email().or(z.array(z.string().email())),
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
  html: z.boolean().optional().default(false),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
  })).optional(),
});

export const DatabaseQueryParamsSchema = z.object({
  query: z.string().min(1),
  params: z.array(z.any()).optional(),
  schema: z.string().optional().default("public"),
});

// ============================================================================
// SCHEMA DE TOOL CALL
// ============================================================================

export const ToolCallSchema = z.object({
  id: z.string().optional(),
  tool: z.enum([
    "web_scraping",
    "create_csv",
    "create_excel",
    "create_pdf",
    "generate_image",
    "python_executor",
    "http_request",
    "send_email",
    "database_query",
    "generate_video",
    "create_zip",
    "automation_engine",
  ]),
  params: z.record(z.any()),
});

// ============================================================================
// SCHEMA DE RESPOSTA DA IA
// ============================================================================

export const AIResponseSchema = z.object({
  message: z.string().min(1),
  toolCalls: z.array(ToolCallSchema).optional(),
  metadata: z.object({
    tokensUsed: z.number().optional(),
    provider: z.string().optional(),
    model: z.string().optional(),
    cached: z.boolean().optional(),
    processingTime: z.number().optional(),
  }).optional(),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
});

// ============================================================================
// SCHEMA DE RESPOSTA DE FERRAMENTA
// ============================================================================

export const ToolResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  downloadUrl: z.string().url().optional(),
  fileId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// SCHEMA DE CACHE DE IA
// ============================================================================

export const AICacheSchema = z.object({
  key: z.string(),
  response: z.string(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.date(),
  hits: z.number().default(0),
  createdAt: z.date(),
});

// ============================================================================
// SCHEMA DE RATE LIMIT
// ============================================================================

export const RateLimitSchema = z.object({
  userId: z.string().uuid(),
  endpoint: z.string(),
  count: z.number(),
  windowStart: z.date(),
  windowEnd: z.date(),
});

// ============================================================================
// VALIDAÇÃO DE PARÂMETROS POR FERRAMENTA
// ============================================================================

export const TOOL_PARAMS_SCHEMAS: Record<string, z.ZodSchema> = {
  web_scraping: WebScrapingParamsSchema,
  create_csv: CreateCSVParamsSchema,
  create_excel: CreateExcelParamsSchema,
  create_pdf: CreatePDFParamsSchema,
  generate_image: GenerateImageParamsSchema,
  python_executor: PythonExecutorParamsSchema,
  http_request: HttpRequestParamsSchema,
  send_email: SendEmailParamsSchema,
  database_query: DatabaseQueryParamsSchema,
};

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

export function validateToolCall(toolCall: unknown) {
  const result = ToolCallSchema.safeParse(toolCall);

  if (!result.success) {
    throw new Error(`Tool call inválido: ${result.error.message}`);
  }

  // Validar params específicos da ferramenta
  const { tool, params } = result.data;
  const paramsSchema = TOOL_PARAMS_SCHEMAS[tool];

  if (paramsSchema) {
    const paramsResult = paramsSchema.safeParse(params);
    if (!paramsResult.success) {
      throw new Error(
        `Parâmetros inválidos para ${tool}: ${paramsResult.error.message}`
      );
    }
    return { ...result.data, params: paramsResult.data };
  }

  return result.data;
}

export function validateAIResponse(response: unknown) {
  const result = AIResponseSchema.safeParse(response);

  if (!result.success) {
    throw new Error(`Resposta da IA inválida: ${result.error.message}`);
  }

  // Validar tool calls se existirem
  if (result.data.toolCalls) {
    result.data.toolCalls = result.data.toolCalls.map(validateToolCall);
  }

  return result.data;
}

export function validateToolResponse(response: unknown) {
  const result = ToolResponseSchema.safeParse(response);

  if (!result.success) {
    throw new Error(`Resposta de ferramenta inválida: ${result.error.message}`);
  }

  return result.data;
}

// ============================================================================
// TIPOS TYPESCRIPT
// ============================================================================

export type WebScrapingParams = z.infer<typeof WebScrapingParamsSchema>;
export type CreateCSVParams = z.infer<typeof CreateCSVParamsSchema>;
export type CreateExcelParams = z.infer<typeof CreateExcelParamsSchema>;
export type CreatePDFParams = z.infer<typeof CreatePDFParamsSchema>;
export type GenerateImageParams = z.infer<typeof GenerateImageParamsSchema>;
export type PythonExecutorParams = z.infer<typeof PythonExecutorParamsSchema>;
export type HttpRequestParams = z.infer<typeof HttpRequestParamsSchema>;
export type SendEmailParams = z.infer<typeof SendEmailParamsSchema>;
export type DatabaseQueryParams = z.infer<typeof DatabaseQueryParamsSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type ToolResponse = z.infer<typeof ToolResponseSchema>;
export type AICache = z.infer<typeof AICacheSchema>;
export type RateLimit = z.infer<typeof RateLimitSchema>;
