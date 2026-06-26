import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/brazapay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/brazapay/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/brazapay/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/brazapay/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/brazapay/v1/webhook.ts";

describe("Braza Pay Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({ accountId: "acc_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiKey) é obrigatória.");
    });

    it("should fail validation if accountId is missing", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Account ID (accountId) é obrigatório.");
    });

    it("should pass validation with apiKey and accountId present", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123", accountId: "acc_123" });
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
        amount: 25.50,
        orderId: "ord_braza_01",
        paymentMethod: "pix",
        customer: {
          name: "John Doe",
          email: "john@doe.com",
          document: "123.456.789-00",
          phone: "11999999999",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.amount).toBe(2550); // 25.50 * 100
      expect(payload.currency).toBe("BRL");
      expect(payload.paymentMethod.type).toBe("pix");
      expect(payload.customer.name).toBe("John Doe");
      expect(payload.customer.document.id).toBe("12345678900");
    });

    it("should map response correctly", () => {
      const mockResponse: any = {
        id: "tr_braza_999",
        status: "paid",
        amount: 2550,
        qrCode: "brazapay-qr-code-pix-copia-cola",
        createdAt: "2026-06-26T20:00:00Z",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tr_braza_999");
      expect(result.status).toBe("approved");
      expect(result.qrCode).toBe("brazapay-qr-code-pix-copia-cola");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        id: "tr_braza_999",
        status: "paid",
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("tr_braza_999");
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

      const res = await service.validateCredentials({ apiKey: "key_valid", accountId: "acc_valid" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Braza Pay");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ apiKey: "key_invalid", accountId: "acc_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pela Braza Pay");
    });

    it("should process Pix creation successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "tr_braza_100",
          status: "pending",
          amount: 5000,
          qrCode: "braza-qr-code-pix-string",
          createdAt: "2026-06-26T20:00:00Z",
        }),
      });

      const request: any = {
        amount: 50.00,
        orderId: "ord_sync_braza",
        paymentMethod: "pix",
        customer: {
          name: "David Gilmour",
          email: "david@pinkfloyd.com",
          document: "123.456.789-02",
          phone: "11977776666",
        },
      };

      const config: any = {
        credentials: { apiKey: "key_test", accountId: "acc_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(false); // status is pending
      expect(response.transactionId).toBe("tr_braza_100");
      expect(response.qrCode).toBe("braza-qr-code-pix-string");
    });
  });
});
