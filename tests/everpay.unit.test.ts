import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/everpay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/everpay/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/everpay/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/everpay/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/everpay/v1/webhook.ts";

describe("Ever Pay Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiKey) é obrigatória.");
    });

    it("should pass validation with apiKey present", () => {
      const result = Validator.validateCredentials({ apiKey: "sk_live_123" });
      expect(result.isValid).toBe(true);
    });

    it("should validate payment request fields", () => {
      const invalidRequest: any = {
        amount: 0,
        customer: { name: "", email: "" },
        paymentMethod: "pix",
      };
      
      const result = Validator.validatePaymentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Mapper", () => {
    it("should map request to payload correctly", () => {
      const request: any = {
        amount: 19.99,
        orderId: "ord_999",
        paymentMethod: "pix",
        customer: {
          name: "Alice Cooper",
          email: "alice@cooper.com",
          document: "123.456.789-01",
          phone: "11988887777",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.amount).toBe(1999); // 19.99 * 100
      expect(payload.currency).toBe("brl");
      expect(payload.payment_method).toBe("pix");
      expect(payload.customer.name).toBe("Alice Cooper");
      expect(payload.customer.document).toBe("12345678901");
      expect(payload.customer.phone).toBe("11988887777");
    });

    it("should map response correctly", () => {
      const mockResponse: any = {
        id: "pay_ever_777",
        status: "succeeded",
        amount: 1999,
        currency: "brl",
        qr_code: "everpay-qr-code-copia-cola",
        created_at: "2026-06-26T20:00:00Z",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("pay_ever_777");
      expect(result.status).toBe("approved");
      expect(result.qrCode).toBe("everpay-qr-code-copia-cola");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload with data.object structure", () => {
      const payload = {
        type: "payment.succeeded",
        data: {
          object: {
            id: "pay_ever_999",
            status: "succeeded",
          },
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("pay_ever_999");
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

      const res = await service.validateCredentials({ apiKey: "sk_live_valid" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("estabelecida com Ever Pay");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ apiKey: "sk_live_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("rejeitada pela Ever Pay");
    });

    it("should process Pix creation successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pay_pix_123",
          status: "pending",
          amount: 5000,
          currency: "brl",
          qr_code: "everpay-qr-code-pix-string",
          created_at: "2026-06-26T20:00:00Z",
        }),
      });

      const request: any = {
        amount: 50.00,
        orderId: "ord_sync_88",
        paymentMethod: "pix",
        customer: {
          name: "Bob Dylan",
          email: "bob@example.com",
          document: "123.456.789-02",
          phone: "11977776666",
        },
      };

      const config: any = {
        credentials: { apiKey: "sk_test_key" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(false); // since status is pending
      expect(response.transactionId).toBe("pay_pix_123");
      expect(response.qrCode).toBe("everpay-qr-code-pix-string");
      expect(mockHttp.request).toHaveBeenCalledTimes(1);
    });
  });
});
