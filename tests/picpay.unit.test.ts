import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/picpay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/picpay/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/picpay/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/picpay/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/picpay/v1/webhook.ts";

describe("PicPay Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if picpayToken is missing", () => {
      const result = Validator.validateCredentials({ sellerToken: "seller_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("PicPay Token (picpayToken) é obrigatório.");
    });

    it("should fail validation if sellerToken is missing", () => {
      const result = Validator.validateCredentials({ picpayToken: "token_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Seller Token (sellerToken) é obrigatório.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ picpayToken: "token_123", sellerToken: "seller_123" });
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
        orderId: "ord_picpay_01",
        paymentMethod: "pix",
        customer: {
          name: "PicPay Customer",
          email: "picpay@picpay.com",
          document: "123.456.789-00",
          phone: "11988887777",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.value).toBe(15.50);
      expect(payload.referenceId).toBe("ord_picpay_01");
      expect(payload.buyer.firstName).toBe("PicPay");
      expect(payload.buyer.lastName).toBe("Customer");
      expect(payload.buyer.document).toBe("12345678900");
      expect(payload.buyer.phone).toBe("+5511988887777");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        referenceId: "ord_picpay_01",
        paymentUrl: "https://picpay.com/payment",
        expiresAt: "2026-06-26T20:00:00Z",
        qrcode: {
          content: "picpay-qr-code",
          base64: "picpay-qr-base64",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("ord_picpay_01");
      expect(result.gatewayTransactionId).toBe("ord_picpay_01");
      expect(result.qrCode).toBe("picpay-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("picpay-qr-base64");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        referenceId: "ord_picpay_01",
        authorizationId: "auth_999",
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("ord_picpay_01");
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

      const res = await service.validateCredentials({ picpayToken: "token_val", sellerToken: "seller_val" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com sucesso");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ picpayToken: "token_inval", sellerToken: "seller_inval" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Credenciais inválidas");
    });

    it("should process PIX creation successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          referenceId: "ord_sync_picpay",
          paymentUrl: "https://picpay.com/payment",
          expiresAt: "2026-06-26T20:00:00Z",
          qrcode: {
            content: "picpay-qr-code",
            base64: "picpay-qr-base64",
          },
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_picpay",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "123.456.789-02",
        },
      };

      const config: any = {
        credentials: { picpayToken: "token_test", sellerToken: "seller_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("ord_sync_picpay");
      expect(response.gatewayTransactionId).toBe("ord_sync_picpay");
      expect(response.qrCode).toBe("picpay-qr-code");
    });

    it("should consult payment status successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          referenceId: "ord_sync_picpay",
          authorizationId: "auth_123",
          status: "paid",
          value: 15.50,
        }),
      });

      const config: any = {
        credentials: { picpayToken: "token_test", sellerToken: "seller_test" },
        isTestMode: true,
      };

      const statusRes = await service.consultPayment("ord_sync_picpay", config);
      expect(statusRes.status).toBe("approved");
      expect(statusRes.amount).toBe(15.50);
      expect(statusRes.gatewayTransactionId).toBe("auth_123");
    });

    it("should cancel payment successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "cancelled",
        }),
      });

      const config: any = {
        credentials: { picpayToken: "token_test", sellerToken: "seller_test" },
        isTestMode: true,
      };

      const cancelRes = await service.cancelPayment("ord_sync_picpay", config);
      expect(cancelRes.success).toBe(true);
      expect(cancelRes.status).toBe("cancelled");
    });
  });
});
