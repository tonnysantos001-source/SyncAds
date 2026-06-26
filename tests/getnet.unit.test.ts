import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/getnet/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/getnet/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/getnet/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/getnet/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/getnet/v1/webhook.ts";

describe("Getnet Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if clientId is missing", () => {
      const result = Validator.validateCredentials({ clientSecret: "sec_123", sellerId: "sel_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Client ID (clientId) é obrigatório.");
    });

    it("should fail validation if clientSecret is missing", () => {
      const result = Validator.validateCredentials({ clientId: "id_123", sellerId: "sel_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Client Secret (clientSecret) é obrigatório.");
    });

    it("should fail validation if sellerId is missing", () => {
      const result = Validator.validateCredentials({ clientId: "id_123", clientSecret: "sec_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Seller ID (sellerId) é obrigatório.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ clientId: "id_123", clientSecret: "sec_123", sellerId: "sel_123" });
      expect(result.isValid).toBe(true);
    });

    it("should validate payment request fields", () => {
      const invalidRequest: any = {
        amount: 0,
        customer: { email: "" },
        paymentMethod: "pix",
      };
      
      const result = Validator.validatePaymentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Mapper", () => {
    it("should map request to payment payload correctly for PIX", () => {
      const request: any = {
        amount: 15.50,
        orderId: "ord_getnet_01",
        paymentMethod: "pix",
        customer: {
          name: "Getnet Customer",
          email: "getnet@getnet.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request, "sel_123");
      expect(payload.seller_id).toBe("sel_123");
      expect(payload.payment_method).toBe("pix");
      expect(payload.amount).toBe(1550);
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        payment_id: "pay_999",
        status: "PENDING",
        amount: 1550,
        pix: {
          qr_code: "getnet-qr-code",
          qr_code_base64: "getnet-qr-base64",
          expiration_date_qrcode: "2026-06-26T20:00:00Z",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("pay_999");
      expect(result.gatewayTransactionId).toBe("pay_999");
      expect(result.qrCode).toBe("getnet-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("getnet-qr-base64");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        payment_id: "pay_999",
        status: "APPROVED",
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("pay_999");
      expect(result.status).toBe("approved");
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
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "mock_getnet_token",
          expires_in: 3600
        }),
      });

      const res = await service.validateCredentials({ clientId: "id_val", clientSecret: "sec_val", sellerId: "sel_val" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Getnet");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error_description: "Invalid client credentials" }),
      });

      const res = await service.validateCredentials({ clientId: "id_inval", clientSecret: "sec_inval", sellerId: "sel_inval" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pelo Getnet");
    });

    it("should process PIX creation successfully", async () => {
      // Mock token fetch
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
      // Mock createPix
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payment_id: "pay_pix_getnet",
          status: "PENDING",
          qrcode_text: "getnet-qr-code",
          qrcode_image: "getnet-qr-base64",
          expiration_date: "2026-06-26T20:00:00Z"
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_getnet",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "12345678902",
        },
      };

      const config: any = {
        credentials: { clientId: "id_test", clientSecret: "sec_test", sellerId: "sel_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("pay_pix_getnet");
      expect(response.qrCode).toBe("getnet-qr-code");
    });

    it("should process Credit Card creation successfully", async () => {
      // Mock token fetch
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
      // Mock createCreditCard
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payment_id: "pay_cc_getnet",
          status: "APPROVED",
          authorization_code: "auth123",
          terminal_nsu: "12345",
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_getnet_cc",
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
        credentials: { clientId: "id_test", clientSecret: "sec_test", sellerId: "sel_test" },
        isTestMode: true,
      };

      const response = await service.createCreditCard(request, config);
      expect(response.success).toBe(true);
      expect(response.gatewayTransactionId).toBe("pay_cc_getnet");
      expect(response.status).toBe("approved");
    });
  });
});
