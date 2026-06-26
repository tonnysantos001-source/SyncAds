import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/paypal/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/paypal/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/paypal/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/paypal/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/paypal/v1/webhook.ts";

describe("PayPal Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if clientId is missing", () => {
      const result = Validator.validateCredentials({ clientSecret: "secret_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Client ID (clientId) é obrigatório.");
    });

    it("should fail validation if clientSecret is missing", () => {
      const result = Validator.validateCredentials({ clientId: "id_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Client Secret (clientSecret) é obrigatório.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ clientId: "id_123", clientSecret: "secret_123" });
      expect(result.isValid).toBe(true);
    });

    it("should validate payment request fields", () => {
      const invalidRequest: any = {
        amount: 0,
        customer: { email: "" },
        paymentMethod: "paypal",
      };
      
      const result = Validator.validatePaymentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it("should validate credit card specific fields", () => {
      const invalidRequest: any = {
        amount: 10.00,
        orderId: "ord_123",
        customer: { email: "test@test.com" },
        paymentMethod: "credit_card",
        card: null
      };
      
      const result = Validator.validatePaymentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Dados do cartão são obrigatórios para pagamento via cartão de crédito.");
    });
  });

  describe("Mapper", () => {
    it("should map request to payment payload correctly", () => {
      const request: any = {
        amount: 15.50,
        orderId: "ord_paypal_01",
        paymentMethod: "paypal",
        customer: {
          name: "PayPal Customer",
          email: "paypal@paypal.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.intent).toBe("CAPTURE");
      expect(payload.purchase_units[0].reference_id).toBe("ord_paypal_01");
      expect(payload.purchase_units[0].amount.value).toBe("15.50");
    });

    it("should map response correctly for PayPal Wallet", () => {
      const mockResponse: any = {
        id: "ord_999",
        status: "APPROVED",
        links: [
          { href: "https://paypal.com/approve", rel: "approve", method: "GET" }
        ]
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("ord_999");
      expect(result.gatewayTransactionId).toBe("ord_999");
      expect(result.redirectUrl).toBe("https://paypal.com/approve");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle payment completed webhook payload", () => {
      const payload = {
        event_type: "PAYMENT.CAPTURE.COMPLETED",
        resource: {
          id: "cap_999",
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("cap_999");
      expect(result.status).toBe("approved");
    });

    it("should handle refund webhook payload", () => {
      const payload = {
        event_type: "PAYMENT.CAPTURE.REFUNDED",
        resource: {
          id: "ref_999",
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.status).toBe("refunded");
    });
  });

  describe("Service", () => {
    let mockHttp: any;
    let mockLogger: any;
    let mockCrypto: any;
    let mockCache: any;
    let mockMetrics: any;
    let service: Service;
    let cacheStore: Record<string, any>;

    beforeEach(() => {
      cacheStore = {};
      mockHttp = {
        request: vi.fn(),
      };
      mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        sanitize: (data: any) => data,
      };
      mockCrypto = {
        encrypt: vi.fn(),
        decrypt: vi.fn(),
      };
      mockCache = {
        get: vi.fn().mockImplementation(async (key: string) => cacheStore[key] || null),
        set: vi.fn().mockImplementation(async (key: string, val: any) => { cacheStore[key] = val; }),
        delete: vi.fn().mockImplementation(async (key: string) => { delete cacheStore[key]; }),
      };
      mockMetrics = {
        increment: vi.fn(),
        timing: vi.fn(),
        recordSuccess: vi.fn(),
        recordFailure: vi.fn(),
      };

      service = new Service(mockHttp, mockLogger, mockCrypto, mockCache, mockMetrics);
    });

    it("should validate credentials successfully via token fetch (200 OK)", async () => {
      // Mock OAuth token fetch inside Client
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "mock_paypal_token",
          expires_in: 3600
        }),
      });

      const res = await service.validateCredentials({ clientId: "id_val", clientSecret: "secret_val" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com PayPal");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error_description: "Invalid client credentials" }),
      });

      const res = await service.validateCredentials({ clientId: "id_inval", clientSecret: "secret_inval" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pelo PayPal");
    });

    it("should process PayPal Wallet creation successfully", async () => {
      // Mock token fetch
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
      // Mock createOrder
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ord_paypal_wallet",
          status: "CREATED",
          links: [
            { href: "https://paypal.com/approve", rel: "approve", method: "GET" }
          ]
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_paypal",
        paymentMethod: "paypal",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "12345678902",
        },
      };

      const config: any = {
        credentials: { clientId: "id_test", clientSecret: "secret_test" },
        isTestMode: true,
      };

      const response = await service.createPayment(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("ord_paypal_wallet");
      expect(response.redirectUrl).toBe("https://paypal.com/approve");
    });

    it("should process Credit Card creation and capture successfully", async () => {
      // Mock token fetch
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
      // Mock createOrder
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ord_paypal_card",
          status: "CREATED",
        }),
      });
      // Mock captureOrder
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ord_paypal_card",
          status: "COMPLETED",
          purchase_units: [
            {
              payments: {
                captures: [
                  { id: "cap_123", status: "COMPLETED" }
                ]
              }
            }
          ]
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_paypal_card",
        paymentMethod: "credit_card",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "12345678902",
        },
        card: {
          number: "1234567812345678",
          holderName: "John Frusciante",
          expiryMonth: "12",
          expiryYear: "2030",
          cvv: "123"
        }
      };

      const config: any = {
        credentials: { clientId: "id_test", clientSecret: "secret_test" },
        isTestMode: true,
      };

      const response = await service.createPayment(request, config);
      expect(response.success).toBe(true);
      expect(response.gatewayTransactionId).toBe("cap_123");
      expect(response.status).toBe("approved");
    });
  });
});
