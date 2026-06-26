import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/stone/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/stone/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/stone/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/stone/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/stone/v1/webhook.ts";

describe("Stone Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({ merchantId: "merch_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiKey) é obrigatória.");
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
        customer: { name: "", email: "" },
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
        orderId: "ord_stone_01",
        paymentMethod: "pix",
        customer: {
          name: "Stone Customer",
          email: "stone@stone.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request, "merch_123");
      expect(payload.amount).toBe(1550);
      expect(payload.merchant_id).toBe("merch_123");
      expect(payload.customer.name).toBe("Stone Customer");
      expect(payload.payment_method).toBe("pix");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        id: "pay_999",
        status: "pending",
        amount: 1550,
        pix: {
          qr_code: "stone-qr-code",
          qr_code_base64: "stone-qr-base64",
          expires_at: "2026-06-26T20:00:00Z",
        },
        metadata: {
          order_id: "ord_stone_01",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(false);
      expect(result.transactionId).toBe("ord_stone_01");
      expect(result.gatewayTransactionId).toBe("pay_999");
      expect(result.qrCode).toBe("stone-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("stone-qr-base64");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        id: "evt_999",
        data: {
          id: "pay_999",
          status: "paid",
          metadata: {
            order_id: "ord_stone_01",
          },
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("ord_stone_01");
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

      const res = await service.validateCredentials({ apiKey: "key_valid", merchantId: "merch_valid" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Stone");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ apiKey: "key_invalid", merchantId: "merch_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pela Stone");
    });

    it("should process PIX creation successfully", async () => {
      // mock createPayment
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pay_999",
          status: "pending",
          amount: 1550,
          pix: {
            qr_code: "stone-qr-code",
            qr_code_base64: "stone-qr-base64",
            expires_at: "2026-06-26T20:00:00Z",
          },
          metadata: {
            order_id: "ord_sync_stone",
          },
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_stone",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "123.456.789-02",
        },
      };

      const config: any = {
        credentials: { apiKey: "key_test", merchantId: "merch_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(false);
      expect(response.transactionId).toBe("ord_sync_stone");
      expect(response.gatewayTransactionId).toBe("pay_999");
      expect(response.qrCode).toBe("stone-qr-code");
    });
  });
});
