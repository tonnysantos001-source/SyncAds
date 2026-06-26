import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/efi/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/efi/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/efi/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/efi/v1/client.ts";

describe("Efí Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if clientId is missing", () => {
      const result = Validator.validateCredentials({ clientSecret: "abc" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("O clientId é obrigatório.");
    });

    it("should fail validation if clientSecret is missing", () => {
      const result = Validator.validateCredentials({ clientId: "abc" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("O clientSecret é obrigatório.");
    });

    it("should pass validation with both present", () => {
      const result = Validator.validateCredentials({ clientId: "abc", clientSecret: "def" });
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
      expect(payload.amount).toBe(15.00);
      expect(payload.customer.document).toBe("12345678901");
      expect(payload.payment_method).toBe("pix");
    });

    it("should map Pix response correctly", () => {
      const mockResponse: any = {
        id: "tr_123",
        status: "pending",
        amount: 15.00,
        pix_qr_code: "pix-qr-code-string",
        expires_at: "2026-03-16T14:15:00.000Z",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(false); // since status is pending
      expect(result.transactionId).toBe("tr_123");
      expect(result.status).toBe("pending");
      expect(result.qrCode).toBe("pix-qr-code-string");
    });

    it("should map credit card request fields correctly", () => {
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
        card: {
          number: "1234 5678 1234 5678",
          holder: "Jane Doe",
          expirationMonth: "12",
          expirationYear: "2029",
          cvv: "123",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.payment_method).toBe("credit_card");
      expect(payload.installments).toBe(3);
      expect(payload.card?.number).toBe("1234567812345678");
      expect(payload.card?.holder_name).toBe("Jane Doe");
      expect(payload.card?.cvv).toBe("123");
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
        json: async () => ({ status: "ok" }),
      });

      const res = await service.validateCredentials({ clientId: "valid_id", clientSecret: "sec" });
      expect(res.isValid).toBe(true);
      expect(res.message).toBe("Conexão com Efí validada com sucesso.");
    });

    it("should process Pix creation successfully", async () => {
      mockHttp.request.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "tr_pix_123",
          status: "pending",
          amount: 25.00,
          pix_qr_code: "pix_code_here",
          expires_at: "2026-03-16T14:15:00.000Z",
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
        credentials: { clientId: "test_key", clientSecret: "sec" },
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
