import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/webhook.ts";

const validCreds = { merchantId: "cielo_merch_id_xyz", merchantKey: "sec_12345" };
const validRequest: any = {
  orderId: "ORDER-CIE-001", amount: 150.00, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLOS SILVA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("Cielo Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita merchantId vazio", () => expect(Validator.validateCredentials({ ...validCreds, merchantId: "" }).isValid).toBe(false));
  it("rejeita merchantKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, merchantKey: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Cielo Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest);
    expect(p.Payment.Amount).toBe(15000);
  });
  it("mapeia status Cielo: 2 → approved", () => expect(Mapper.toPaymentStatus(2)).toBe("approved"));
  it("mapeia status Cielo: 3 → failed", () => expect(Mapper.toPaymentStatus(3)).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { Payment: { PaymentId: "ch_555", Status: 2, Amount: 15000, ReturnMessage: "Success" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-CIE-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("ch_555");
  });
});

describe("Cielo WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { PaymentId: "ch_555", Payment: { Status: 2 } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ch_555");
  });
  it("rejeita webhook sem PaymentId", () => {
    expect(WebhookHandler.handle({ Payment: { Status: 2 } }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
