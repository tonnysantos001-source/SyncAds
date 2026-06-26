import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/asaas/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/asaas/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/asaas/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/asaas/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/asaas/v1/webhook.ts";

describe("Asaas Provider - Unit Tests", () => {
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
    it("should map request to payment payload correctly", () => {
      const request: any = {
        amount: 15.50,
        orderId: "ord_asaas_01",
        paymentMethod: "pix",
        customer: {
          name: "Asaas Customer",
          email: "asaas@asaas.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request, "cus_123");
      expect(payload.customer).toBe("cus_123");
      expect(payload.value).toBe(15.50);
      expect(payload.billingType).toBe("PIX");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        id: "pay_999",
        status: "PENDING",
        value: 15.50,
        dueDate: "2026-06-26",
        invoiceUrl: "invoice-url",
      };

      const mockPixData = {
        payload: "pix-qr-code",
        encodedImage: "pix-qr-base64",
      };

      const result = Mapper.toPaymentResponse(mockResponse, mockPixData);
      expect(result.success).toBe(false);
      expect(result.gatewayTransactionId).toBe("pay_999");
      expect(result.qrCode).toBe("pix-qr-code");
      expect(result.pixData?.qrCodeBase64).toBe("pix-qr-base64");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        event: "PAYMENT_RECEIVED",
        payment: {
          id: "pay_999",
          status: "RECEIVED",
          externalReference: "ord_asaas_01",
        },
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("ord_asaas_01");
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
      expect(res.message).toContain("Conexão estabelecida com Asaas");
    });

    it("should handle invalid credentials", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ errors: [{ description: "Unauthorized" }] }),
      });

      const res = await service.validateCredentials({ apiKey: "key_invalid" });
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Conexão rejeitada pelo Asaas");
    });

    it("should process PIX creation successfully", async () => {
      // 1. mock getCustomerByCpfCnpj
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      // 2. mock createCustomer
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "cus_123" }),
      });
      // 3. mock createCharge
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pay_999",
          status: "PENDING",
          value: 15.50,
          dueDate: "2026-06-26",
          invoiceUrl: "invoice-url",
          externalReference: "ord_sync_asaas",
        }),
      });
      // 4. mock getPixQrCode
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payload: "pix-qr-code",
          encodedImage: "pix-qr-base64",
        }),
      });

      const request: any = {
        amount: 15.50,
        orderId: "ord_sync_asaas",
        paymentMethod: "pix",
        customer: {
          name: "John Frusciante",
          email: "john@rhcp.com",
          document: "123.456.789-02",
          phone: "11977776666",
        },
      };

      const config: any = {
        credentials: { apiKey: "key_test" },
        isTestMode: true,
      };

      const response = await service.createPix(request, config);
      expect(response.success).toBe(false);
      expect(response.transactionId).toBe("ord_sync_asaas");
      expect(response.gatewayTransactionId).toBe("pay_999");
      expect(response.qrCode).toBe("pix-qr-code");
    });
  });
});
