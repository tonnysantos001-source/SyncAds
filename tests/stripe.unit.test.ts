import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/stripe/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/stripe/v1/mapper.ts";
import { Service } from "../supabase/functions/integrations/domain/payment/providers/stripe/v1/service.ts";
import { Client } from "../supabase/functions/integrations/domain/payment/providers/stripe/v1/client.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/stripe/v1/webhook.ts";

describe("Stripe Provider - Unit Tests", () => {
  describe("Validator", () => {
    it("should fail validation if publishableKey is missing", () => {
      const result = Validator.validateCredentials({ secretKey: "sk_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Publishable Key (publishableKey) é obrigatório para o Stripe.");
    });

    it("should fail validation if secretKey is missing", () => {
      const result = Validator.validateCredentials({ publishableKey: "pk_123" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Secret Key (secretKey) é obrigatório para o Stripe.");
    });

    it("should pass validation with valid credentials", () => {
      const result = Validator.validateCredentials({ publishableKey: "pk_123", secretKey: "sk_123" });
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
        amount: 50.00,
        orderId: "ord_stripe_01",
        paymentMethod: "pix",
        customer: {
          name: "Stripe Customer",
          email: "stripe@stripe.com",
          document: "123.456.789-00",
        },
      };

      const payload = Mapper.toPaymentPayload(request);
      expect(payload.amount).toBe(5000); // 50.00 BRL in cents
      expect(payload["metadata[order_id]"]).toBe("ord_stripe_01");
    });

    it("should map response correctly for PIX", () => {
      const mockResponse: any = {
        id: "pi_stripe_999",
        status: "succeeded",
      };

      const result = Mapper.toPaymentResponse(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("pi_stripe_999");
      expect(result.status).toBe("approved");
    });
  });

  describe("WebhookHandler", () => {
    it("should handle webhook payload", () => {
      const payload = {
        data: {
          object: {
            id: "pi_stripe_999",
            status: "succeeded",
          }
        }
      };
      const result = WebhookHandler.handle(payload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.transactionId).toBe("pi_stripe_999");
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
        publishableKey: "pk_123",
        secretKey: "sk_123",
      });

      expect(result.isValid).toBe(true);
      expect(mockHttp.request).toHaveBeenCalledTimes(1);
    });

    it("should process PIX payment successfully", async () => {
      mockHttp.request.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "pi_stripe_01",
          status: "processing",
        }),
      });

      const request: any = {
        orderId: "ord_1",
        amount: 50.00,
        paymentMethod: "pix",
        customer: {
          name: "Test Customer",
          email: "test@test.com",
          document: "12345678900",
        },
      };

      const integrationConfig: any = {
        credentials: { publishableKey: "pk_123", secretKey: "sk_123" },
        isTestMode: true,
      };

      const result = await service.createPix(request, integrationConfig);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("pi_stripe_01");
    });
  });
});
