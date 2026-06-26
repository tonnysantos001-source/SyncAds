import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/webhook.ts";

describe("Rede Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if pv is missing", () => {
      const result = Validator.validateCredentials({ token: "token_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("PV (pv) é obrigatório.");
    });

    it("should fail validation if token is missing", () => {
      const result = Validator.validateCredentials({ pv: "pv_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token de autenticação (token) é obrigatório.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ pv: "pv_123", token: "token_123" });
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

    it("should validate card specific fields for credit card", () => {
      const invalidRequest: any = {
        amount: 10.00,
        orderId: "ord_123",
        customer: { email: "test@test.com" },
        paymentMethod: "credit_card",
        card: null
      };
      
      const result = Validator.validatePaymentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Dados do cartão são obrigatórios para pagamento via cartão.");
    });
  });

  describe("Mapper", () => {
    it("should map request to payment payload correctly for PIX", () => {
      const request: any = {
        amount: 15.50,
        orderId: "ord_rede_01",
        paymentMethod: "pix",
        customer: {
          name: "Rede Customer",
          email: "rede@rede.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.capture).toBe(true);
      expect(payload.kind).toBe("pix");
      expect(payload.reference).toBe("ord_rede_01");
      expect(payload.amount).toBe(1550);
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        tid: "tid_999",
        reference: "ord_rede_01",
        returnCode: "01",
        kind: "pix",
        pix: {
          qrCode: "rede-qr-code",
          qrCodeBase64: "rede-qr-base64",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("ord_rede_01");
      expect(result.gatewayTransactionId).toBe("tid_999");
      expect(result.qrCode).toBe("rede-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("rede-qr-base64");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        tid: "tid_999",
        returnCode: "00",
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("tid_999");
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
        status: 200,
        json: async () => ({}),
      });

      const res = await service.validateCredentials({ pv: "pv_val", token: "token_val" });
      expect(res.isValid).toBe(true);
      expect(res.message).toContain("Conexão com a Rede estabelecida");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      const res = await service.validateCredentials({ pv: "pv_inval", token: "token_inval" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pela Rede");
    });

    it("should process PIX creation successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tid: "tid_pix_rede",
          reference: "ord_sync_rede",
          returnCode: "01",
          pix: {
            qrCode: "rede-qr-code",
            qrCodeBase64: "rede-qr-base64",
          },
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_rede",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "12345678902",
        },
      };

      const config: any = {
        credentials: { pv: "pv_test", token: "token_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(true);
      expect(response.transactionId).toBe("ord_sync_rede");
      expect(response.qrCode).toBe("rede-qr-code");
    });

    it("should process Credit Card creation successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tid: "tid_cc_rede",
          reference: "ord_sync_rede_cc",
          returnCode: "00",
          nsu: "12345",
          authorizationCode: "auth123",
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_rede_cc",
        paymentMethod: "credit_card",
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
        credentials: { pv: "pv_test", token: "token_test" },
        isTestMode: true,
      };

      const response = await service.createCreditCard(request, config);
      expect(response.success).toBe(true);
      expect(response.gatewayTransactionId).toBe("tid_cc_rede");
      expect(response.status).toBe("approved");
    });

    it("should consult transaction successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tid: "tid_cc_rede",
          reference: "ord_sync_rede_cc",
          returnCode: "00",
          amount: 1550,
          dateTime: "2026-06-26T20:00:00Z",
          kind: "credit",
        }),
      });

      const config: any = {
        credentials: { pv: "pv_test", token: "token_test" },
        isTestMode: true,
      };

      const statusRes = await service.consultPayment("tid_cc_rede", config);
      expect(statusRes.status).toBe("approved");
      expect(statusRes.amount).toBe(15.50);
    });

    it("should refund transaction successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tid: "tid_cc_rede",
          refundId: "ref_123",
        }),
      });

      const config: any = {
        credentials: { pv: "pv_test", token: "token_test" },
        isTestMode: true,
      };

      const refundRes = await service.refundPayment({
        transactionId: "ord_sync_rede_cc",
        gatewayTransactionId: "tid_cc_rede",
        amount: 15.50
      }, config);
      expect(refundRes.success).toBe(true);
      expect(refundRes.refundId).toBe("ref_123");
    });
  });
});
