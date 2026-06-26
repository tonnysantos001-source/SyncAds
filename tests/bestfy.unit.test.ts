import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/bestfy/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/bestfy/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/bestfy/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/bestfy/v1/client.ts";

describe("Bestfy Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if token is missing", () => {
      const result = Validator.validateCredentials({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("O Token é obrigatório.");
    });

    it("should pass validation with token present", () => {
      const result = Validator.validateCredentials({ token: "bf_sk_123" });
      expect(result.isValid).toBe(true);
    });

    it("should validate payment request fields", () => {
      const invalidRequest: any = {
        amount: 0,
        customer: { name: "", email: "", document: "" },
        paymentMethod: "pix",
      };
      
      const result = Validator.validatePaymentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Mapper", () => {
    it("should map CPF documents correctly", () => {
      const request: any = {
        amount: 15.00,
        orderId: "ord_123",
        paymentMethod: "pix",
        customer: {
          name: "John Doe",
          email: "john@example.com",
          document: "123.456.789-01",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.amount).toBe(1500); // 15.00 * 100
      expect(payload.customer.document?.type).toBe("cpf");
      expect(payload.customer.document?.number).toBe("12345678901");
      expect(payload.paymentMethod).toBe("pix");
      expect(payload.items.length).toBe(1);
      expect(payload.items[0].title).toContain("Pedido SyncAds AI #ord_123");
    });

    it("should map CNPJ documents correctly", () => {
      const request: any = {
        amount: 50.00,
        orderId: "ord_456",
        paymentMethod: "boleto",
        customer: {
          name: "Biz Corp",
          email: "corp@example.com",
          document: "12.345.678/0001-90",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.customer.document?.type).toBe("cnpj");
      expect(payload.customer.document?.number).toBe("12345678000190");
    });

    it("should map Pix response correctly", () => {
      const mockResponse: any = {
        id: 282,
        amount: 1500,
        paymentMethod: "pix",
        status: "pending",
        pix: {
          qrcode: "pix-qr-code-string",
          url: "https://pix-url",
          expirationDate: "2026-03-16T14:15:00.000Z",
          createdAt: "2026-03-16T14:10:00.000Z",
        },
        createdAt: "2026-03-16T14:10:00.000Z",
        updatedAt: "2026-03-16T14:10:00.000Z",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(false); // since status is pending
      expect(result.transactionId).toBe("282");
      expect(result.status).toBe("pending");
      expect(result.qrCode).toBe("pix-qr-code-string");
      expect(result.pixData?.amount).toBe(15.00);
    });

    it("should map credit card request fields correctly with token", () => {
      const request: any = {
        amount: 100.00,
        orderId: "ord_789",
        paymentMethod: "credit_card",
        installments: 3,
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
          document: "12345678901",
        },
        metadata: {
          token: "card_token_123",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.paymentMethod).toBe("credit_card");
      expect(payload.installments).toBe(3);
      expect(payload.card?.hash).toBe("card_token_123");
    });
  });

  describe("Service Integration & Execution", () => {
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
        sanitize: vi.fn((data) => data),
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

    it("should validate credentials via ping successfully", async () => {
      mockHttp.request.mockResolvedValue({
        ok: true,
        json: async () => ({ amount: 1000, recipientId: 327 }),
      });

      const res = await service.validateCredentials({ token: "valid_token" });
      expect(res.isValid).toBe(true);
      expect(res.message).toBe("Conexão com Bestfy validada com sucesso.");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized api token" }),
      });

      const res = await service.validateCredentials({ token: "invalid_token" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Unauthorized api token");
    });

    it("should process Pix creation successfully", async () => {
      mockHttp.request.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 282,
          amount: 2500,
          paymentMethod: "pix",
          status: "pending",
          pix: {
            qrcode: "pix_code_here",
            url: "https://pix-url",
            expirationDate: "2026-03-16T14:15:00.000Z",
            createdAt: "2026-03-16T14:10:00.000Z",
          },
          createdAt: "2026-03-16T14:10:00.000Z",
          updatedAt: "2026-03-16T14:10:00.000Z",
        }),
      });

      const request: any = {
        amount: 25.00,
        orderId: "ord_999",
        paymentMethod: "pix",
        customer: {
          name: "Test User",
          email: "test@example.com",
          document: "123.456.789-10",
        },
      };

      const config: any = {
        credentials: { token: "test_token" },
        isTestMode: true,
      };

      const res = await service.createPix(request, config);
      expect(res.success).toBe(false); // since status is pending
      expect(res.transactionId).toBe("282");
      expect(res.qrCode).toBe("pix_code_here");
      expect(mockHttp.request).toHaveBeenCalledTimes(1);
    });
  });
});
