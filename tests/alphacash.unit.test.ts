import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/alphacash/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/alphacash/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/alphacash/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/alphacash/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/alphacash/v1/webhook.ts";

describe("Alphacash Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if apiKey is missing", () => {
      const result = Validator.validateCredentials({ secretKey: "sec_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave de API (apiKey) é obrigatória para o Alphacash.");
    });

    it("should fail validation if secretKey is missing", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Chave Secreta (secretKey) é obrigatória para o Alphacash.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ apiKey: "key_123", secretKey: "sec_123" });
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
        amount: 15.50,
        orderId: "ord_alphacash_01",
        paymentMethod: "credit_card",
        customer: {
          name: "Alphacash Customer",
          email: "alphacash@alphacash.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.transaction_id).toBe("ord_alphacash_01");
      expect(payload.amount).toBe(15.50);
    });

    it("should map response correctly for Credit Card", () => {
      const mockResponse: any = {
        transaction_id: "pay_999",
        status: "success",
        payment_url: "https://alphacash.com/pay",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("pay_999");
      expect(result.paymentUrl).toBe("https://alphacash.com/pay");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        transaction_id: "pay_999",
        status: "success",
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
        apiKey: "key_123",
        secretKey: "sec_123",
      });

      expect(result.isValid).toBe(true);
      expect(mockHttp.request).toHaveBeenCalledTimes(1);
    });

    it("should process Credit Card payment successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          transaction_id: "tx_alphacash_01",
          status: "success",
          payment_url: "https://alphacash.com/pay",
        }),
      });

      const request: any = {
        orderId: "ord_1",
        amount: 50.00,
        paymentMethod: "credit_card",
        customer: {
          name: "Test Customer",
          email: "test@test.com",
          document: "12345678900",
        },
      };

      const integrationConfig: any = {
        credentials: { apiKey: "key_123", secretKey: "sec_123" },
        isTestMode: true,
      };

      const result = await service.createCreditCard(request, integrationConfig);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("tx_alphacash_01");
      expect(result.paymentUrl).toBe("https://alphacash.com/pay");
    });
  });
});
