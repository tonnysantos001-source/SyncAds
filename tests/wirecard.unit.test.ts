import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/wirecard/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/wirecard/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/wirecard/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/wirecard/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/wirecard/v1/webhook.ts";

describe("Wirecard Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if token is missing", () => {
      const result = Validator.validateCredentials({ key: "key_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token (token) é obrigatório.");
    });

    it("should fail validation if key is missing", () => {
      const result = Validator.validateCredentials({ token: "token_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (key) é obrigatória.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ token: "token_123", key: "key_123" });
      expect(result.isValid).toBe(true);
    });

    it("should validate payment request fields", () => {
      const invalidRequest: any = {
        amount: 0,
        customer: { email: "" },
        paymentMethod: "pix",
      };
      
      const result = Validator.validatePaymentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Mapper", () => {
    it("should map request to order payload correctly", () => {
      const request: any = {
        amount: 15.50,
        orderId: "ord_wirecard_01",
        paymentMethod: "pix",
        userId: "usr_123",
        customer: {
          name: "Wirecard Customer",
          email: "wirecard@wirecard.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toOrderPayload(request);
      expect(payload.ownId).toBe("ord_wirecard_01");
      expect(payload.amount.total).toBe(1550);
      expect(payload.customer.fullname).toBe("Wirecard Customer");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        id: "pay_999",
        status: "WAITING",
        amount: {
          total: 1550,
        },
        fundingInstrument: {
          method: "PIX",
        },
        qrCode: {
          text: "wirecard-qr-code",
          image: "wirecard-qr-base64",
          expirationDate: "2026-06-26T20:00:00Z",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse, "ord_wirecard_01");
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("ord_wirecard_01");
      expect(result.gatewayTransactionId).toBe("pay_999");
      expect(result.qrCode).toBe("wirecard-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("wirecard-qr-base64");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        payment: {
          id: "pay_999",
          status: "AUTHORIZED",
        },
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

    it("should validate credentials successfully via ping (200 OK)", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const res = await service.validateCredentials({ token: "token_val", key: "key_val" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão estabelecida com Wirecard");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      const res = await service.validateCredentials({ token: "token_inval", key: "key_inval" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pelo Wirecard");
    });

    it("should process PIX creation successfully (Order + Payment)", async () => {
      // Mock createOrder
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ord_moip_123",
          status: "CREATED",
        }),
      });
      // Mock createPayment
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pay_pix_wirecard",
          status: "WAITING",
          amount: { total: 1550 },
          fundingInstrument: { method: "PIX" },
          qrCode: {
            text: "wirecard-qr-code",
            image: "wirecard-qr-base64",
            expirationDate: "2026-06-26T20:00:00Z"
          }
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_wirecard",
        paymentMethod: "pix",
        userId: "usr_123",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "12345678902",
        },
      };

      const config: any = {
        credentials: { token: "token_test", key: "key_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("ord_sync_wirecard");
      expect(response.qrCode).toBe("wirecard-qr-code");
    });

    it("should process Credit Card creation successfully", async () => {
      // Mock createOrder
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ord_moip_123",
          status: "CREATED",
        }),
      });
      // Mock createPayment
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pay_cc_wirecard",
          status: "AUTHORIZED",
          amount: { total: 1550 },
          fundingInstrument: { method: "CREDIT_CARD" }
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_wirecard_cc",
        paymentMethod: "credit_card",
        userId: "usr_123",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "12345678902",
        },
        card: {
          number: "1234567812345678",
          holderName: "John Frusciante",
          expiryMonth: "12",
          expiryYear: "2030",
          cvv: "123"
        }
      };

      const config: any = {
        credentials: { token: "token_test", key: "key_test" },
        isTestMode: true,
      };

      const response = await service.createCreditCard(request, config);
      expect(response.success).toBe(true);
      expect(response.gatewayTransactionId).toBe("pay_cc_wirecard");
      expect(response.status).toBe("approved");
    });
  });
});
