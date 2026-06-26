import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/bynet/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/bynet/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/bynet/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/bynet/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/bynet/v1/webhook.ts";

describe("Bynet Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiKey) é obrigatória.");
    });

    it("should pass validation with apiKey present", () => {
      const result = Validator.validateCredentials({ apiKey: "bynet_key_123" });
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
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Mapper", () => {
    it("should map request to payload correctly", () => {
      const request: any = {
        amount: 15.50,
        orderId: "ord_123",
        paymentMethod: "pix",
        customer: {
          name: "John Doe",
          email: "john@example.com",
          document: "123.456.789-10",
          phone: "(11) 99999-9999",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.amount).toBe(1550); // 15.50 * 100
      expect(payload.paymentMethod).toBe("PIX");
      expect(payload.customer.name).toBe("John Doe");
      expect(payload.customer.document.number).toBe("12345678910");
      expect(payload.customer.document.type).toBe("CPF");
      expect(payload.customer.phone).toBe("5511999999999");
    });

    it("should map response correctly", () => {
      const mockResponse: any = {
        id: "tr_bynet_123",
        status: "paid",
        amount: 1550,
        qrCode: "bynet-qr-code-pix",
        created_at: "2026-06-26T20:00:00Z",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tr_bynet_123");
      expect(result.status).toBe("approved");
      expect(result.qrCode).toBe("bynet-qr-code-pix");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload correctly", () => {
      const payload = {
        data: {
          id: "tr_web_777",
          status: "paid",
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("tr_web_777");
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

      const res = await service.validateCredentials({ apiKey: "valid-token" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("validada com sucesso");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ apiKey: "invalid-token" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("rejeitada pela Bynet");
    });

    it("should process Pix creation successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "tr_pix_bynet",
          status: "pending",
          amount: 2500,
          qrCode: "bynet-pix-copia-cola",
          created_at: "2026-06-26T20:00:00Z",
        }),
      });

      const request: any = {
        amount: 25.00,
        orderId: "ord_sync_88",
        paymentMethod: "pix",
        customer: {
          name: "Test User",
          email: "test@example.com",
          document: "123.456.789-01",
          phone: "11988887777",
        },
      };

      const config: any = {
        credentials: { apiKey: "test_key" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(false); // since status is pending
      expect(response.transactionId).toBe("tr_pix_bynet");
      expect(response.qrCode).toBe("bynet-pix-copia-cola");
      expect(mockHttp.request).toHaveBeenCalledTimes(1);
    });
  });
});
