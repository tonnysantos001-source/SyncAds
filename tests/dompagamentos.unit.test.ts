import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/dompagamentos/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/dompagamentos/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/dompagamentos/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/dompagamentos/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/dompagamentos/v1/webhook.ts";

describe("Dom Pagamentos Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if token is missing", () => {
      const result = Validator.validateCredentials({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token de API (token) é obrigatório.");
    });

    it("should pass validation with token present", () => {
      const result = Validator.validateCredentials({ token: "dom_tok_123" });
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
      expect(payload.payment_method).toBe("pix");
      expect(payload.customer.name).toBe("John Doe");
      expect(payload.customer.document).toBe("12345678910");
      expect(payload.customer.phone).toBe("11999999999");
    });

    it("should map credit card fields", () => {
      const request: any = {
        amount: 100.00,
        orderId: "ord_456",
        paymentMethod: "credit_card",
        customer: {
          name: "Mary Jane",
          email: "mary@example.com",
          document: "123.456.789-10",
        },
        card: {
          number: "1234 5678 9012 3456",
          holderName: "Mary Jane",
          expiryMonth: "12",
          expiryYear: "2030",
          cvv: "123",
        },
        installments: 3,
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.payment_method).toBe("credit_card");
      expect(payload.card?.number).toBe("1234567890123456");
      expect(payload.card?.cvv).toBe("123");
      expect(payload.installments).toBe(3);
    });

    it("should map response correctly", () => {
      const mockResponse: any = {
        id: "tr_987654",
        status: "paid",
        amount: 1550,
        qr_code: "pix-qr-code-data",
        created_at: "2026-06-26T16:00:00Z",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tr_987654");
      expect(result.status).toBe("approved");
      expect(result.qrCode).toBe("pix-qr-code-data");
      expect(result.pixData?.amount).toBe(15.50);
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload correctly", () => {
      const payload = {
        id: "tr_web_123",
        status: "paid",
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("tr_web_123");
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

    it("should validate credentials successfully via ping", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const res = await service.validateCredentials({ token: "valid-token" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("validada com sucesso");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ token: "invalid-token" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("rejeitada pela Dom Pagamentos");
    });
  });
});
