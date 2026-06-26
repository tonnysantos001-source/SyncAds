import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/appmax/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/appmax/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/appmax/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/appmax/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/appmax/v1/webhook.ts";

describe("Appmax Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiKey) é obrigatória.");
    });

    it("should pass validation with apiKey present", () => {
      const result = Validator.validateCredentials({ apiKey: "appmax_key_123" });
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
    it("should map customer request to payload correctly", () => {
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

      const payload = Mapper.toCustomerPayload(request);
      expect(payload.name).toBe("John Doe");
      expect(payload.email).toBe("john@example.com");
      expect(payload.document_number).toBe("12345678910");
      expect(payload.phone).toBe("5511999999999");
    });

    it("should map order request correctly", () => {
      const request: any = {
        amount: 15.50,
        orderId: "ord_123",
      };

      const payload = Mapper.toOrderPayload(request);
      expect(payload.products[0].sku).toBe("ord_123");
      expect(payload.products[0].price).toBe(15.50);
      expect(payload.products[0].qty).toBe(1);
    });

    it("should map payment methods", () => {
      const request: any = {
        paymentMethod: "pix",
        customer: {
          document: "123.456.789-10",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.Pix.document_number).toBe("12345678910");
    });

    it("should map response correctly", () => {
      const mockResponse: any = {
        status: 200,
        success: true,
        data: {
          id: 987654,
          status: "paid",
          pix_code: "pix-qr-code-data",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("987654");
      expect(result.status).toBe("approved");
      expect(result.qrCode).toBe("pix-qr-code-data");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload correctly", () => {
      const payload = {
        data: {
          id: "123456",
          status: "approved",
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("123456");
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
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      const res = await service.validateCredentials({ apiKey: "valid-token" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("validada com sucesso");
    });

    it("should handle invalid credentials (401)", async () => {
      mockHttp.request.mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: async () => ({ message: "Wrong credentials" }),
      });

      const res = await service.validateCredentials({ apiKey: "invalid-token" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("rejeitada pela Appmax");
    });

    it("should process Pix payment successfully running the 3-step sequence", async () => {
      // Step 1: Customer creation mock
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 73913870 },
        }),
      });

      // Step 2: Order creation mock
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 123456 },
        }),
      });

      // Step 3: Payment creation mock
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 987654,
            status: "pending",
            pix_code: "appmax-pix-payload-qr",
          },
        }),
      });

      const request: any = {
        amount: 50.00,
        orderId: "ord_sync_77",
        paymentMethod: "pix",
        customer: {
          name: "Alice Smith",
          email: "alice@example.com",
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
      expect(response.transactionId).toBe("987654");
      expect(response.qrCode).toBe("appmax-pix-payload-qr");
      expect(mockHttp.request).toHaveBeenCalledTimes(3);
    });
  });
});
