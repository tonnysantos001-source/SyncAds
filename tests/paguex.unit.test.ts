import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/paguex/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/paguex/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/paguex/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/paguex/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/paguex/v1/webhook.ts";

describe("Pague-X Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if publicKey is missing", () => {
      const result = Validator.validateCredentials({ secretKey: "sec_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave Pública (publicKey) é obrigatória para o Pague-X.");
    });

    it("should fail validation if secretKey is missing", () => {
      const result = Validator.validateCredentials({ publicKey: "pub_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave Secreta (secretKey) é obrigatória para o Pague-X.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ publicKey: "pub_123", secretKey: "sec_123" });
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
    it("should map request to payment payload correctly", () => {
      const request: any = {
        amount: 150.00,
        orderId: "ord_paguex_01",
        paymentMethod: "pix",
        customer: {
          name: "PagueX Customer",
          email: "customer@paguex.com",
          document: "123.456.789-00",
          phone: "(11) 99999-9999",
        },
        billingAddress: {
          street: "Rua Exemplo",
          number: "123",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567",
        },
      };

      const payload = Mapper.toPaymentPayload(request, "https://webhook.com");
      expect(payload.amount).toBe(15000); // 150.00 * 100
      expect(payload.currency).toBe("BRL");
      expect(payload.customer.name).toBe("PagueX Customer");
      expect(payload.customer.phone).toBe("+5511999999999");
      expect(payload.customer.document.number).toBe("12345678900");
      expect(payload.customer.address?.zipCode).toBe("01234567");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        id: "tx_999",
        status: "pending",
        pix: {
          qrcode: "paguex-qr-code",
          qrcodeImage: "base64image",
          expirationDate: "2026-06-30T18:00:00Z",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse, 150.00);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tx_999");
      expect(result.pixData?.qrCode).toBe("paguex-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("base64image");
    });

    it("should map response correctly for Boleto", () => {
      const mockResponse: any = {
        id: "tx_888",
        status: "waiting_payment",
        boleto: {
          url: "https://boleto.com",
          barcode: "123456",
          digitableLine: "654321",
          expirationDate: "2026-06-30T18:00:00Z",
        },
      };

      const result = Mapper.toPaymentResponse(mockResponse, 150.00);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tx_888");
      expect(result.boletoData?.boletoUrl).toBe("https://boleto.com");
      expect(result.boletoData?.digitableLine).toBe("654321");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        objectId: "tx_999",
        data: {
          id: "tx_999",
          status: "approved",
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("tx_999");
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
        error: vi.fn(),
        warn: vi.fn(),
      };
      mockCrypto = {};
      mockCache = {};
      mockMetrics = {};

      service = new Service(
        mockHttp,
        mockLogger,
        mockCrypto,
        mockCache,
        mockMetrics
      );
    });

    it("should ping successfully on validateCredentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const result = await service.validateCredentials({
        publicKey: "pub_123",
        secretKey: "sec_123",
      });

      expect(result.isValid).toBe(true);
      expect(mockHttp.request).toHaveBeenCalledTimes(1);
    });

    it("should process PIX payment successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "tx_pix_01",
          status: "pending",
          pix: {
            qrcode: "qrcode_data",
            qrcodeImage: "qrcode_img",
            expirationDate: "exp_date",
          },
        }),
      });

      const request: any = {
        orderId: "ord_1",
        amount: 50.00,
        paymentMethod: "pix",
        customer: {
          name: "Test Customer",
          email: "test@test.com",
          document: "123.456.789-00",
        },
      };

      const integrationConfig: any = {
        credentials: { publicKey: "pub_123", secretKey: "sec_123" },
        isTestMode: true,
      };

      const result = await service.createPix(request, integrationConfig);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tx_pix_01");
      expect(result.pixData?.qrCode).toBe("qrcode_data");
    });
  });
});
