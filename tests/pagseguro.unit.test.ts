import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/pagseguro/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/pagseguro/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/pagseguro/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/pagseguro/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/pagseguro/v1/webhook.ts";

describe("PagSeguro Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if email is missing", () => {
      const result = Validator.validateCredentials({ token: "tok_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("E-mail (email) é obrigatório.");
    });

    it("should fail validation if token is missing", () => {
      const result = Validator.validateCredentials({ email: "test@test.com" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token de API (token) é obrigatório.");
    });

    it("should pass validation with email and token present", () => {
      const result = Validator.validateCredentials({ email: "test@test.com", token: "tok_123" });
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
        orderId: "ord_pagseguro_01",
        paymentMethod: "pix",
        customer: {
          name: "PagSeguro Customer",
          email: "pagseguro@pagseguro.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.reference_id).toBe("ord_pagseguro_01");
      expect(payload.customer.name).toBe("PagSeguro Customer");
      expect(payload.items[0].unit_amount).toBe(1550);
      expect(payload.qr_codes?.[0].amount.value).toBe(1550);
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        id: "ord_999",
        reference_id: "ord_pagseguro_01",
        qr_codes: [
          {
            text: "pagseguro-qr-code",
            links: [
              { rel: "QRCODE.PNG", href: "qrcode-png-url" }
            ],
            expiration_date: "2026-06-26T20:00:00Z",
          }
        ],
        links: [
          { rel: "PAY", href: "pay-url" }
        ],
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("ord_pagseguro_01");
      expect(result.gatewayTransactionId).toBe("ord_999");
      expect(result.qrCode).toBe("pagseguro-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("qrcode-png-url");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        id: "evt_999",
        reference_id: "ord_pagseguro_01",
        charges: [
          {
            id: "ch_888",
            status: "PAID",
          }
        ],
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("ord_pagseguro_01");
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

      const res = await service.validateCredentials({ email: "test@test.com", token: "tok_valid" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com PagSeguro");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ email: "test@test.com", token: "tok_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pelo PagSeguro");
    });

    it("should process PIX creation successfully", async () => {
      // mock createOrder
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ord_999",
          reference_id: "ord_sync_pagseguro",
          qr_codes: [
            {
              text: "pagseguro-qr-code",
              links: [
                { rel: "QRCODE.PNG", href: "qrcode-png-url" }
              ],
              expiration_date: "2026-06-26T20:00:00Z",
            }
          ],
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_pagseguro",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "123.456.789-02",
        },
      };

      const config: any = {
        credentials: { email: "test@test.com", token: "tok_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("ord_sync_pagseguro");
      expect(response.gatewayTransactionId).toBe("ord_999");
      expect(response.qrCode).toBe("pagseguro-qr-code");
    });
  });
});
