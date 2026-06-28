import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/adyen/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/adyen/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/adyen/v1/webhook.ts";

const validCreds = { apiKey: "adyen_key_123", merchantAccount: "SuaLojaBR" };
const validRequest: any = {
  orderId: "ORDER-AD-001",
  amount: 250.00,
  paymentMethod: "credit_card",
  customer: { name: "Maria Oliveira", email: "maria@example.com" },
  card: { number: "4111111111111111", holderName: "MARIA OLIVEIRA", expMonth: "12", expYear: "29", cvv: "123" }
};

describe("Adyen Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita apiKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, apiKey: "" }).isValid).toBe(false));
  it("rejeita merchantAccount vazio", () => expect(Validator.validateCredentials({ ...validCreds, merchantAccount: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Adyen Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest, "SuaLojaBR");
    expect(p.amount.value).toBe(25000);
  });
  it("mapeia status Adyen: Authorised → approved", () => expect(Mapper.toPaymentStatus("Authorised")).toBe("approved"));
  it("mapeia status Adyen: Refused → failed", () => expect(Mapper.toPaymentStatus("Refused")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { pspReference: "psp_888", resultCode: "Authorised", amount: { value: 25000, currency: "BRL" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-AD-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("psp_888");
  });
});

describe("Adyen WebhookHandler", () => {
  it("processa webhook de transação autorizada", () => {
    const payload = {
      notificationItems: [
        {
          NotificationRequestItem: {
            pspReference: "psp_888",
            eventCode: "AUTHORISATION",
            success: "true"
          }
        }
      ]
    };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("psp_888");
  });
  it("rejeita webhook sem pspReference", () => {
    expect(WebhookHandler.handle({}).success).toBe(false);
  });
});
