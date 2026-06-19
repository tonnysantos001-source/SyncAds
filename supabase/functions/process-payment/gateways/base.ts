// ============================================
// CLASSE BASE ABSTRATA PARA GATEWAYS
// ============================================
//
// Esta classe fornece funcionalidades comuns que
// todos os gateways de pagamento podem usar.
//
// Cada gateway específico deve estender esta classe
// e implementar os métodos abstratos.
// ============================================

import {
  GatewayProcessor,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentMethod,
  GatewayConfig,
  GatewayCredentials,
  CredentialValidationResult,
  PaymentStatusResponse,
  RefundRequest,
  RefundResponse,
  WebhookResponse,
  WebhookValidationResult,
  GatewayError,
  ValidationError,
  AuthenticationError,
  GatewayEndpoints,
} from "./types.ts";

/**
 * Classe base abstrata para todos os gateways
 *
 * Fornece:
 * - Validações comuns
 * - Logging estruturado
 * - Tratamento de erros
 * - Utilitários HTTP
 * - Formatação de dados
 */
export abstract class BaseGateway implements PaymentGateway {
  abstract name: string;
  abstract slug: string;
  abstract supportedMethods: PaymentMethod[];
  abstract endpoints: GatewayEndpoints;

  // Cache estático em memória para credenciais descriptografadas
  protected static credentialCache = new Map<string, { credentials: any; expiresAt: number }>();

  // ===== RETROCOMPATIBILIDADE: MÉTODOS ABSTRATOS LEGADOS =====
  abstract validateCredentials(
    credentials: GatewayCredentials,
  ): Promise<CredentialValidationResult>;

  abstract processPayment(
    request: PaymentRequest,
    config: GatewayConfig,
  ): Promise<PaymentResponse>;

  abstract handleWebhook(
    payload: any,
    signature?: string,
  ): Promise<WebhookResponse>;

  abstract getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig,
  ): Promise<PaymentStatusResponse>;

  // ===== IMPLEMENTAÇÃO DA NOVA INTERFACE PaymentGateway =====
  async createPayment(
    request: PaymentRequest,
    config: GatewayConfig,
  ): Promise<PaymentResponse> {
    return this.processPayment(request, config);
  }

  async getPayment(
    gatewayTransactionId: string,
    config: GatewayConfig,
  ): Promise<PaymentStatusResponse> {
    return this.getPaymentStatus(gatewayTransactionId, config);
  }

  async validateWebhook(
    payload: any,
    signature?: string,
    secret?: string,
  ): Promise<WebhookValidationResult> {
    try {
      const res = await this.handleWebhook(payload, signature);
      return {
        isValid: res.success,
        error: res.success ? undefined : res.message,
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: err.message,
      };
    }
  }

  async healthCheck(
    config: GatewayConfig,
  ): Promise<CredentialValidationResult> {
    const creds = await this.resolveCredentials(config);
    return this.validateCredentials(creds);
  }

  // ===== AUXILIARES DE CACHE DE CREDENCIAIS =====

  protected getCachedCredentials(configId: string): any | null {
    const entry = BaseGateway.credentialCache.get(configId);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.credentials;
    }
    return null;
  }

  protected setCachedCredentials(configId: string, credentials: any, ttlMs: number = 300000): void {
    BaseGateway.credentialCache.set(configId, {
      credentials,
      expiresAt: Date.now() + ttlMs
    });
  }

  protected async decryptJsonGCM(keyB64: string, cipherB64: string): Promise<any | null> {
    try {
      const rawKey = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
      
      const bin = atob(cipherB64);
      const packed = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) packed[i] = bin.charCodeAt(i);
      
      const iv = packed.slice(0, 12);
      const data = packed.slice(12);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
      const text = new TextDecoder().decode(new Uint8Array(plain));
      return JSON.parse(text);
    } catch (error) {
      this.log("error", `Failed to decrypt credentials: ${error.message}`);
      return null;
    }
  }

  protected async resolveCredentials(config: GatewayConfig): Promise<any> {
    if (!config) return {};
    
    // 1. Tentar ler do cache
    const cached = this.getCachedCredentials(config.id);
    if (cached) {
      return cached;
    }

    // 2. Se tiver credentials em texto plano, usar
    if (config.credentials && Object.keys(config.credentials).length > 0 && !config.credentials.apiKey?.includes("****")) {
      this.setCachedCredentials(config.id, config.credentials);
      return config.credentials;
    }

    // 3. Senão, tentar descriptografar
    const enc = (config as any).credentialsEncrypted;
    const keyB64 = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY");
    if (enc && keyB64) {
      const decrypted = await this.decryptJsonGCM(keyB64, enc);
      if (decrypted) {
        this.setCachedCredentials(config.id, decrypted);
        return decrypted;
      }
    }

    return config.credentials || {};
  }

  // ===== GRAVAÇÃO DE LOGS ENRIQUECIDOS =====

  public async saveGatewayLog(params: {
    userId: string;
    environment: string;
    transactionId?: string;
    request: any;
    response: any;
    status: string;
    statusCode?: number;
    executionTime: number;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      
      if (!supabaseUrl || !supabaseServiceRole) {
        console.warn("[LOG] Supabase credentials missing, could not persist log to database.");
        return;
      }
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const client = createClient(supabaseUrl, supabaseServiceRole);
      
      const logEntry = {
        gateway: this.slug,
        environment: params.environment || "production",
        userId: params.userId,
        transactionId: params.transactionId || null,
        request: this.sanitizeForLog(params.request),
        response: this.sanitizeForLog(params.response),
        status: params.status,
        statusCode: params.statusCode || null,
        executionTime: params.executionTime,
        errorMessage: params.errorMessage || null
      };

      await client.from("gateway_logs").insert(logEntry);
      console.log(`[LOG] Saved rico log to database for ${this.slug}`);
    } catch (err: any) {
      console.error("[LOG] Failed to save gateway log to database:", err.message);
    }
  }

  // ===== MÉTODOS AUXILIARES COMUNS =====

  /**
   * Valida se o método de pagamento é suportado por este gateway
   */
  protected validatePaymentMethod(method: PaymentMethod): boolean {
    console.log(`[${this.name}] Validating payment method...`);
    console.log(`[${this.name}] - Method received:`, method);
    console.log(`[${this.name}] - Method type:`, typeof method);
    console.log(`[${this.name}] - Supported methods:`, this.supportedMethods);
    console.log(
      `[${this.name}] - Supported methods types:`,
      this.supportedMethods.map((m) => typeof m),
    );

    const isSupported = this.supportedMethods.includes(method);
    console.log(`[${this.name}] - Is supported?`, isSupported);

    // Tentar comparação com string também
    const methodAsString = String(method);
    const includesAsString = this.supportedMethods.some(
      (m) => String(m) === methodAsString,
    );
    console.log(`[${this.name}] - Includes as string?`, includesAsString);

    return isSupported || includesAsString;
  }

  /**
   * Valida dados básicos da requisição de pagamento
   */
  protected validatePaymentRequest(request: PaymentRequest): void {
    const errors: string[] = [];

    if (!request.userId) {
      errors.push("userId is required");
    }

    if (!request.orderId) {
      errors.push("orderId is required");
    }

    if (!request.amount || request.amount <= 0) {
      errors.push("amount must be greater than 0");
    }

    if (!request.paymentMethod) {
      errors.push("paymentMethod is required");
    }

    console.log(`[${this.name}] Validating payment request...`);
    console.log(
      `[${this.name}] - Payment method from request:`,
      request.paymentMethod,
    );
    console.log(
      `[${this.name}] - Payment method type:`,
      typeof request.paymentMethod,
    );

    if (!this.validatePaymentMethod(request.paymentMethod)) {
      const errorMsg = `Payment method ${request.paymentMethod} not supported by ${this.name}`;
      console.error(`[${this.name}] ❌ ${errorMsg}`);
      console.error(
        `[${this.name}] ❌ Supported methods:`,
        this.supportedMethods,
      );
      errors.push(errorMsg);
    } else {
      console.log(`[${this.name}] ✅ Payment method validated successfully`);
    }

    if (!request.customer) {
      errors.push("customer information is required");
    } else {
      if (!request.customer.name) {
        errors.push("customer.name is required");
      }
      if (!request.customer.email) {
        errors.push("customer.email is required");
      }
      if (!request.customer.document) {
        errors.push("customer.document is required");
      }
    }

    // Validação específica para cartão
    if (
      request.paymentMethod === PaymentMethod.CREDIT_CARD ||
      request.paymentMethod === PaymentMethod.DEBIT_CARD
    ) {
      if (!request.card) {
        errors.push("card information is required for card payments");
      } else {
        if (!request.card.number) {
          errors.push("card.number is required");
        }
        if (!request.card.holderName) {
          errors.push("card.holderName is required");
        }
        if (!request.card.expiryMonth) {
          errors.push("card.expiryMonth is required");
        }
        if (!request.card.expiryYear) {
          errors.push("card.expiryYear is required");
        }
        if (!request.card.cvv) {
          errors.push("card.cvv is required");
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `Payment validation failed: ${errors.join(", ")}`,
      );
    }
  }

  /**
   * Faz requisição HTTP com tratamento de erro
   */
  protected async makeRequest<T = any>(
    url: string,
    options: RequestInit,
  ): Promise<T> {
    try {
      this.log("info", `Making request to ${url}`, {
        method: options.method || "GET",
      });

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        this.log("error", `Request failed with status ${response.status}`, {
          url,
          status: response.status,
          data,
        });

        throw new GatewayError(
          data.message || data.error || "Request failed",
          this.slug,
          data.code || data.error_code,
          response.status,
          data,
        );
      }

      this.log("info", `Request successful`, { url });
      return data;
    } catch (error: any) {
      if (error instanceof GatewayError) {
        throw error;
      }

      this.log("error", `Request error: ${error.message}`, {
        url,
        error: error.toString(),
      });

      throw new GatewayError(
        `Failed to communicate with ${this.name}: ${error.message}`,
        this.slug,
        undefined,
        undefined,
        error,
      );
    }
  }

  /**
   * Obtém o endpoint correto baseado no ambiente
   */
  protected getEndpoint(config: GatewayConfig): string {
    const isTest =
      config.testMode || config.credentials.environment === "sandbox";

    if (isTest && this.endpoints.sandbox) {
      return this.endpoints.sandbox;
    }

    if (this.endpoints.test && config.credentials.environment === "test") {
      return this.endpoints.test;
    }

    return this.endpoints.production;
  }

  /**
   * Formata valor monetário para centavos (se necessário)
   */
  protected formatAmountToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Formata valor monetário de centavos para reais
   */
  protected formatAmountFromCents(cents: number): number {
    return cents / 100;
  }

  /**
   * Formata documento (CPF/CNPJ) removendo caracteres especiais
   */
  protected formatDocument(document: string): string {
    return document.replace(/[^\d]/g, "");
  }

  /**
   * Formata telefone removendo caracteres especiais
   */
  protected formatPhone(phone: string): string {
    return phone.replace(/[^\d]/g, "");
  }

  /**
   * Formata CEP removendo caracteres especiais
   */
  protected formatZipCode(zipCode: string): string {
    return zipCode.replace(/[^\d]/g, "");
  }

  /**
   * Valida CPF
   */
  protected isValidCPF(cpf: string): boolean {
    const cleanCPF = this.formatDocument(cpf);

    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    let remainder: number;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
  }

  /**
   * Valida CNPJ
   */
  protected isValidCNPJ(cnpj: string): boolean {
    const cleanCNPJ = this.formatDocument(cnpj);

    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    let length = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, length);
    const digits = cleanCNPJ.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cleanCNPJ.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }

  /**
   * Valida documento (CPF ou CNPJ)
   */
  protected validateDocument(document: string): boolean {
    const cleanDoc = this.formatDocument(document);

    if (cleanDoc.length === 11) {
      return this.isValidCPF(cleanDoc);
    } else if (cleanDoc.length === 14) {
      return this.isValidCNPJ(cleanDoc);
    }

    return false;
  }

  /**
   * Detecta tipo de documento
   */
  protected getDocumentType(document: string): "CPF" | "CNPJ" | "OTHER" {
    const cleanDoc = this.formatDocument(document);

    if (cleanDoc.length === 11) return "CPF";
    if (cleanDoc.length === 14) return "CNPJ";

    return "OTHER";
  }

  /**
   * Gera ID único para transação
   */
  protected generateTransactionId(): string {
    return `${this.slug}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Converte status do gateway para status padrão
   * Cada gateway deve sobrescrever este método
   */
  protected normalizeStatus(gatewayStatus: string): PaymentStatus {
    // Status comuns que funcionam para maioria dos gateways
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      approved: PaymentStatus.APPROVED,
      paid: PaymentStatus.APPROVED,
      success: PaymentStatus.APPROVED,
      completed: PaymentStatus.APPROVED,
      failed: PaymentStatus.FAILED,
      error: PaymentStatus.FAILED,
      declined: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
      canceled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      processing: PaymentStatus.PROCESSING,
      expired: PaymentStatus.EXPIRED,
    };

    return statusMap[gatewayStatus.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Log estruturado
   */
  protected log(
    level: "info" | "warn" | "error" | "debug",
    message: string,
    data?: any,
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      gateway: this.slug,
      level,
      message,
      data,
    };

    if (level === "error") {
      console.error(JSON.stringify(logEntry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Cria resposta de erro padronizada
   */
  protected createErrorResponse(
    error: any,
    defaultMessage: string,
  ): PaymentResponse {
    this.log("error", `Payment error: ${error.message}`, {
      error: error.toString(),
      stack: error.stack,
    });

    return {
      success: false,
      status: PaymentStatus.FAILED,
      message: error.message || defaultMessage,
      error: error.toString(),
      errorCode: error.code || error.errorCode,
    };
  }

  /**
   * Cria resposta de sucesso padronizada
   */
  protected createSuccessResponse(
    data: Partial<PaymentResponse>,
  ): PaymentResponse {
    return {
      success: true,
      status: data.status || PaymentStatus.PENDING,
      message: data.message || "Payment processed successfully",
      ...data,
    };
  }

  /**
   * Sanitiza dados sensíveis para logging
   */
  protected sanitizeForLog(data: any): any {
    if (!data) return data;

    const sensitive = [
      "password",
      "secret",
      "token",
      "key",
      "cvv",
      "ccv",
      "card",
      "number",
      "cardNumber",
    ];

    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitive.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = "***REDACTED***";
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = this.sanitizeForLog(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Sleep/delay utility
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry logic para requisições
   */
  protected async retryRequest<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        this.log("warn", `Request failed, retry ${i + 1}/${maxRetries}`, {
          error: error.message,
        });

        if (i < maxRetries - 1) {
          await this.sleep(delayMs * (i + 1)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Valida assinatura de webhook (padrão HMAC SHA256)
   * Cada gateway pode sobrescrever se usar método diferente
   */
  protected async validateWebhookSignatureHMAC(
    payload: any,
    signature: string,
    secret: string,
  ): Promise<WebhookValidationResult> {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(
        typeof payload === "string" ? payload : JSON.stringify(payload),
      );

      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        messageData,
      );

      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const signatureHex = signatureArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const isValid = signatureHex === signature;

      return {
        isValid,
        error: isValid ? undefined : "Invalid signature",
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  // ===== MÉTODOS COM IMPLEMENTAÇÃO PADRÃO =====

  /**
   * Reembolso (pode ser sobrescrito)
   */
  async refundPayment(
    request: RefundRequest,
    config: GatewayConfig,
  ): Promise<RefundResponse> {
    throw new Error(`Refund not implemented for ${this.name}`);
  }

  /**
   * Cancelamento (pode ser sobrescrito)
   */
  async cancelPayment(
    gatewayTransactionId: string,
    config: GatewayConfig,
  ): Promise<PaymentResponse> {
    throw new Error(`Cancel not implemented for ${this.name}`);
  }
}
