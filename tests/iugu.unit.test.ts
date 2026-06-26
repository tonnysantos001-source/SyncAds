import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/iugu/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/iugu/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/iugu/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/iugu/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/iugu/v1/webhook.ts";

describe("Iugu Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiToken is missing", () => {
      const result = Validator.validateCredentials({ accountId: "acc_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiToken) é obrigatória.");
    });

    it("should fail validation if accountId is missing", () => {
      const result = Validator.validateCredentials({ apiToken: "tok_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Account ID (accountId) é obrigatório.");
    });

    it("should pass validation with apiToken and accountId present", () => {
      const result = Validator.validateCredentials({ apiToken: "tok_123", accountId: "acc_123" });
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
    it("should map request to customer payload correctly", () => {
      const request: any = {
        amount: 10.00,
        orderId: "ord_iugu_01",
        paymentMethod: "pix",
        customer: {
          name: "John Doe",
          email: "john@iugu.com",
          document: "123.456.789-00",
          phone: "11999999999",
        },
      };

      const payload = Mapper.toCustomerPayload(request);
      expect(payload.email).toBe("john@iugu.com");
      expect(payload.name).toBe("John Doe");
      expect(payload.cpf_cnpj).toBe("12345678900");
    });

    it("should map response correctly", () => {
      const mockResponse: any = {
        id: "inv_iugu_999",
        status: "paid",
        total_cents: 1000,
        pix: {
          qrcode: "iugu-qr-code-pix-string",
          qrcode_image_url: "iugu-qr-image",
        },
        created_at: "2026-06-26T20:00:00Z",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("inv_iugu_999");
      expect(result.status).toBe("approved");
      expect(result.qrCode).toBe("iugu-qr-code-pix-string");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        event: "invoice.status_changed",
        data: {
          id: "inv_iugu_999",
          status: "paid",
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("inv_iugu_999");
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

      const res = await service.validateCredentials({ apiToken: "tok_valid", accountId: "acc_valid" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Iugu");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ apiToken: "tok_invalid", accountId: "acc_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pela Iugu");
    });

    it("should process Pix creation successfully", async () => {
      // 1. mock createCustomer
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "cust_123" }),
      });
      // 2. mock createInvoice
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "inv_iugu_100",
          status: "pending",
          total_cents: 5000,
          pix: {
            qrcode: "iugu-qr-code-pix-string",
            qrcode_image_url: "iugu-image-url",
          },
          created_at: "2026-06-26T20:00:00Z",
        }),
      });

      const request: any = {
        amount: 50.00,
        orderId: "ord_sync_iugu",
        paymentMethod: "pix",
        customer: {
          name: "David Gilmour",
          email: "david@pinkfloyd.com",
          document: "123.456.789-02",
          phone: "11977776666",
        },
      };

      const config: any = {
        credentials: { apiToken: "tok_test", accountId: "acc_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(false); // status is pending
      expect(response.transactionId).toBe("inv_iugu_100");
      expect(response.qrCode).toBe("iugu-qr-code-pix-string");
    });
  });
});
