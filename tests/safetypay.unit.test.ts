import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/safetypay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/safetypay/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/safetypay/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/safetypay/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/safetypay/v1/webhook.ts";

describe("SafetyPay Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({ signatureKey: "sig_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("API Key (apiKey) é obrigatório.");
    });

    it("should fail validation if signatureKey is missing", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Signature Key (signatureKey) é obrigatório.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123", signatureKey: "sig_123" });
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
        orderId: "ord_safetypay_01",
        paymentMethod: "pix",
        customer: {
          name: "SafetyPay Customer",
          email: "safetypay@safetypay.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.transaction_id).toBe("ord_safetypay_01");
      expect(payload.amount).toBe(15.50);
      expect(payload.customer.name).toBe("SafetyPay Customer");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        transaction_id: "pay_999",
        status: "pending",
        qr_code: "safetypay-qr-code",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("pay_999");
      expect(result.qrCode).toBe("safetypay-qr-code");
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

      const res = await service.validateCredentials({ apiKey: "key_val", signatureKey: "sig_val" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com SafetyPay");
    });

    it("should process PIX creation successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transaction_id: "pay_pix_safetypay",
          status: "pending",
          qr_code: "safetypay-qr-code"
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_safetypay",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "12345678902",
        },
      };

      const config: any = {
        credentials: { apiKey: "key_test", signatureKey: "sig_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("pay_pix_safetypay");
      expect(response.qrCode).toBe("safetypay-qr-code");
    });
  });
});
