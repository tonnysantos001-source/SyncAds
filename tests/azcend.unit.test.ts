import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/azcend/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/azcend/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/azcend/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/azcend/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/azcend/v1/webhook.ts";

describe("Azcend Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({ merchantId: "merch_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("API Key (apiKey) é obrigatório.");
    });

    it("should fail validation if merchantId is missing", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Merchant ID (merchantId) é obrigatório.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123", merchantId: "merch_123" });
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
    it("should map request to payment payload correctly", () => {
      const request: any = {
        amount: 15.50,
        orderId: "ord_azcend_01",
        paymentMethod: "pix",
        customer: {
          name: "Azcend Customer",
          email: "azcend@azcend.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request, "merch_123");
      expect(payload.transaction_id).toBe("ord_azcend_01");
      expect(payload.amount).toBe(15.50);
      expect(payload.merchant_id).toBe("merch_123");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        transaction_id: "pay_999",
        status: "pending",
        qr_code: "azcend-qr-code",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("pay_999");
      expect(result.qrCode).toBe("azcend-qr-code");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        transaction_id: "pay_999",
        status: "success",
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

    beforeEach(() => {
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
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      mockMetrics = {
        increment: vi.fn(),
        timing: vi.fn(),
        recordSuccess: vi.fn(),
        recordFailure: vi.fn(),
      };

      service = new Service(mockHttp, mockLogger, mockCrypto, mockCache, mockMetrics);
    });

    it("should validate credentials successfully via ping (200 OK)", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const res = await service.validateCredentials({ apiKey: "key_val", merchantId: "merch_val" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Azcend");
    });

    it("should process PIX creation successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transaction_id: "pay_pix_azcend",
          status: "pending",
          qr_code: "azcend-qr-code"
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_azcend",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "12345678902",
        },
      };

      const config: any = {
        credentials: { apiKey: "key_test", merchantId: "merch_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("pay_pix_azcend");
      expect(response.qrCode).toBe("azcend-qr-code");
    });
  });
});
