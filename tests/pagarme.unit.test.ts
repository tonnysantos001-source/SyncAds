import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/pagarme/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/pagarme/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/pagarme/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/pagarme/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/pagarme/v1/webhook.ts";

describe("Pagar.me Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({ encryptionKey: "ek_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiKey) é obrigatória.");
    });

    it("should fail validation if encryptionKey is missing", () => {
      const result = Validator.validateCredentials({ apiKey: "sk_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de Criptografia (encryptionKey) é obrigatória.");
    });

    it("should fail validation if apiKey has wrong format", () => {
      const result = Validator.validateCredentials({ apiKey: "wrong_format", encryptionKey: "ek_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API inválida (deve começar com sk_).");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ apiKey: "sk_123", encryptionKey: "ek_123" });
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
        orderId: "ord_pagarme_01",
        paymentMethod: "pix",
        customer: {
          name: "Pagarme Customer",
          email: "pagarme@pagarme.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.code).toBe("ord_pagarme_01");
      expect(payload.customer.name).toBe("Pagarme Customer");
      expect(payload.items[0].amount).toBe(1550);
      expect(payload.payments[0].payment_method).toBe("pix");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        id: "ord_999",
        status: "pending",
        amount: 1550,
        charges: [
          {
            id: "ch_888",
            status: "pending",
            payment_method: "pix",
            last_transaction: {
              id: "tx_777",
              qr_code: "pagarme-qr-code",
              qr_code_url: "pagarme-qr-url",
              expires_at: "2026-06-26T20:00:00Z",
            },
          }
        ],
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(false);
      expect(result.transactionId).toBe("ord_999");
      expect(result.gatewayTransactionId).toBe("ch_888");
      expect(result.qrCode).toBe("pagarme-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("pagarme-qr-url");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        type: "charge.paid",
        data: {
          id: "ch_888",
          status: "paid",
          order: {
            id: "ord_999",
          },
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("ord_999");
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

      const res = await service.validateCredentials({ apiKey: "sk_valid", encryptionKey: "ek_valid" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Pagar.me");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ apiKey: "sk_invalid", encryptionKey: "ek_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pelo Pagar.me");
    });

    it("should process PIX creation successfully", async () => {
      // mock createOrder
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ord_999",
          status: "pending",
          amount: 1550,
          charges: [
            {
              id: "ch_888",
              status: "pending",
              payment_method: "pix",
              last_transaction: {
                id: "tx_777",
                qr_code: "pagarme-qr-code",
                qr_code_url: "pagarme-qr-url",
                expires_at: "2026-06-26T20:00:00Z",
              },
            }
          ],
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_pagarme",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "123.456.789-02",
        },
      };

      const config: any = {
        credentials: { apiKey: "sk_test", encryptionKey: "ek_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(false);
      expect(response.transactionId).toBe("ord_999");
      expect(response.gatewayTransactionId).toBe("ch_888");
      expect(response.qrCode).toBe("pagarme-qr-code");
    });
  });
});
