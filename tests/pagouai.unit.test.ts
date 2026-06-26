import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/pagouai/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/pagouai/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/pagouai/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/pagouai/v1/client.ts";

describe("Pagou.ai Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A Chave Secreta de API (apiKey) é obrigatória.");
    });

    it("should pass validation with apiKey present", () => {
      const result = Validator.validateCredentials({ apiKey: "pg_sk_123" });
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
      expect(payload.buyer.document.type).toBe("CPF");
      expect(payload.buyer.document.number).toBe("12345678901");
      expect(payload.method).toBe("pix");
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
      expect(payload.buyer.document.type).toBe("CNPJ");
      expect(payload.buyer.document.number).toBe("12345678000190");
      // wait! in Mapper, cleanDoc is request.customer.document.replace(/\D/g, "")
      // "12.345.678/0001-90" -> "12345678000190" (14 chars)
    });

    it("should map Pix response correctly", () => {
      const mockResponse: any = {
        success: true,
        requestId: "req_1",
        data: {
          id: "tr_123",
          status: "pending",
          method: "pix",
          amount: 1500,
          currency: "BRL",
          pix: {
            qr_code: "pix-qr-code-string",
            expiration_date: "2026-03-16T14:15:00.000Z",
          },
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(false);
      expect(result.transactionId).toBe("tr_123");
      expect(result.status).toBe("pending");
      expect(result.qrCode).toBe("pix-qr-code-string");
      expect(result.pixData?.amount).toBe(15.00);
    });

    it("should map credit card with token correctly", () => {
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
          token: "pgct_token_123",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.method).toBe("credit_card");
      expect(payload.token).toBe("pgct_token_123");
      expect(payload.installments).toBe(3);
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
        json: async () => ({ success: true, data: [] }),
      });

      const res = await service.validateCredentials({ apiKey: "valid_key" });
      expect(res.isValid).toBe(true);
      expect(res.message).toBe("Conexão com Pagou.ai validada com sucesso.");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized token" }),
      });

      const res = await service.validateCredentials({ apiKey: "invalid_key" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Unauthorized token");
    });

    it("should process Pix creation successfully", async () => {
      mockHttp.request.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: "tr_pix_123",
            status: "pending",
            method: "pix",
            amount: 2500,
            currency: "BRL",
            pix: {
              qr_code: "pix_code_here",
              expiration_date: "2026-03-16T14:15:00.000Z",
            },
          },
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
        credentials: { apiKey: "test_key" },
        isTestMode: true,
      };

      const res = await service.createPix(request, config);
      expect(res.success).toBe(false); // since status is pending
      expect(res.transactionId).toBe("tr_pix_123");
      expect(res.qrCode).toBe("pix_code_here");
      expect(mockHttp.request).toHaveBeenCalledTimes(1);
    });
  });
});
