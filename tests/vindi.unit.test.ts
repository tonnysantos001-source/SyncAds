import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/vindi/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/vindi/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/vindi/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/vindi/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/vindi/v1/webhook.ts";

describe("Vindi Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiKey) é obrigatória.");
    });

    it("should pass validation with apiKey present", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123" });
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
        amount: 15.00,
        orderId: "ord_vindi_01",
        paymentMethod: "boleto",
        customer: {
          name: "Vindi User",
          email: "vindi@vindi.com",
          document: "123.456.789-00",
          phone: "11999999999",
        },
      };

      const payload = Mapper.toCustomerPayload(request);
      expect(payload.email).toBe("vindi@vindi.com");
      expect(payload.name).toBe("Vindi User");
      expect(payload.registry_code).toBe("12345678900");
    });

    it("should map response correctly", () => {
      const mockResponse: any = {
        id: 777,
        status: "paid",
        amount: 15.00,
        payment_method: { code: "bank_slip" },
        charges: [
          {
            id: 888,
            print_url: "vindi-boleto-print-url",
            bank_slip_barcode: "vindi-barcode",
            bank_slip_line: "vindi-line",
          }
        ],
        created_at: "2026-06-26T20:00:00Z",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("777");
      expect(result.status).toBe("approved");
      expect(result.paymentUrl).toBe("vindi-boleto-print-url");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        bill: {
          id: 777,
          status: "paid",
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("777");
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

      const res = await service.validateCredentials({ apiKey: "key_valid" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Vindi");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ apiKey: "key_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pela Vindi");
    });

    it("should process Boleto creation successfully", async () => {
      // 1. mock getCustomerByQuery
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customers: [] }),
      });
      // 2. mock createCustomer
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customer: { id: 10 } }),
      });
      // 3. mock createBill
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 777,
          status: "pending",
          amount: 50.00,
          payment_method: { code: "bank_slip" },
          charges: [
            {
              id: 888,
              print_url: "vindi-boleto-print-url",
              bank_slip_barcode: "vindi-barcode",
              bank_slip_line: "vindi-line",
            }
          ],
          created_at: "2026-06-26T20:00:00Z",
        }),
      });

      const request: any = {
        amount: 50.00,
        orderId: "ord_sync_vindi",
        paymentMethod: "boleto",
        customer: {
          name: "Roger Waters",
          email: "roger@pinkfloyd.com",
          document: "123.456.789-02",
          phone: "11977776666",
        },
      };

      const config: any = {
        credentials: { apiKey: "key_test" },
        isTestMode: true,
      };

      const response = await service.createBoleto(request, config);
      expect(response.success).toBe(false); // status is pending
      expect(response.transactionId).toBe("777");
      expect(response.paymentUrl).toBe("vindi-boleto-print-url");
    });
  });
});
