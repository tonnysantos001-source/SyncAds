import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/stone/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/stone/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/stone/v1/webhook.ts";

const validCreds = { merchantId: "stone_merch_xyz", apiKey: "sec_12345" };
const validRequest: any = {
  orderId: "ORDER-ST-001", amount: 150.00, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLOS SILVA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("Stone Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita merchantId vazio", () => expect(Validator.validateCredentials({ ...validCreds, merchantId: "" }).isValid).toBe(false));
  it("rejeita apiKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, apiKey: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Stone Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest, "stone_merch_xyz");
    expect(p.amount).toBe(15000);
  });
  it("mapeia status Stone: approved → approved", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status Stone: declined → failed", () => expect(Mapper.toPaymentStatus("declined")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "pay_555", status: "approved", amount: 15000 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-ST-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("pay_555");
  });
});

describe("Stone WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { payment_id: "pay_555", status: "approved" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("pay_555");
  });
  it("rejeita webhook sem payment_id", () => {
    expect(WebhookHandler.handle({ status: "approved" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
