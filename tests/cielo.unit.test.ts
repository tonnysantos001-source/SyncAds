import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/webhook.ts";

describe("Cielo Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if merchantId is missing", () => {
      const result = Validator.validateCredentials({ merchantKey: "key_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Merchant ID (merchantId) é obrigatório.");
    });

    it("should fail validation if merchantKey is missing", () => {
      const result = Validator.validateCredentials({ merchantId: "id_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Merchant Key (merchantKey) é obrigatória.");
    });

    it("should pass validation with merchantId and merchantKey present", () => {
      const result = Validator.validateCredentials({ merchantId: "id_123", merchantKey: "key_123" });
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
        orderId: "ord_cielo_01",
        paymentMethod: "pix",
        customer: {
          name: "Cielo Customer",
          email: "cielo@cielo.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.MerchantOrderId).toBe("ord_cielo_01");
      expect(payload.Customer.Name).toBe("Cielo Customer");
      expect(payload.Payment.Amount).toBe(1550);
      expect(payload.Payment.Type).toBe("Pix");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        MerchantOrderId: "ord_cielo_01",
        Payment: {
          PaymentId: "pay_999",
          Type: "Pix",
          Amount: 1550,
          Status: 12,
          QrCodeString: "cielo-qr-code",
          QrCodeBase64Image: "cielo-qr-base64",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("ord_cielo_01");
      expect(result.gatewayTransactionId).toBe("pay_999");
      expect(result.qrCode).toBe("cielo-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("cielo-qr-base64");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        PaymentId: "pay_999",
        Status: 2,
        Amount: 1550,
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("pay_999");
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

    it("should validate credentials successfully via ping (404 Not Found is treated as valid headers route)", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      });

      const res = await service.validateCredentials({ merchantId: "id_valid", merchantKey: "key_valid" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Cielo");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      const res = await service.validateCredentials({ merchantId: "id_invalid", merchantKey: "key_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pela Cielo");
    });

    it("should process PIX creation successfully", async () => {
      // mock createSale
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MerchantOrderId: "ord_sync_cielo",
          Payment: {
            PaymentId: "pay_999",
            Type: "Pix",
            Amount: 1550,
            Status: 12,
            QrCodeString: "cielo-qr-code",
            QrCodeBase64Image: "cielo-qr-base64",
          },
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_cielo",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "123.456.789-02",
        },
      };

      const config: any = {
        credentials: { merchantId: "id_test", merchantKey: "key_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("ord_sync_cielo");
      expect(response.gatewayTransactionId).toBe("pay_999");
      expect(response.qrCode).toBe("cielo-qr-code");
    });
  });
});
